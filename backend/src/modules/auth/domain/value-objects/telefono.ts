import { DatoInvalidoError } from '../../../../shared/domain/error-de-negocio.js';

const SEPARADORES = /[\s\-().]/g;
const CELULAR_COLOMBIA = /^3\d{9}$/;

/**
 * Celular colombiano. Se guarda en formato E.164 (+573001234567) para que
 * «300 123 4567» y «+57 3001234567» se reconozcan como el mismo número.
 * Debe ser celular porque se usa para enviar códigos por SMS.
 */
export class Telefono {
  private constructor(readonly valor: string) {}

  static crear(valor: string): Telefono {
    let digitos = valor.trim().replace(SEPARADORES, '');
    if (digitos.startsWith('+57')) digitos = digitos.slice(3);
    else if (digitos.startsWith('57') && digitos.length === 12)
      digitos = digitos.slice(2);

    if (!CELULAR_COLOMBIA.test(digitos)) {
      throw new DatoInvalidoError(
        'telefono',
        'Escribe un número de celular de 10 dígitos, por ejemplo 300 123 4567.',
      );
    }
    return new Telefono(`+57${digitos}`);
  }

  /** Versión que se puede mostrar sin revelar el número completo: +57 *** *** 4567 */
  enmascarado(): string {
    return `+57 *** *** ${this.valor.slice(-4)}`;
  }

  igualA(otro: Telefono): boolean {
    return this.valor === otro.valor;
  }
}
