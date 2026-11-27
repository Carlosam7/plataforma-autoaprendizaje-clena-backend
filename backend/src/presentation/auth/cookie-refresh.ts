import type { CookieOptions, Request, Response } from 'express';
import { SesionEmitida } from '../../application/auth/emisor-sesion.port.js';
import { PREFIJO_API } from '../../app.setup.js';
import { leerCookie } from '../shared/cookies.js';

export const COOKIE_REFRESH = 'refresh_token';

/** Lo que va en el cuerpo de la respuesta: todo menos el refresh token, que va en la cookie. */
export type SesionSinRefresh = Omit<SesionEmitida, 'refreshToken'>;

/**
 * Secure: COOKIE_SEGURA si está definida (true/false, la valida variables-entorno); si no,
 * solo en producción. Con Secure el navegador solo la envía por HTTPS.
 */
export function cookieSegura(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.COOKIE_SEGURA === 'true') return true;
  if (env.COOKIE_SEGURA === 'false') return false;
  return env.NODE_ENV === 'production';
}

/*
 * httpOnly: JavaScript no puede leerla, así que un XSS no se lleva la sesión.
 * SameSite=Strict: el navegador no la envía desde otros sitios (CSRF); por eso el frontend
 * debe servirse en el mismo sitio que la API (otro puerto del mismo host sirve).
 * path: solo viaja a /auth (refresh y logout), no en cada petición.
 * secure: ver cookieSegura(). En la sala se entra por http mientras no haya HTTPS, así que
 * un despliegue en producción por http necesita COOKIE_SEGURA=false.
 */
export function opcionesCookieRefresh(): CookieOptions {
  return {
    httpOnly: true,
    secure: cookieSegura(),
    sameSite: 'strict',
    path: `/${PREFIJO_API}/auth`,
  };
}

export function ponerCookieRefresh(
  res: Response,
  sesion: SesionEmitida,
): SesionSinRefresh {
  res.cookie(COOKIE_REFRESH, sesion.refreshToken, {
    ...opcionesCookieRefresh(),
    expires: sesion.refreshTokenExpiraEn,
  });
  return {
    accessToken: sesion.accessToken,
    accessTokenExpiraEn: sesion.accessTokenExpiraEn,
    refreshTokenExpiraEn: sesion.refreshTokenExpiraEn,
  };
}

export function borrarCookieRefresh(res: Response): void {
  res.clearCookie(COOKIE_REFRESH, opcionesCookieRefresh());
}

/** Su valor (uuid.base64url) no requiere decodificar. */
export function leerCookieRefresh(req: Request): string | null {
  return leerCookie(req, COOKIE_REFRESH);
}
