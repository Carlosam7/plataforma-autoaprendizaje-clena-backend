import bcrypt from 'bcryptjs';
import { HasherPassword } from '../../application/personal/hasher-password.port.js';

export class BcryptHasherPassword implements HasherPassword {
  // Costo 12: unos cientos de milisegundos por intento, caro para un ataque por fuerza bruta.
  constructor(private readonly costo = 12) {}

  hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.costo);
  }

  coincide(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
