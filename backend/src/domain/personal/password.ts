import { DatoInvalidoError } from '../shared/error-de-negocio.js';

const MINIMO = 8;
// bcrypt solo usa los primeros 72 bytes: más largo daría una falsa sensación de seguridad.
const MAXIMO_BYTES = 72;

/** Contraseña en claro del personal, ya validada. Nunca se guarda: solo su hash. */
export class Password {
  private constructor(readonly valor: string) {}

  static crear(valor: string, campo = 'password'): Password {
    const bytes = new TextEncoder().encode(valor).length;
    if (
      valor.length < MINIMO ||
      bytes > MAXIMO_BYTES ||
      !/\p{L}/u.test(valor) ||
      !/\d/.test(valor)
    ) {
      throw new DatoInvalidoError(
        campo,
        'La contraseña debe tener entre 8 y 72 caracteres, con al menos una letra y un número.',
      );
    }
    return new Password(valor);
  }
}
