// Solicitud de ayuda presencial (HU-28/29) alineada con C-05.
// La titularidad la da la cookie httpOnly `llave_ayuda` que pone el backend: el frontend
// nunca la lee ni la guarda; solo envía `credentials: 'include'`.

export const TEMAS_AYUDA = [
  'CORREO',
  'BUSQUEDA_INTERNET',
  'DOCUMENTOS',
  'REDES_SOCIALES',
  'SEGURIDAD_DIGITAL',
  'USO_DEL_EQUIPO',
  'IMPRESION',
  'OTRO',
] as const;
export type TemaAyuda = (typeof TEMAS_AYUDA)[number];

export const ESTADOS_SOLICITUD = [
  'PENDIENTE',
  'EN_ATENCION',
  'RESUELTA',
  'CANCELADA',
] as const;
export type EstadoSolicitud = (typeof ESTADOS_SOLICITUD)[number];

/** Lo que ve quien pidió la ayuda (`GET /solicitudes-ayuda/:id`). */
export interface SolicitudAyuda {
  id: string;
  equipo: string;
  tema: TemaAyuda;
  estado: EstadoSolicitud;
  /** Puesto en la fila mientras está PENDIENTE; null cuando ya la atienden o se cerró. */
  posicion: number | null;
  /** ISO 8601 UTC. */
  creadaEn: string;
}

/** Respuesta del `POST`: `yaExistia` indica que este navegador ya la había pedido. */
export interface SolicitudCreada extends SolicitudAyuda {
  yaExistia: boolean;
}

export interface SolicitarAyudaComando {
  equipo: string;
  tema: TemaAyuda;
  /** Guía y número de paso donde estaba la persona; se envían solos desde una guía. */
  guiaSlug?: string;
  pasoOrden?: number;
}

export const MAX_LARGO_EQUIPO = 100;
export const MAX_LARGO_SLUG = 80;
export const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** C-05: el frontend consulta el estado cada 15 s mientras espera. */
export const INTERVALO_CONSULTA_AYUDA_MS = 15_000;

/** Mientras está activa, un monitor puede venir: se sigue consultando. */
export function solicitudActiva(estado: EstadoSolicitud): boolean {
  return estado === 'PENDIENTE' || estado === 'EN_ATENCION';
}
