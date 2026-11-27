import type {
  ListarSolicitudesCriterio,
  SolicitudesPaginadas,
} from '@/domain/ayuda/solicitudCola';
import type { SolicitudesColaRepository } from './colaPorts';

export class ListarSolicitudesAyuda {
  constructor(private readonly repository: SolicitudesColaRepository) {}

  ejecutar(
    token: string,
    criterio: ListarSolicitudesCriterio = {},
  ): Promise<SolicitudesPaginadas> {
    return this.repository.listar(token, {
      pagina: 1,
      limite: 20,
      ...criterio,
    });
  }
}
