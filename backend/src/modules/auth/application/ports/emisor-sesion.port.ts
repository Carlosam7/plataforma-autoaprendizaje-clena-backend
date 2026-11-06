import { Rol } from '../../domain/tipos.js';

export interface SesionEmitida {
  accessToken: string;
  accessTokenExpiraEn: Date;
  refreshToken: string;
  refreshTokenExpiraEn: Date;
}

/** Abre una sesión: emite el access token y guarda el refresh token (con hash). */
export interface EmisorSesion {
  iniciar(usuario: { id: string; rol: Rol }): Promise<SesionEmitida>;
}
