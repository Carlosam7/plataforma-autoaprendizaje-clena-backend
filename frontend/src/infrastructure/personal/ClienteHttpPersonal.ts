import {
  AccesoDenegadoPersonalError,
  PersonalError,
  ServicioNoDisponiblePersonalError,
  SesionPersonalExpiradaError,
} from '@/domain/personal/errors';
import type { SesionPersonal } from '@/domain/personal/types';
import {
  API_BASE,
  debeRenovarse,
  esFalloDeRed,
  leerErrorApi,
  renovarAccessToken,
} from '@/infrastructure/http/api';

// El access token se guarda en localStorage, como la sesión pública (ver C-08: riesgo
// documentado en computadores compartidos). El refresh token nunca: va en cookie httpOnly.
export const STORAGE_KEY_PERSONAL_SESION = 'kama_personal_session';
/** FE-03: sin respuesta en 10 s se avisa en vez de dejar la pantalla esperando. */
const TIMEOUT_MS = 10_000;

/**
 * Peticiones HTTP del personal del CLENA (C-06, C-07, C-09) con la sesión guardada en este
 * navegador. Lo comparten los adaptadores de personal, gestión de guías y cola de ayuda,
 * para que todos renueven la sesión y traten los errores igual. Nunca simula respuestas.
 */
export class ClienteHttpPersonal {
  constructor(private readonly baseUrl = API_BASE) {}

  leerSesion(): SesionPersonal | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PERSONAL_SESION);
      return raw ? (JSON.parse(raw) as SesionPersonal) : null;
    } catch {
      return null;
    }
  }

  guardarSesion(sesion: SesionPersonal): void {
    try {
      localStorage.setItem(STORAGE_KEY_PERSONAL_SESION, JSON.stringify(sesion));
    } catch {
      // Almacenamiento bloqueado (modo privado): la sesión dura hasta recargar.
    }
  }

  olvidarSesion(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_PERSONAL_SESION);
    } catch {
      // Ignorar: almacenamiento bloqueado.
    }
  }

  /**
   * `fetch` con cookies y un tiempo máximo de 10 s (FE-03). Sin respuesta del servidor
   * lanza ServicioNoDisponiblePersonalError.
   */
  async enviar(ruta: string, init: RequestInit = {}): Promise<Response> {
    try {
      return await fetch(`${this.baseUrl}${ruta}`, {
        ...init,
        credentials: 'include',
        headers: { Accept: 'application/json', ...init.headers },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'TimeoutError') {
        throw new ServicioNoDisponiblePersonalError(
          'El servidor tardó demasiado en responder. Inténtalo de nuevo.',
        );
      }
      if (esFalloDeRed(err)) throw new ServicioNoDisponiblePersonalError();
      throw err;
    }
  }

  /** El cuerpo JSON de una respuesta correcta; si no lo es, error explícito (FE-03). */
  async leerJson<T>(res: Response): Promise<T> {
    try {
      return (await res.json()) as T;
    } catch {
      throw new ServicioNoDisponiblePersonalError(
        'El servidor envió una respuesta inesperada.',
        res.status,
      );
    }
  }

  /**
   * Petición con el access token de la sesión guardada (o `tokenPorDefecto` si no hay).
   * Si está por vencer, primero lo renueva con la cookie (`POST /auth/refresh`). Ante un
   * 401 renueva una sola vez y solo **reintenta las lecturas (GET)**: repetir un POST, PUT
   * o PATCH podría aplicarlo dos veces (C-00).
   */
  async autenticada(
    ruta: string,
    init: RequestInit = {},
    tokenPorDefecto?: string,
  ): Promise<Response> {
    const conToken = (t: string): RequestInit => ({
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${t}` },
    });

    // Las pantallas pueden pasar el token que leyeron al abrirse; el guardado puede ser
    // más nuevo (otra pestaña o una renovación), así que manda el guardado.
    const sesion = this.leerSesion();
    const actual = sesion?.accessToken ?? tokenPorDefecto;
    if (!actual) throw new SesionPersonalExpiradaError();
    const vigente =
      sesion && debeRenovarse(sesion.accessTokenExpiraEn)
        ? await this.renovar()
        : actual;

    const res = await this.enviar(ruta, conToken(vigente));
    if (res.status !== 401) return res;

    const renovado = await this.renovar();
    if ((init.method ?? 'GET') === 'GET') {
      const reintento = await this.enviar(ruta, conToken(renovado));
      if (reintento.status !== 401) return reintento;
      this.olvidarSesion();
      throw new SesionPersonalExpiradaError();
    }
    throw new PersonalError(
      'Tu sesión se renovó. Vuelve a intentarlo.',
      401,
      'SESION_RENOVADA',
    );
  }

  /** Nuevo access token; si la sesión ya no se puede renovar, la olvida y lanza el error. */
  async renovar(): Promise<string> {
    let renovado;
    try {
      renovado = await renovarAccessToken(this.baseUrl);
    } catch (err) {
      if (esFalloDeRed(err)) throw new ServicioNoDisponiblePersonalError();
      throw new PersonalError(
        'No se pudo renovar la sesión. Vuelve a iniciar sesión.',
      );
    }
    if (!renovado) {
      this.olvidarSesion();
      throw new SesionPersonalExpiradaError();
    }
    const sesion = this.leerSesion();
    if (sesion) {
      this.guardarSesion({
        ...sesion,
        accessToken: renovado.accessToken,
        accessTokenExpiraEn: renovado.accessTokenExpiraEn,
      });
    }
    return renovado.accessToken;
  }

  /**
   * Error del backend (C-00) para rutas con token: `403` es AccesoDenegado, `502/503/504`
   * ServicioNoDisponible y el resto un PersonalError con su `mensaje` y su `codigo`.
   */
  async errorDe(res: Response): Promise<PersonalError> {
    const e = await leerErrorApi(res, 'Ocurrió un error en el servidor.');
    switch (res.status) {
      case 403:
        return new AccesoDenegadoPersonalError(e.mensaje);
      case 502:
      case 503:
      case 504:
        return new ServicioNoDisponiblePersonalError(e.mensaje, res.status);
    }
    return new PersonalError(e.mensaje, res.status, e.codigo, e.campo);
  }
}
