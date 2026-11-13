import { Pagina, Paginacion } from '../shared/pagina.js';
import { ContenidoPaso } from './contenido-paso.js';
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

export interface PasoGuia {
  orden: number;
  titulo: string | null;
  contenido: ContenidoPaso;
}

/** Guía publicada con sus pasos en orden (HU-10). */
export interface DetalleGuia {
  guia: Guia;
  pasos: PasoGuia[];
  /** Si tiene actividad de práctica, al terminar se invita a hacerla. */
  tieneActividad: boolean;
}

export abstract class GuiaRepository {
  /** Solo guías PUBLICADA: los borradores y las ocultas no los ve el público. */
  abstract listarPublicadas(
    criterio: CriterioGuiasPublicadas,
  ): Promise<Pagina<Guia>>;

  /** null si no existe o no está publicada. */
  abstract buscarPublicada(slug: string): Promise<DetalleGuia | null>;

  /** Id de la guía publicada con ese slug; null si no existe o no está publicada. */
  abstract buscarIdPublicada(slug: string): Promise<string | null>;
}
