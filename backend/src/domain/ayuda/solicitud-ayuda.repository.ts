import { Pagina, Paginacion } from '../shared/pagina.js';
import {
  EstadoSolicitud,
  SolicitudAyuda,
  TemaAyuda,
} from './solicitud-ayuda.js';

export const CAMPOS_ORDEN_SOLICITUD = ['creadaEn'] as const;

export interface CriterioSolicitudes extends Paginacion {
  estado?: EstadoSolicitud;
  tema?: TemaAyuda;
  ordenarPor: (typeof CAMPOS_ORDEN_SOLICITUD)[number];
  direccion: 'asc' | 'desc';
}

/** Una solicitud como la ve el monitor: con la guía y el paso donde estaba la persona. */
export interface SolicitudEnCola {
  solicitud: SolicitudAyuda;
  guia: { slug: string; titulo: string } | null;
  /** Número del paso («Paso 3»). */
  pasoOrden: number | null;
  /** Nombre del monitor que la atiende o la atendió (HU-30). */
  atendidaPor: string | null;
}

export abstract class SolicitudAyudaRepository {
  /**
   * Guarda una solicitud nueva. Devuelve false, sin guardar nada, si el equipo ya tiene
   * una solicitud activa (lo garantiza un índice único, también ante dos envíos a la vez).
   */
  abstract crear(solicitud: SolicitudAyuda): Promise<boolean>;

  /** La solicitud PENDIENTE o EN_ATENCION del equipo, sin distinguir mayúsculas. */
  abstract buscarActivaDeEquipo(equipo: string): Promise<SolicitudAyuda | null>;

  abstract buscarPorId(id: string): Promise<SolicitudAyuda | null>;

  /** La solicitud como la ve el monitor; null si no existe. */
  abstract buscarEnCola(id: string): Promise<SolicitudEnCola | null>;

  /**
   * Guarda el cambio de estado solo si la solicitud sigue en `estadoAnterior`. Devuelve
   * false, sin guardar nada, si otra petición la cambió entre tanto: así dos monitores no
   * toman la misma, ni se resuelve una que la persona acaba de cancelar.
   */
  abstract guardar(
    solicitud: SolicitudAyuda,
    estadoAnterior: EstadoSolicitud,
  ): Promise<boolean>;

  /** Puesto en la cola: cuántas solicitudes PENDIENTE llegaron antes, más una. */
  abstract posicionEnCola(solicitud: SolicitudAyuda): Promise<number>;

  /**
   * Ids de la guía publicada y de su paso número `pasoOrden`. null si la guía no existe o
   * no está publicada; `pasoId` null si no se indicó paso o la guía no lo tiene.
   */
  abstract buscarContexto(
    guiaSlug: string,
    pasoOrden?: number,
  ): Promise<{ guiaId: string; pasoId: string | null } | null>;

  abstract listar(
    criterio: CriterioSolicitudes,
  ): Promise<Pagina<SolicitudEnCola>>;
}
