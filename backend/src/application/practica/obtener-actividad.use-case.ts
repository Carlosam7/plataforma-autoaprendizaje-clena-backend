import { ActividadRepository } from '../../domain/practica/actividad.repository.js';
import { ActividadNoEncontradaError } from '../../domain/practica/errores.js';

export interface PreguntaMostrada {
  id: string;
  enunciado: string;
  /** Sin la respuesta: se sabe cuál es la correcta solo después de responder. */
  opciones: { id: string; texto: string }[];
}

export interface ActividadMostrada {
  titulo: string;
  porcentajeAprobacion: number;
  totalPreguntas: number;
  preguntas: PreguntaMostrada[];
}

/** HU-21: las preguntas de la actividad de una guía, en orden y sin las respuestas. */
export class ObtenerActividadUseCase {
  constructor(private readonly actividades: ActividadRepository) {}

  async ejecutar(slugGuia: string): Promise<ActividadMostrada> {
    const actividad = await this.actividades.buscarDeGuiaPublicada(slugGuia);
    if (!actividad) throw new ActividadNoEncontradaError();
    return {
      titulo: actividad.titulo,
      porcentajeAprobacion: actividad.porcentajeAprobacion,
      totalPreguntas: actividad.preguntas.length,
      preguntas: actividad.preguntas.map(({ id, enunciado, opciones }) => ({
        id,
        enunciado,
        opciones: opciones.map(({ id, texto }) => ({ id, texto })),
      })),
    };
  }
}
