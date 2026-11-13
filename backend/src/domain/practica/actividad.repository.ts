import { Actividad } from './actividad.js';

export abstract class ActividadRepository {
  /** null si la guía no está publicada o su actividad no tiene preguntas. */
  abstract buscarDeGuiaPublicada(slug: string): Promise<Actividad | null>;
}
