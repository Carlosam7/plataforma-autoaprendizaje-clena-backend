import { DatoInvalidoError } from '../../shared/error-de-negocio.js';

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Correo {
  private constructor(readonly valor: string) {}

  static crear(valor: string): Correo {
    const normalizado = valor.trim().toLowerCase();
    if (normalizado.length > 254 || !FORMATO_CORREO.test(normalizado)) {
      throw new DatoInvalidoError(
        'correo',
        'Escribe un correo válido, por ejemplo nombre@correo.com.',
      );
    }
    return new Correo(normalizado);
  }

  /** Versión que se puede mostrar sin revelar el correo completo: c****@gmail.com */
  enmascarado(): string {
    const [usuario, dominio] = this.valor.split('@');
    return `${usuario[0]}****@${dominio}`;
  }

  igualA(otro: Correo): boolean {
    return this.valor === otro.valor;
  }
}
