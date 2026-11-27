import type { EstadoSolicitud, TemaAyuda } from '@/domain/ayuda/types';

/** HU-30 (C-06): una solicitud de ayuda como la ve el monitor en la cola. */
export interface SolicitudEnCola {
  id: string;
  /** Número o nombre del equipo donde está la persona. */
  equipo: string;
  tema: TemaAyuda;
  estado: EstadoSolicitud;
  /** Guía y número de paso donde estaba la persona, si pidió ayuda desde una guía. */
  guia: { slug: string; titulo: string } | null;
  paso: number | null;
  creadaEn: Date;
  /** Nombre del monitor que la atiende o la atendió. */
  atendidaPor: string | null;
  tomadaEn: Date | null;
  resueltaEn: Date | null;
  comentarioResolucion: string | null;
}

export interface ColaAyuda {
  /** PENDIENTE, de la más antigua a la más reciente: el orden en que se atienden. */
  pendientes: SolicitudEnCola[];
  /** Total de pendientes (puede haber más que las de la primera página). */
  totalPendientes: number;
  /** EN_ATENCION: las que ya tomó algún monitor y falta resolver. */
  enAtencion: SolicitudEnCola[];
}

/** El comentario al resolver es opcional; máximo 500 letras (C-06). */
export const MAX_COMENTARIO_RESOLUCION = 500;
/** La cola se vuelve a pedir cada 15 s mientras la pantalla está abierta (C-06). */
export const INTERVALO_COLA_MS = 15_000;

/** Minutos que lleva esperando, desde que pidió ayuda hasta `ahora`. */
export function minutosEsperando(
  solicitud: SolicitudEnCola,
  ahora: Date,
): number {
  return Math.max(
    0,
    Math.floor((ahora.getTime() - solicitud.creadaEn.getTime()) / 60_000),
  );
}

/**
 * Cómo se nombra el equipo: «Equipo 12». Si la persona ya escribió «Equipo 7», no se
 * repite la palabra.
 */
export function nombreEquipo(equipo: string): string {
  const limpio = equipo.trim();
  return /^equipo\b/i.test(limpio) ? limpio : `Equipo ${limpio}`;
}

/** Para usarlo dentro de una frase: «equipo 12», «equipo QA-1» (solo la primera letra). */
export function nombreEquipoEnFrase(equipo: string): string {
  const nombre = nombreEquipo(equipo);
  return nombre.charAt(0).toLowerCase() + nombre.slice(1);
}

/** «Espera hace 5 minutos»; desde una hora, en horas, y desde un día, en días. */
export function textoEspera(minutos: number): string {
  if (minutos < 1) return 'Acaba de pedir ayuda';
  const plural = (n: number, una: string, varias: string) =>
    `Espera hace ${n} ${n === 1 ? una : varias}`;
  if (minutos < 60) return plural(minutos, 'minuto', 'minutos');
  if (minutos < 1440) return plural(Math.floor(minutos / 60), 'hora', 'horas');
  return plural(Math.floor(minutos / 1440), 'día', 'días');
}
