import { Pagina, Paginacion } from '../shared/pagina.js';
import { AvanceGuia } from './avance-guia.js';

export const CAMPOS_ORDEN_PROGRESO = ['titulo'] as const;

export interface CriterioProgreso extends Paginacion {
  /** Slug de la categoría; sin él, todas. */
  categoria?: string;
  ordenarPor: (typeof CAMPOS_ORDEN_PROGRESO)[number];
  direccion: 'asc' | 'desc';
}

// abstract class (no interface) para que sirva como token de inyección de Nest.
export abstract class ProgresoRepository {
  /** Todas las guías publicadas con el avance de ese usuario, también las que no ha empezado. */
  abstract listar(
    usuarioId: string,
    criterio: CriterioProgreso,
  ): Promise<Pagina<AvanceGuia>>;

  /** Avance del usuario en esa guía; null si la guía no existe. */
  abstract avance(
    usuarioId: string,
    guiaId: string,
  ): Promise<AvanceGuia | null>;

  /** Ids de la guía publicada y de su paso número `orden`; null si no existen. */
  abstract buscarPaso(
    guiaSlug: string,
    orden: number,
  ): Promise<{ guiaId: string; pasoId: string } | null>;

  /**
   * Anota que el usuario leyó ese paso y que es el último que abrió. Repetirlo no cambia
   * la fecha de la primera lectura.
   */
  abstract registrarLectura(lectura: {
    usuarioId: string;
    guiaId: string;
    pasoId: string;
    leidoEn: Date;
  }): Promise<void>;

  /** Deja registrado cuándo completó la guía. */
  abstract marcarCompletada(
    usuarioId: string,
    guiaId: string,
    completadaEn: Date,
  ): Promise<void>;

  /** Guía a la que pertenece esa actividad; null si no existe. */
  abstract guiaDeActividad(actividadId: string): Promise<string | null>;
}
