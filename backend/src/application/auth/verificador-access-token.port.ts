import { Rol } from '../../domain/auth/tipos.js';

export interface ContenidoAccessToken {
  sid: string;
  rol: Rol;
}

/** Comprueba la firma y la vigencia del access token. */
export abstract class VerificadorAccessToken {
  /** Devuelve `null` si el token no es válido o ya venció. */
  abstract verificar(token: string): Promise<ContenidoAccessToken | null>;
}
