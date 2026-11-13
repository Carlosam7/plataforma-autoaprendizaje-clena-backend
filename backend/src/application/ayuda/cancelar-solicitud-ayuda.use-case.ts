import { SolicitudNoEncontradaError } from '../../domain/ayuda/errores.js';
import { SolicitudAyudaRepository } from '../../domain/ayuda/solicitud-ayuda.repository.js';
import { Reloj } from '../shared/reloj.port.js';

/** HU-29: cancelo mi solicitud porque resolví la duda por mi cuenta. */
export class CancelarSolicitudAyudaUseCase {
  constructor(
    private readonly solicitudes: SolicitudAyudaRepository,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(id: string): Promise<void> {
    const solicitud = await this.solicitudes.buscarPorId(id);
    if (!solicitud) throw new SolicitudNoEncontradaError();
    solicitud.cancelar(this.reloj.ahora());
    await this.solicitudes.guardar(solicitud);
  }
}
