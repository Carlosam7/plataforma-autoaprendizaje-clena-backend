import type { ColaAyudaRepository } from './ports';
import type { SolicitudEnCola } from '@/domain/cola/types';

/**
 * HU-30: el monitor toma una solicitud pendiente y pasa a «En atención» a su nombre. Si
 * otro monitor la tomó un instante antes, el backend responde 409 y la pantalla recarga
 * la cola.
 */
export class TomarSolicitud {
  constructor(private readonly repository: ColaAyudaRepository) {}

  ejecutar(id: string): Promise<SolicitudEnCola> {
    return this.repository.tomar(id);
  }
}
