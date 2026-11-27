import type {
  ListarSolicitudesCriterio,
  SolicitudEnCola,
  SolicitudesPaginadas,
} from '@/domain/ayuda/types';

export interface SolicitudesAyudaRepository {
  listar(
    token: string,
    criterio: ListarSolicitudesCriterio,
  ): Promise<SolicitudesPaginadas>;
  tomar(token: string, id: string): Promise<SolicitudEnCola>;
  resolver(
    token: string,
    id: string,
    comentario: string | null,
  ): Promise<SolicitudEnCola>;
}
