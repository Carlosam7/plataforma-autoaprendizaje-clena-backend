import type { SolicitudAyuda } from '@/domain/ayuda/types';
import type { AyudaRepository } from './ports';

/** HU-29 · Estado actual de mi solicitud y mi puesto en la fila. */
export class ConsultarSolicitudAyuda {
  constructor(private readonly repository: AyudaRepository) {}

  ejecutar(id: string): Promise<SolicitudAyuda> {
    return this.repository.consultar(id);
  }
}
