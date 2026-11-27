import type { Request, Response } from 'express';
import { PREFIJO_API } from '../../app.setup.js';
import { leerCookie } from '../shared/cookies.js';

export const COOKIE_LLAVE_AYUDA = 'llave_ayuda';

/** Una jornada de la sala; cada nueva solicitud desde el navegador la renueva. */
const VIGENCIA_LLAVE_MS = 12 * 60 * 60 * 1000;

/*
 * C-05: la llave demuestra que este navegador pidió la solicitud.
 * httpOnly: JavaScript no la lee, así que un XSS no se la lleva.
 * SameSite=Strict: otro sitio no puede cancelar la solicitud desde el navegador (CSRF); por
 * eso el frontend se sirve en el mismo sitio que la API (proxy de Vite o de nginx).
 * path: solo viaja a /solicitudes-ayuda, no en cada petición.
 * secure solo en producción, como la del refresh token: en la sala se entra por http.
 */
export function ponerCookieLlaveAyuda(res: Response, llave: string): void {
  res.cookie(COOKIE_LLAVE_AYUDA, llave, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: `/${PREFIJO_API}/solicitudes-ayuda`,
    maxAge: VIGENCIA_LLAVE_MS,
  });
}

export function leerCookieLlaveAyuda(req: Request): string | null {
  return leerCookie(req, COOKIE_LLAVE_AYUDA);
}
