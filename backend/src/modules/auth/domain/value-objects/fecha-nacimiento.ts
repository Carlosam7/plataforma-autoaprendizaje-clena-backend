import { DatoInvalidoError } from '../../../../shared/domain/error-de-negocio.js';

const FORMATO = /^(\d{4})-(\d{2})-(\d{2})$/;
const EDAD_MAXIMA = 120;

/** Fecha de calendario sin hora, guardada como medianoche UTC. */
export class FechaNacimiento {
  private constructor(readonly valor: Date) {}

  /** @param texto fecha en formato AAAA-MM-DD */
  static desdeTexto(texto: string, hoy: Date): FechaNacimiento {
    const partes = FORMATO.exec(texto.trim());
    if (!partes) throw FechaNacimiento.invalida();

    const [anio, mes, dia] = partes.slice(1).map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1, dia));
    // Rechaza fechas que no existen, como 2001-02-30, que Date corre al mes siguiente.
    if (
      fecha.getUTCFullYear() !== anio ||
      fecha.getUTCMonth() !== mes - 1 ||
      fecha.getUTCDate() !== dia
    ) {
      throw FechaNacimiento.invalida();
    }
    return FechaNacimiento.desdeFecha(fecha, hoy);
  }

  static desdeFecha(fecha: Date, hoy: Date): FechaNacimiento {
    const hoyUtc = Date.UTC(
      hoy.getUTCFullYear(),
      hoy.getUTCMonth(),
      hoy.getUTCDate(),
    );
    if (fecha.getTime() > hoyUtc) {
      throw new DatoInvalidoError(
        'fechaNacimiento',
        'La fecha de nacimiento no puede ser posterior a hoy.',
      );
    }
    if (hoy.getUTCFullYear() - fecha.getUTCFullYear() > EDAD_MAXIMA) {
      throw new DatoInvalidoError(
        'fechaNacimiento',
        'Revisa el año de tu fecha de nacimiento.',
      );
    }
    return new FechaNacimiento(fecha);
  }

  /** Para reconstruir desde persistencia, donde la fecha ya fue validada. */
  static reconstituir(fecha: Date): FechaNacimiento {
    return new FechaNacimiento(fecha);
  }

  aTexto(): string {
    return this.valor.toISOString().slice(0, 10);
  }

  private static invalida(): DatoInvalidoError {
    return new DatoInvalidoError(
      'fechaNacimiento',
      'Escribe tu fecha de nacimiento con el formato año-mes-día, por ejemplo 1955-08-21.',
    );
  }
}
