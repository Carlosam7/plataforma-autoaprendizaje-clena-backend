import type { SolicitudEnCola } from '@/domain/ayuda/solicitudCola';
import type { SolicitudesColaRepository } from './colaPorts';

export class TomarSolicitudAyuda {
  constructor(private readonly repository: SolicitudesColaRepository) {}

  ejecutar(token: string, id: string): Promise<SolicitudEnCola> {
    return this.repository.tomar(token, id);
  }
}
