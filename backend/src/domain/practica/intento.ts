import { Actividad, OpcionActividad } from './actividad.js';
import {
  IntentoFinalizadoError,
  PreguntaYaRespondidaError,
  RespuestaInvalidaError,
} from './errores.js';

export interface RespuestaDada {
  preguntaId: string;
  opcionId: string;
  esCorrecta: boolean;
  respondidaEn: Date;
}

export interface Calificacion {
  respuestasCorrectas: number;
  totalPreguntas: number;
  /** Redondeado a entero. */
  porcentaje: number;
  aprobado: boolean;
  porcentajeAprobacion: number;
}

export interface RespuestaCalificada {
  esCorrecta: boolean;
  /** Para «Casi. La respuesta correcta es…». */
  opcionCorrecta: Pick<OpcionActividad, 'id' | 'texto'>;
  explicacion: string;
}

export function evaluarRespuestaActividad(
  actividad: Actividad,
  preguntaId: string,
  opcionId: string,
): RespuestaCalificada {
  const pregunta = actividad.preguntas.find((p) => p.id === preguntaId);
  const elegida = pregunta?.opciones.find((o) => o.id === opcionId);
  if (!pregunta || !elegida) throw new RespuestaInvalidaError();
  const correcta = pregunta.opciones.find((o) => o.esCorrecta);
  if (!correcta) {
    throw new Error(`La pregunta ${pregunta.id} no tiene opción correcta`);
  }
  return {
    esCorrecta: elegida.esCorrecta,
    opcionCorrecta: { id: correcta.id, texto: correcta.texto },
    explicacion: pregunta.explicacion,
  };
}

export interface IntentoProps {
  id: string;
  actividad: Actividad;
  /** Cédula del usuario público; los visitantes sin cuenta no persisten intentos. */
  usuarioId: string;
  respuestas: RespuestaDada[];
  iniciadoEn: Date;
  finalizadoEn: Date | null;
}

/**
 * Una vez que alguien hace la actividad (HU-21). Se responde una pregunta a la vez y,
 * con la última, el intento termina y queda calificado. Para repetir se empieza otro.
 */
export class Intento {
  private constructor(private readonly props: IntentoProps) {}

  static iniciar(datos: {
    id: string;
    actividad: Actividad;
    usuarioId: string;
    ahora: Date;
  }): Intento {
    return new Intento({
      id: datos.id,
      actividad: datos.actividad,
      usuarioId: datos.usuarioId,
      respuestas: [],
      iniciadoEn: datos.ahora,
      finalizadoEn: null,
    });
  }

  static reconstituir(props: IntentoProps): Intento {
    return new Intento({ ...props, respuestas: [...props.respuestas] });
  }

  get id(): string {
    return this.props.id;
  }
  get actividadId(): string {
    return this.props.actividad.id;
  }
  get usuarioId(): string {
    return this.props.usuarioId;
  }
  get respuestas(): readonly RespuestaDada[] {
    return this.props.respuestas;
  }
  get iniciadoEn(): Date {
    return this.props.iniciadoEn;
  }
  get finalizadoEn(): Date | null {
    return this.props.finalizadoEn;
  }
  get totalPreguntas(): number {
    return this.props.actividad.preguntas.length;
  }

  /** Solo el usuario público dueño del intento puede responderlo. */
  perteneceA(usuarioId: string): boolean {
    return this.props.usuarioId === usuarioId;
  }

  responder(
    preguntaId: string,
    opcionId: string,
    ahora: Date,
  ): RespuestaCalificada {
    if (this.props.finalizadoEn) throw new IntentoFinalizadoError();
    const resultado = evaluarRespuestaActividad(
      this.props.actividad,
      preguntaId,
      opcionId,
    );
    if (this.props.respuestas.some((r) => r.preguntaId === preguntaId)) {
      throw new PreguntaYaRespondidaError();
    }

    this.props.respuestas.push({
      preguntaId,
      opcionId,
      esCorrecta: resultado.esCorrecta,
      respondidaEn: ahora,
    });
    if (this.props.respuestas.length === this.totalPreguntas) {
      this.props.finalizadoEn = ahora;
    }
    return resultado;
  }

  /** Aciertos hasta ahora y si alcanzan el porcentaje de aprobación de la actividad. */
  calificar(): Calificacion {
    const totalPreguntas = this.totalPreguntas;
    const respuestasCorrectas = this.props.respuestas.filter(
      (r) => r.esCorrecta,
    ).length;
    const { porcentajeAprobacion } = this.props.actividad;
    return {
      respuestasCorrectas,
      totalPreguntas,
      porcentaje: Math.round((respuestasCorrectas * 100) / totalPreguntas),
      // Sin redondear: 69,5 % no aprueba una actividad del 70 %.
      aprobado:
        respuestasCorrectas * 100 >= porcentajeAprobacion * totalPreguntas,
      porcentajeAprobacion,
    };
  }
}
