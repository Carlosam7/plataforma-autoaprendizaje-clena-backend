/**
 * Piezas comunes de los adaptadores HTTP (C-00): leer el error uniforme del backend y
 * renovar el access token con la cookie httpOnly del refresh token.
 */

export const API_BASE = '/api/v1';

export const MENSAJE_SIN_CONEXION =
  'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';

/** Error uniforme del backend: `{statusCode, codigo, mensaje, detalles?, ruta, fecha}`. */
export interface ErrorApi {
  status: number;
  /** Estable, para decidir en el código (p. ej. `CODIGO_EXPIRADO`). */
  codigo?: string;
  /** En español sencillo: se muestra tal cual. */
  mensaje: string;
  /**
   * Campo del formulario al que se refiere el error, si el backend lo dice:
   * `detalles.campo` (error de negocio) o el primero de `detalles.campos` (validación).
   */
  campo?: string;
}

interface CuerpoError {
  codigo?: unknown;
  mensaje?: unknown;
  detalles?: { campo?: unknown; campos?: Record<string, unknown> };
}

export async function leerErrorApi(
  res: Response,
  mensajePorDefecto = 'Ocurrió un error al procesar tu solicitud.',
): Promise<ErrorApi> {
  let cuerpo: CuerpoError = {};
  try {
    cuerpo = ((await res.json()) ?? {}) as CuerpoError;
  } catch {
    // Sin cuerpo JSON (p. ej. un proxy caído): se usa el mensaje por defecto.
  }
  const campos = cuerpo.detalles?.campos;
  const campo =
    typeof cuerpo.detalles?.campo === 'string'
      ? cuerpo.detalles.campo
      : campos && typeof campos === 'object'
        ? Object.keys(campos)[0]
        : undefined;
  return {
    status: res.status,
    codigo: typeof cuerpo.codigo === 'string' ? cuerpo.codigo : undefined,
    mensaje:
      typeof cuerpo.mensaje === 'string' && cuerpo.mensaje.trim() !== ''
        ? cuerpo.mensaje
        : mensajePorDefecto,
    campo,
  };
}

/** `fetch` lanza TypeError cuando no hay red o el servidor no responde. */
export function esFalloDeRed(err: unknown): boolean {
  return err instanceof TypeError;
}

export interface TokenRenovado {
  accessToken: string;
  accessTokenExpiraEn?: Date;
  refreshTokenExpiraEn?: Date;
}

/**
 * `POST /auth/refresh` con la cookie httpOnly (C-08). El refresh token rota en cada uso.
 * Devuelve null si la sesión ya no se puede renovar (401): hay que volver a iniciar sesión.
 * Lanza el ErrorApi ante cualquier otro error, y TypeError si no hay red.
 */
export async function renovarAccessToken(
  baseUrl = API_BASE,
): Promise<TokenRenovado | null> {
  const res = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });
  if (res.status === 401) return null;
  if (!res.ok) throw await leerErrorApi(res);
  const data = (await res.json()) as {
    accessToken: string;
    accessTokenExpiraEn?: string;
    refreshTokenExpiraEn?: string;
  };
  return {
    accessToken: data.accessToken,
    accessTokenExpiraEn: data.accessTokenExpiraEn
      ? new Date(data.accessTokenExpiraEn)
      : undefined,
    refreshTokenExpiraEn: data.refreshTokenExpiraEn
      ? new Date(data.refreshTokenExpiraEn)
      : undefined,
  };
}

/** Margen para renovar antes de que venza, y no a mitad de una petición. */
const MARGEN_RENOVACION_MS = 30_000;

/** true si el access token ya venció o vence en menos de 30 s. */
export function debeRenovarse(
  expiraEn: Date | string | undefined,
  ahora = Date.now(),
): boolean {
  if (!expiraEn) return false;
  const instante = new Date(expiraEn).getTime();
  return Number.isNaN(instante) || instante - MARGEN_RENOVACION_MS <= ahora;
}
