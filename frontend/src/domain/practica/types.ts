// Modelos de práctica alineados con C-03 (existente) y C-04 (propuesto).
// Los identificadores son UUID del backend: nunca A/B/C ni el orden visual.

export interface Opcion {
  id: string;
  texto: string;
}

/** Pregunta tal como llega antes de responder: sin la opción correcta. */
export interface Pregunta {
  id: string;
  enunciado: string;
  opciones: Opcion[];
}

export interface Actividad {
  titulo: string;
  porcentajeAprobacion: number;
  totalPreguntas: number;
  preguntas: Pregunta[];
}

export interface IntentoIniciado {
  id: string;
  totalPreguntas: number;
}

/** Retroalimentación recibida solo después de responder. */
export interface Feedback {
  esCorrecta: boolean;
  opcionCorrecta: Opcion;
  explicacion: string;
}

/** Calificación final que devuelve el backend con la última respuesta. */
export interface Resultado {
  respuestasCorrectas: number;
  totalPreguntas: number;
  porcentaje: number;
  aprobado: boolean;
  porcentajeAprobacion: number;
}

/** Respuesta de `POST /intentos/:id/respuestas` (C-03). */
export interface RespuestaEvaluada extends Feedback {
  respondidas: number;
  totalPreguntas: number;
  resultado: Resultado | null;
}

export interface RespuestaComando {
  preguntaId: string;
  opcionId: string;
}

export type ModoPractica = 'REGISTRADO' | 'INVITADO';

export interface RespuestaRegistrada {
  preguntaId: string;
  opcionId: string;
  feedback: Feedback;
}

/**
 * Estado de una práctica en curso. Vive únicamente en memoria (estado React):
 * no se guarda en localStorage/sessionStorage ni en backend para invitados.
 */
export interface PracticaSession {
  modo: ModoPractica;
  slug: string;
  actividad: Actividad;
  /** Solo en modo REGISTRADO; en INVITADO siempre null. */
  intentoId: string | null;
  preguntaIndex: number;
  respuestas: RespuestaRegistrada[];
  resultado: Resultado | null;
}

export const MIN_PREGUNTAS = 1;
export const MAX_PREGUNTAS = 10;
export const MIN_OPCIONES = 2;
export const MAX_OPCIONES = 4;
