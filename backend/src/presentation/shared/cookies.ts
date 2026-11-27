import type { Request } from 'express';

/**
 * Valor de una cookie de la petición, o null si no llegó. Sin cookie-parser: solo se leen
 * las cookies propias (refresh_token, llave_ayuda), cuyos valores no necesitan decodificar.
 */
export function leerCookie(req: Request, nombre: string): string | null {
  for (const par of req.headers.cookie?.split(';') ?? []) {
    const [clave, ...valor] = par.trim().split('=');
    if (clave === nombre) return valor.join('=');
  }
  return null;
}
