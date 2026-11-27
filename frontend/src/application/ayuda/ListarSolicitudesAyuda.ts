import type {
  ListarSolicitudesCriterio,
  SolicitudesPaginadas,
} from '@/domain/ayuda/types';
import type { SolicitudesAyudaRepository } from './ports';

export class ListarSolicitudesAyuda {
  constructor(private readonly repository: SolicitudesAyudaRepository) {}

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
