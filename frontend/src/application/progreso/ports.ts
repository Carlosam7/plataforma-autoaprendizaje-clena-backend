import type {
  ListarProgresoCriterio,
  ProgresoGuia,
  ProgresoPaginado,
} from '@/domain/progreso/types';

export interface ProgresoRepository {
  /** GET /progreso */
  listar(
    token: string,
    criterio: ListarProgresoCriterio,
  ): Promise<ProgresoPaginado>;
  /** POST /guias/:slug/pasos/:orden/lectura (idempotente) */
  registrarLectura(
    token: string,
    slug: string,
    orden: number,
  ): Promise<ProgresoGuia>;
}
