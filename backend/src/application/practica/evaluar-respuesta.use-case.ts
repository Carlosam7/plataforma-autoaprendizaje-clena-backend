import { ActividadRepository } from '../../domain/practica/actividad.repository.js';
import { ActividadNoEncontradaError } from '../../domain/practica/errores.js';
import {
  evaluarRespuestaActividad,
  RespuestaCalificada,
} from '../../domain/practica/intento.js';

export interface EvaluarRespuestaComando {
  slugGuia: string;
  preguntaId: string;
  opcionId: string;
}

/** HU-03 / HU-21 (C-04): evalúa una respuesta sin cuenta y sin guardar filas educativas. */
export class EvaluarRespuestaUseCase {
  constructor(private readonly actividades: ActividadRepository) {}

  async ejecutar({
    slugGuia,
    preguntaId,
    opcionId,
  }: EvaluarRespuestaComando): Promise<RespuestaCalificada> {
    const actividad = await this.actividades.buscarDeGuiaPublicada(slugGuia);
    if (!actividad) throw new ActividadNoEncontradaError();
    return evaluarRespuestaActividad(actividad, preguntaId, opcionId);
  }
}

