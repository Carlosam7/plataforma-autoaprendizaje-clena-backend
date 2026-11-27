import type {
  CriterioResumen,
  ResumenEstadisticas,
} from '@/domain/estadistica/types';

export interface EstadisticaRepository {
  /** GET /gestion/estadisticas/resumen */
  resumen(
    token: string,
    criterio: CriterioResumen,
  ): Promise<ResumenEstadisticas>;
}
