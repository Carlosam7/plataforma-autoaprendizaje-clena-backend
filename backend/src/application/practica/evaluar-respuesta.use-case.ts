import {
  RespuestaCalificada,
  calificarRespuesta,
} from '../../domain/practica/actividad.js';
import { ActividadRepository } from '../../domain/practica/actividad.repository.js';
import {
  ActividadNoEncontradaError,
  PreguntaNoEncontradaError,
} from '../../domain/practica/errores.js';

export interface EvaluarRespuestaComando {
  slugGuia: string;
  preguntaId: string;
  opcionId: string;
}

/**
 * HU-03, HU-21 (C-04): quien practica sin cuenta responde una pregunta y sabe al instante si
 * acertó. No se guarda nada: ni intento, ni respuesta, ni progreso. El avance y la nota los
 * lleva el navegador mientras dure la práctica.
 */
export class EvaluarRespuestaUseCase {
  constructor(private readonly actividades: ActividadRepository) {}

  async ejecutar({
    slugGuia,
    preguntaId,
    opcionId,
  }: EvaluarRespuestaComando): Promise<RespuestaCalificada> {
    const actividad = await this.actividades.buscarDeGuiaPublicada(slugGuia);
    if (!actividad) throw new ActividadNoEncontradaError();
    if (!actividad.preguntas.some((p) => p.id === preguntaId)) {
      throw new PreguntaNoEncontradaError();
    }
    return calificarRespuesta(actividad, preguntaId, opcionId);
  }
}
