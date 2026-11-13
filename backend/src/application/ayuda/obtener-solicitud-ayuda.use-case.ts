import { SolicitudNoEncontradaError } from '../../domain/ayuda/errores.js';
import { SolicitudAyudaRepository } from '../../domain/ayuda/solicitud-ayuda.repository.js';
import {
  resultadoSolicitud,
  SolicitudAyudaResultado,
} from './solicitud-ayuda.resultado.js';

/** HU-29: estado de mi solicitud y mi puesto en la cola, para consultarlo mientras espero. */
export class ObtenerSolicitudAyudaUseCase {
  constructor(private readonly solicitudes: SolicitudAyudaRepository) {}

  async ejecutar(id: string): Promise<SolicitudAyudaResultado> {
    const solicitud = await this.solicitudes.buscarPorId(id);
    if (!solicitud) throw new SolicitudNoEncontradaError();
    return resultadoSolicitud(this.solicitudes, solicitud);
  }
}
