import type { AuthRepository } from '@/application/auth/ports';
import type { AuthSession } from '@/domain/auth/types';
import { SesionRequeridaError } from '@/domain/practica/errors';
import type { ModoPractica } from '@/domain/practica/types';

const ROL_USUARIO_PUBLICO = 'USUARIO_PUBLICO';
/** Margen para no enviar un token que vence durante la petición. */
const MARGEN_EXPIRACION_MS = 30_000;

export type Reloj = () => Date;

function esUsuarioPublico(sesion: AuthSession | null): sesion is AuthSession {
  return (
    !!sesion &&
    sesion.usuario?.rol === ROL_USUARIO_PUBLICO &&
    typeof sesion.accessToken === 'string' &&
    sesion.accessToken.length > 0
  );
}

function estaPorExpirar(sesion: AuthSession, ahora: Date): boolean {
  if (!sesion.accessTokenExpiraEn) return false;
  const expira = new Date(sesion.accessTokenExpiraEn).getTime();
  if (Number.isNaN(expira)) return false;
  return expira - ahora.getTime() <= MARGEN_EXPIRACION_MS;
}

/**
 * Solo un USUARIO_PUBLICO con sesión practica en modo REGISTRADO.
 * El personal y los visitantes practican como INVITADO: el backend
 * guardaría su intento como anónimo, lo que prohíbe el modelo v2.0.
 */
export async function determinarModoPractica(
  auth: AuthRepository,
): Promise<ModoPractica> {
  try {
    const sesion = await auth.obtenerSesion();
    return esUsuarioPublico(sesion) ? 'REGISTRADO' : 'INVITADO';
  } catch {
    return 'INVITADO';
  }
}

/**
 * Devuelve un access token vigente de USUARIO_PUBLICO. Si está por vencer
 * intenta renovarlo UNA sola vez. Necesario porque el backend responde 404
 * (no 401) cuando llega un token vencido a un intento de cuenta.
 */
export async function obtenerTokenUsuarioPublico(
  auth: AuthRepository,
  reloj: Reloj = () => new Date(),
): Promise<string> {
  const sesion = await auth.obtenerSesion();
  if (!esUsuarioPublico(sesion)) {
    throw new SesionRequeridaError();
  }
  if (!estaPorExpirar(sesion, reloj())) {
    return sesion.accessToken;
  }
  if (!auth.renovarSesion) {
    throw new SesionRequeridaError();
  }
  try {
    const renovada = await auth.renovarSesion();
    if (!esUsuarioPublico(renovada)) throw new SesionRequeridaError();
    return renovada.accessToken;
  } catch {
    throw new SesionRequeridaError();
  }
}
