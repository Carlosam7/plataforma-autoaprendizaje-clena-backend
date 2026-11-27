import { RangoFechasInvalidoError } from './errores.js';

export const ZONA_HORARIA = 'America/Bogota';
/** Colombia no tiene horario de verano desde 1993: siempre UTC−5. */
const DESFASE_BOGOTA = '-05:00';
const MS_POR_DIA = 86_400_000;
/** Días que se muestran si no se indica `desde` (hoy incluido). */
export const DIAS_POR_DEFECTO = 7;
/** Rango máximo que se puede pedir, contando `desde` y `hasta`. */
export const RANGO_MAXIMO_DIAS = 366;

const FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * HU-31: un rango de días de calendario en hora de Bogotá, con `desde` y `hasta` incluidos.
 * Para consultar la base se convierte en el intervalo UTC semiabierto
 * [00:00 de `desde`, 00:00 del día siguiente a `hasta`) en Bogotá: un evento a las
 * 23:59:59 de `hasta` cuenta y uno a las 00:00 del día siguiente no.
 */
export class Periodo {
  private constructor(
    /** YYYY-MM-DD */
    readonly desde: string,
    /** YYYY-MM-DD */
    readonly hasta: string,
  ) {}

  /**
   * Sin `hasta`, es hoy en Bogotá. Sin `desde`, son los 7 días que terminan en `hasta`.
   * Lanza RangoFechasInvalidoError si una fecha no existe, `desde` es posterior a `hasta`
   * o el rango pasa de 366 días.
   */
  static crear(datos: {
    desde?: string;
    hasta?: string;
    ahora: Date;
  }): Periodo {
    const hasta = datos.hasta
      ? validarFecha(datos.hasta, 'hasta')
      : fechaEnBogota(datos.ahora);
    const desde = datos.desde
      ? validarFecha(datos.desde, 'desde')
      : sumarDias(hasta, -(DIAS_POR_DEFECTO - 1));

    if (desde > hasta) {
      throw new RangoFechasInvalidoError(
        'La fecha inicial no puede ser posterior a la fecha final.',
        'desde',
      );
    }
    if (diasEntre(desde, hasta) + 1 > RANGO_MAXIMO_DIAS) {
      throw new RangoFechasInvalidoError(
        `Elige un rango de máximo ${RANGO_MAXIMO_DIAS} días.`,
        'desde',
      );
    }
    return new Periodo(desde, hasta);
  }

  /** Primer instante del periodo (incluido). */
  get inicio(): Date {
    return inicioDelDia(this.desde);
  }

  /** Primer instante después del periodo (excluido). */
  get fin(): Date {
    return inicioDelDia(sumarDias(this.hasta, 1));
  }
}

function validarFecha(texto: string, campo: 'desde' | 'hasta'): string {
  const partes = FECHA.exec(texto);
  // Date.UTC acepta 2026-02-30 y lo pasa a marzo: se compara de vuelta para rechazarlo.
  const fecha = partes
    ? new Date(Date.UTC(+partes[1], +partes[2] - 1, +partes[3]))
    : null;
  if (!fecha || fecha.toISOString().slice(0, 10) !== texto) {
    throw new RangoFechasInvalidoError(
      `La fecha ${campo === 'desde' ? 'inicial' : 'final'} no es válida. Usa el formato AAAA-MM-DD.`,
      campo,
    );
  }
  return texto;
}

function fechaEnBogota(instante: Date): string {
  return new Date(instante.getTime() - 5 * 3_600_000)
    .toISOString()
    .slice(0, 10);
}

function inicioDelDia(fecha: string): Date {
  return new Date(`${fecha}T00:00:00${DESFASE_BOGOTA}`);
}

function sumarDias(fecha: string, dias: number): string {
  return new Date(Date.parse(`${fecha}T00:00:00Z`) + dias * MS_POR_DIA)
    .toISOString()
    .slice(0, 10);
}

function diasEntre(desde: string, hasta: string): number {
  return (
    (Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) /
    MS_POR_DIA
  );
}
