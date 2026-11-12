import { Rol } from '../../domain/auth/tipos.js';

export interface SesionEmitida {
  accessToken: string;
  accessTokenExpiraEn: Date;
  refreshToken: string;
  refreshTokenExpiraEn: Date;
}

/** Abre una sesión: emite el access token y guarda el refresh token (con hash). */
export abstract class EmisorSesion {
  abstract iniciar(usuario: { id: string; rol: Rol }): Promise<SesionEmitida>;
}
