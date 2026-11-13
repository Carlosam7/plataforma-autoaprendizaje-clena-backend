import { Pagina, Paginacion } from '../shared/pagina.js';
import { Guia } from './guia.js';

export const CAMPOS_ORDEN_GUIA = [
  'titulo',
  'duracionEstimadaMin',
  'publicadaEn',
] as const;

export interface CriterioGuiasPublicadas extends Paginacion {
  /** Slug de la categoría; sin él, todas las categorías. */
  categoria?: string;
  ordenarPor: (typeof CAMPOS_ORDEN_GUIA)[number];
  direccion: 'asc' | 'desc';
}

export abstract class GuiaRepository {
  /** Solo guías PUBLICADA: los borradores y las ocultas no los ve el público. */
  abstract listarPublicadas(
    criterio: CriterioGuiasPublicadas,
  ): Promise<Pagina<Guia>>;
}
