import { Rol } from '../../domain/auth/tipos.js';

export interface SesionEmitida {
  accessToken: string;
  accessTokenExpiraEn: Date;
  refreshToken: string;
  refreshTokenExpiraEn: Date;
}

/** Dueño de una sesión: número de identificación del usuario público o uuid del personal. */
export interface TitularSesion {
  id: string;
  rol: Rol;
}

/** Refresh token tal como está guardado (sin el secreto). */
export interface RefreshTokenGuardado {
  id: string;
  titular: TitularSesion;
  expiraEn: Date;
  revocadoEn: Date | null;
  /** Si se rotó, el refresh token que lo reemplazó. */
  reemplazadoPorId: string | null;
  /** false si es de una cuenta del personal que se desactivó. */
  titularActivo: boolean;
}

/**
 * Abre, renueva y cierra sesiones. Cada sesión es un refresh token guardado con hash;
 * el access token lleva su id (`sid`).
 */
export abstract class EmisorSesion {
  abstract iniciar(usuario: TitularSesion): Promise<SesionEmitida>;

  /** Busca el refresh token por su valor; null si no existe o no coincide el secreto. */
  abstract buscar(refreshToken: string): Promise<RefreshTokenGuardado | null>;

  /**
   * Emite una sesión nueva que reemplaza a `anterior` y la revoca, en una sola operación.
   * Si otra petición ya la rotó o revocó, lanza SesionInvalidaError.
   */
  abstract rotar(
    anterior: RefreshTokenGuardado,
    ahora: Date,
  ): Promise<SesionEmitida>;

  abstract revocar(refreshTokenId: string, ahora: Date): Promise<void>;

  /** Cierra todas las sesiones abiertas de una persona. */
  abstract revocarTodas(titular: TitularSesion, ahora: Date): Promise<void>;
}
