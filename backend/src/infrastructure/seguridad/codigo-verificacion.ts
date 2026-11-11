import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import {
  GeneradorCodigo,
  HasherCodigo,
} from '../../application/auth/codigo-verificacion.port.js';

const DIGITOS = 6;

export class GeneradorCodigoNumerico implements GeneradorCodigo {
  generar(): string {
    return randomInt(0, 10 ** DIGITOS)
      .toString()
      .padStart(DIGITOS, '0');
  }
}

/**
 * Un código de 6 dígitos tiene poca entropía, así que se guarda con un hash lento (bcrypt)
 * y no con SHA-256, para que una copia de la base de datos no permita recuperarlo.
 */
export class BcryptHasherCodigo implements HasherCodigo {
  constructor(private readonly costo = 10) {}

  hash(codigo: string): Promise<string> {
    return bcrypt.hash(codigo, this.costo);
  }

  coincide(codigo: string, hash: string): Promise<boolean> {
    return bcrypt.compare(codigo, hash);
  }
}
