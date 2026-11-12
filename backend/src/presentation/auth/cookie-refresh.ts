import type { CookieOptions, Request, Response } from 'express';
import { SesionEmitida } from '../../application/auth/emisor-sesion.port.js';
import { PREFIJO_API } from '../../app.setup.js';

export const COOKIE_REFRESH = 'refresh_token';

/** Lo que va en el cuerpo de la respuesta: todo menos el refresh token, que va en la cookie. */
export type SesionSinRefresh = Omit<SesionEmitida, 'refreshToken'>;

/*
 * httpOnly: JavaScript no puede leerla, así que un XSS no se lleva la sesión.
 * SameSite=Strict: el navegador no la envía desde otros sitios (CSRF); por eso el frontend
 * debe servirse en el mismo sitio que la API (otro puerto del mismo host sirve).
 * path: solo viaja a /auth (refresh y logout), no en cada petición.
 * secure solo en producción: en la sala se entra por http mientras no haya HTTPS.
 */
function opciones(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: `/${PREFIJO_API}/auth`,
  };
}

export function ponerCookieRefresh(
  res: Response,
  sesion: SesionEmitida,
): SesionSinRefresh {
  res.cookie(COOKIE_REFRESH, sesion.refreshToken, {
    ...opciones(),
    expires: sesion.refreshTokenExpiraEn,
  });
  return {
    accessToken: sesion.accessToken,
    accessTokenExpiraEn: sesion.accessTokenExpiraEn,
    refreshTokenExpiraEn: sesion.refreshTokenExpiraEn,
  };
}

export function borrarCookieRefresh(res: Response): void {
  res.clearCookie(COOKIE_REFRESH, opciones());
}

/** Sin cookie-parser: solo se necesita esta cookie. Su valor (uuid.base64url) no requiere decodificar. */
export function leerCookieRefresh(req: Request): string | null {
  for (const par of req.headers.cookie?.split(';') ?? []) {
    const [nombre, ...valor] = par.trim().split('=');
    if (nombre === COOKIE_REFRESH) return valor.join('=');
  }
  return null;
}
