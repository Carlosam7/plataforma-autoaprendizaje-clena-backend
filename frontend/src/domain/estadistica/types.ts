import type { TemaAyuda } from '@/domain/ayuda/types';

// C-11 · Estadísticas agregadas (HU-31). Las fechas son días de calendario en America/Bogota.

export interface CriterioResumen {
  /** AAAA-MM-DD; sin él, el servidor usa 6 días antes de `hasta`. */
  desde?: string;
  /** AAAA-MM-DD; sin él, el servidor usa hoy en Bogotá. */
  hasta?: string;
}

export interface ResumenEstadisticas {
  periodo: { desde: string; hasta: string; zonaHoraria: string };
  totales: { consultasGuias: number; solicitudesAyuda: number };
  /** Máximo 10, de más a menos consultas. */
  topGuias: { slug: string; titulo: string; consultas: number }[];
  /** Solo categorías con al menos una consulta. */
  consultasPorCategoria: { slug: string; nombre: string; consultas: number }[];
  /** Solo temas con al menos una solicitud. */
  solicitudesPorTema: { tema: TemaAyuda; cantidad: number }[];
  hayDatos: boolean;
}
