import {
  Actividad,
  calificarRespuesta,
  RespuestaCalificada,
} from './actividad.js';
import {
  IntentoFinalizadoError,
  PreguntaYaRespondidaError,
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

export interface IntentoProps {
  id: string;
  actividad: Actividad;
  /** Cédula del usuario público. Sin cuenta no hay intento: esa práctica no se guarda (C-04). */
  usuarioId: string;
  respuestas: RespuestaDada[];
  iniciadoEn: Date;
  finalizadoEn: Date | null;
}

/**
 * Una vez que un usuario público hace la actividad (HU-21). Se responde una pregunta a la vez y,
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

  /** Solo su dueño lo puede seguir respondiendo. */
  perteneceA(usuarioId: string): boolean {
    return this.props.usuarioId === usuarioId;
  }

  responder(
    preguntaId: string,
    opcionId: string,
    ahora: Date,
  ): RespuestaCalificada {
    if (this.props.finalizadoEn) throw new IntentoFinalizadoError();
    const calificada = calificarRespuesta(
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
      esCorrecta: calificada.esCorrecta,
      respondidaEn: ahora,
    });
    if (this.props.respuestas.length === this.totalPreguntas) {
      this.props.finalizadoEn = ahora;
    }
    return calificada;
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
