import { DatoInvalidoError } from '../../../../shared/domain/error-de-negocio.js';

const SEPARADORES = /[\s.-]/g;
// Cédulas, cédulas de extranjería y pasaportes (estos últimos pueden tener letras).
const FORMATO = /^[A-Z0-9]{4,15}$/;

export class NumeroIdentificacion {
  private constructor(readonly valor: string) {}

  static crear(valor: string): NumeroIdentificacion {
    const normalizado = valor.trim().replace(SEPARADORES, '').toUpperCase();
    if (!FORMATO.test(normalizado)) {
      throw new DatoInvalidoError(
        'numeroIdentificacion',
        'Escribe tu número de identificación sin puntos ni espacios, entre 4 y 15 caracteres.',
      );
    }
    return new NumeroIdentificacion(normalizado);
  }

  igualA(otro: NumeroIdentificacion): boolean {
    return this.valor === otro.valor;
  }
}
