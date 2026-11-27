import { RespuestaInvalidaError } from './errores.js';

export interface OpcionActividad {
  id: string;
  texto: string;
  esCorrecta: boolean;
}

export interface PreguntaActividad {
  id: string;
  enunciado: string;
  /** Se muestra al responder, acierte o no. */
  explicacion: string;
  /** En orden; exactamente una es correcta (lo garantiza la base de datos). */
  opciones: OpcionActividad[];
}

/** Actividad de práctica de una guía, con sus preguntas en orden (HU-21). */
export interface Actividad {
  id: string;
  titulo: string;
  /** Porcentaje mínimo de aciertos para aprobar; 70 por defecto. */
  porcentajeAprobacion: number;
  preguntas: PreguntaActividad[];
}

export interface RespuestaCalificada {
  esCorrecta: boolean;
  /** Para «Casi. La respuesta correcta es…». */
  opcionCorrecta: Pick<OpcionActividad, 'id' | 'texto'>;
  explicacion: string;
}

/**
 * Dice si `opcionId` es la respuesta correcta de `preguntaId`. La usan el intento guardado
 * de quien tiene cuenta y la práctica sin cuenta, que no guarda nada (C-04).
 */
export function calificarRespuesta(
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
