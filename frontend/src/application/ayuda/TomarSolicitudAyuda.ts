import type { SolicitudEnCola } from '@/domain/ayuda/types';
import type { SolicitudesAyudaRepository } from './ports';

export class TomarSolicitudAyuda {
  constructor(private readonly repository: SolicitudesAyudaRepository) {}

  ejecutar(token: string, id: string): Promise<SolicitudEnCola> {
    return this.repository.tomar(token, id);
  }
}
