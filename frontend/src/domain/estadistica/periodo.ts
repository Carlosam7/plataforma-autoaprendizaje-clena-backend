import type { CriterioResumen } from './types';

/** C-11: máximo 366 días contando los dos extremos. */
export const RANGO_MAXIMO_DIAS = 366;
const FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_DIA = 86_400_000;

/** Día de calendario → ms UTC; null si no existe (p. ej. 2026-02-30). */
function aMs(fecha: string): number | null {
  const m = FECHA.exec(fecha);
  if (!m) return null;
  const [anio, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(anio, mes - 1, dia));
  return d.getUTCFullYear() === anio &&
    d.getUTCMonth() === mes - 1 &&
    d.getUTCDate() === dia
    ? d.getTime()
    : null;
}

/** Mensaje en español si el periodo no es válido; null si lo es. Vacío = lo decide el servidor. */
export function validarPeriodo({
  desde,
  hasta,
}: CriterioResumen): string | null {
  const d = desde ? aMs(desde) : undefined;
  const h = hasta ? aMs(hasta) : undefined;
  if (desde && d === null)
    return 'La fecha inicial no es válida. Usa una fecha real, por ejemplo 2026-11-20.';
  if (hasta && h === null)
    return 'La fecha final no es válida. Usa una fecha real, por ejemplo 2026-11-26.';
  if (d != null && h != null) {
    if (d > h) return 'La fecha inicial no puede ser posterior a la final.';
    if ((h - d) / MS_DIA + 1 > RANGO_MAXIMO_DIAS)
      return `El periodo puede tener como máximo ${RANGO_MAXIMO_DIAS} días.`;
  }
  return null;
}
