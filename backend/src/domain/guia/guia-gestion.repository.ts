import { Pagina, Paginacion } from '../shared/pagina.js';
import { GuiaEditable } from './guia-editable.js';
import { EstadoGuia } from './guia.js';

export const CAMPOS_ORDEN_GESTION_GUIA = ['titulo', 'actualizadoEn'] as const;

export interface CriterioGestionGuias extends Paginacion {
  /** Sin él, todas: borradores, publicadas y ocultas. */
  estado?: EstadoGuia;
  /** Slug de la categoría. */
  categoria?: string;
  ordenarPor: (typeof CAMPOS_ORDEN_GESTION_GUIA)[number];
  direccion: 'asc' | 'desc';
}

/** La guía con quién la creó, quién la editó por última vez y cuándo (HU-13). */
export interface GuiaGestionada {
  guia: GuiaEditable;
  /** Nombres de las cuentas del personal. */
  creadaPor: string;
  actualizadaPor: string;
  creadoEn: Date;
  actualizadoEn: Date;
}

/** Las guías como las administra el personal, en cualquier estado. */
export abstract class GuiaGestionRepository {
  abstract listar(
    criterio: CriterioGestionGuias,
  ): Promise<Pagina<GuiaGestionada>>;

  abstract buscar(slug: string): Promise<GuiaGestionada | null>;

  abstract existeSlug(slug: string): Promise<boolean>;

  abstract existeCategoria(slug: string): Promise<boolean>;

  /**
   * Crea la guía o guarda sus cambios, con los pasos en el orden de la lista. Los pasos
   * que ya no están en la guía se borran. Todo o nada.
   */
  abstract guardar(guia: GuiaEditable): Promise<void>;
}
