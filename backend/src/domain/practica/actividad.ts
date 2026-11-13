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
