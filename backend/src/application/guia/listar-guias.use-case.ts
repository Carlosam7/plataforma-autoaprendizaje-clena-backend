import { NivelGuia } from '../../domain/guia/guia.js';
import {
  CriterioGuiasPublicadas,
  GuiaRepository,
} from '../../domain/guia/guia.repository.js';
import { ResultadoPaginado } from '../shared/resultado-paginado.js';

// Lo que el catálogo muestra de cada guía; id y estado son detalles internos.
export interface GuiaResumen {
  slug: string;
  categoria: string;
  titulo: string;
  objetivo: string;
  nivel: NivelGuia;
  duracionEstimadaMin: number;
}

/**
 * HU-09: guías publicadas de una categoría. Si no tiene ninguna, `datos` llega vacío y el
 * frontend muestra «Pronto habrá guías en esta sección».
 */
export class ListarGuiasUseCase {
  constructor(private readonly guias: GuiaRepository) {}

  async ejecutar(
    criterio: CriterioGuiasPublicadas,
  ): Promise<ResultadoPaginado<GuiaResumen>> {
    const { elementos, total } = await this.guias.listarPublicadas(criterio);
    return {
      datos: elementos.map((g) => ({
        slug: g.slug,
        categoria: g.categoriaSlug,
        titulo: g.titulo,
        objetivo: g.objetivo,
        nivel: g.nivel,
        duracionEstimadaMin: g.duracionEstimadaMin,
      })),
      total,
      pagina: criterio.pagina,
      limite: criterio.limite,
    };
  }
}
