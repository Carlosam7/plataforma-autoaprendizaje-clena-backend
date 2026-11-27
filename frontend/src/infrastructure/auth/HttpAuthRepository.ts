import type { AuthRepository } from '@/application/auth/ports';
import {
  AuthConflictError,
  AuthError,
  AuthExpiredError,
  AuthRateLimitError,
  AuthSessionExpiredError,
  AuthValidationError,
} from '@/domain/auth/errors';
import type {
  AuthSession,
  AvisoPrivacidad,
  CanalVerificacion,
  CodigoEnviado,
  ConfirmarEliminacionParams,
  EliminacionSolicitada,
  SolicitudInicioSesion,
  SolicitudRegistro,
  VerificarInicioSesionParams,
  VerificarRegistroParams,
} from '@/domain/auth/types';
import {
  API_BASE,
  debeRenovarse,
  esFalloDeRed,
  leerErrorApi,
  MENSAJE_SIN_CONEXION,
  renovarAccessToken,
} from '@/infrastructure/http/api';

/**
 * Sesión pública guardada en localStorage: usuario, access token (15 min) y vencimientos.
 * Riesgo documentado en C-08: en un computador compartido, otra persona que abra el
 * navegador antes de que venza podría usarla. El refresh token NUNCA se guarda aquí: va en
 * una cookie httpOnly que JavaScript no puede leer. No se cambia sin una prueba de
 * compatibilidad con todos los módulos (decisión de BE-05).
 */
const STORAGE_KEY_SESION = 'kama_auth_session';

export class HttpAuthRepository implements AuthRepository {
  constructor(private readonly baseUrl = API_BASE) {}

  async obtenerAvisoPrivacidad(): Promise<AvisoPrivacidad> {
    try {
      const res = await fetch(`${this.baseUrl}/aviso-privacidad/vigente`, {
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) {
        await this.manejarErrorHttp(res);
      }
      const data = (await res.json()) as {
        version: string;
        contenido: string;
        vigenteDesde: string;
      };
      return {
        version: data.version,
        contenido: data.contenido,
        vigenteDesde: new Date(data.vigenteDesde),
      };
    } catch (err) {
      this.manejarFalloRed(err);
    }
  }

  async solicitarRegistro(datos: SolicitudRegistro): Promise<CodigoEnviado> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(datos),
      });

      if (!res.ok) {
        await this.manejarErrorHttp(res);
      }

      const data = (await res.json()) as {
        registroId: string;
        canal: 'CORREO' | 'TELEFONO';
        destino: string;
        mensaje: string;
        expiraEn: string;
        puedeReenviarEn: string;
      };

      return {
        registroId: data.registroId,
        canal: data.canal,
        destino: data.destino,
        mensaje: data.mensaje,
        expiraEn: new Date(data.expiraEn),
        puedeReenviarEn: new Date(data.puedeReenviarEn),
      };
    } catch (err) {
      this.manejarFalloRed(err);
    }
  }

  async solicitarInicioSesion(
    datos: SolicitudInicioSesion,
  ): Promise<CodigoEnviado> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          numeroIdentificacion: datos.numeroIdentificacion,
          contacto: datos.contacto,
        }),
      });

      if (!res.ok) {
        await this.manejarErrorHttp(res);
      }

      const data = (await res.json()) as {
        solicitudId: string;
        canal: 'CORREO' | 'TELEFONO';
        destino: string;
        mensaje: string;
        expiraEn: string;
        puedeReenviarEn: string;
      };

      return {
        registroId: data.solicitudId,
        solicitudId: data.solicitudId,
        canal: data.canal,
        destino: data.destino,
        mensaje: data.mensaje,
        expiraEn: new Date(data.expiraEn),
        puedeReenviarEn: new Date(data.puedeReenviarEn),
      };
    } catch (err) {
      this.manejarFalloRed(err);
    }
  }

  async verificarInicioSesion(
    params: VerificarInicioSesionParams,
  ): Promise<AuthSession> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/login/verificar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          solicitudId: params.solicitudId,
          codigo: params.codigo,
        }),
      });

      if (!res.ok) {
        await this.manejarErrorHttp(res);
      }

      const data = (await res.json()) as {
        usuario: { nombre: string; rol: string };
        accessToken: string;
        accessTokenExpiraEn?: string;
        refreshTokenExpiraEn?: string;
      };

      return {
        usuario: data.usuario,
        accessToken: data.accessToken,
        accessTokenExpiraEn: data.accessTokenExpiraEn
          ? new Date(data.accessTokenExpiraEn)
          : undefined,
        refreshTokenExpiraEn: data.refreshTokenExpiraEn
          ? new Date(data.refreshTokenExpiraEn)
          : undefined,
      };
    } catch (err) {
      this.manejarFalloRed(err);
    }
  }

  async verificarRegistro(
    params: VerificarRegistroParams,
  ): Promise<AuthSession> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/registro/verificar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        await this.manejarErrorHttp(res);
      }

      const data = (await res.json()) as {
        usuario: { nombre: string; rol: string };
        accessToken: string;
        accessTokenExpiraEn?: string;
        refreshTokenExpiraEn?: string;
      };

      return {
        usuario: data.usuario,
        accessToken: data.accessToken,
        accessTokenExpiraEn: data.accessTokenExpiraEn
          ? new Date(data.accessTokenExpiraEn)
          : undefined,
        refreshTokenExpiraEn: data.refreshTokenExpiraEn
          ? new Date(data.refreshTokenExpiraEn)
          : undefined,
      };
    } catch (err) {
      this.manejarFalloRed(err);
    }
  }

  async reenviarCodigo(registroId: string): Promise<CodigoEnviado> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/registro/reenviar-codigo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ registroId }),
      });

      if (!res.ok) {
        await this.manejarErrorHttp(res);
      }

      const data = (await res.json()) as {
        registroId: string;
        canal: 'CORREO' | 'TELEFONO';
        destino: string;
        mensaje: string;
        expiraEn: string;
        puedeReenviarEn: string;
      };

      return {
        registroId: data.registroId,
        canal: data.canal,
        destino: data.destino,
        mensaje: data.mensaje,
        expiraEn: new Date(data.expiraEn),
        puedeReenviarEn: new Date(data.puedeReenviarEn),
      };
    } catch (err) {
      this.manejarFalloRed(err);
    }
  }

  async obtenerSesion(): Promise<AuthSession | null> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SESION);
      if (!raw) return null;
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  }

  async guardarSesion(sesion: AuthSession): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY_SESION, JSON.stringify(sesion));
    } catch (e) {
      console.error('No se pudo guardar la sesión en almacenamiento local', e);
    }
  }

  /**
   * `POST /auth/refresh` con la cookie httpOnly; el refresh token rota. Si ya no se puede
   * renovar (401), olvida la sesión y lanza AuthSessionExpiredError.
   */
  async renovarSesion(): Promise<AuthSession> {
    let renovado;
    try {
      renovado = await renovarAccessToken(this.baseUrl);
    } catch (err) {
      if (esFalloDeRed(err)) throw new AuthError(MENSAJE_SIN_CONEXION);
      throw new AuthError(
        'No se pudo renovar la sesión. Vuelve a iniciar sesión.',
      );
    }
    if (!renovado) {
      this.olvidarSesion();
      throw new AuthSessionExpiredError();
    }
    const actual = await this.obtenerSesion();
    if (!actual) throw new AuthSessionExpiredError();
    const sesion: AuthSession = { ...actual, ...renovado };
    await this.guardarSesion(sesion);
    return sesion;
  }

  async solicitarEliminacionCuenta(
    canal?: CanalVerificacion,
  ): Promise<EliminacionSolicitada> {
    const res = await this.autenticada('/auth/cuenta/eliminacion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(canal ? { canal } : {}),
    });
    if (!res.ok) await this.manejarErrorHttp(res);
    const data = (await res.json()) as {
      solicitudId: string;
      canal: CanalVerificacion;
      destino: string;
      mensaje: string;
      expiraEn: string;
      puedeReenviarEn: string;
    };
    return {
      solicitudId: data.solicitudId,
      canal: data.canal,
      destino: data.destino,
      mensaje: data.mensaje,
      expiraEn: new Date(data.expiraEn),
      puedeReenviarEn: new Date(data.puedeReenviarEn),
    };
  }

  async confirmarEliminacionCuenta(
    params: ConfirmarEliminacionParams,
  ): Promise<void> {
    const res = await this.autenticada('/auth/cuenta/eliminacion/confirmar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        solicitudId: params.solicitudId,
        codigo: params.codigo,
      }),
    });
    // 204 sin cuerpo: no se llama a res.json() (C-00).
    if (!res.ok) await this.manejarErrorHttp(res);
    // El backend ya borró la cookie del refresh token; aquí se olvida el resto.
    this.olvidarSesion();
  }

  async cerrarSesion(): Promise<void> {
    try {
      // Invalida la sesión y borra la cookie httpOnly refresh_token en el backend (HU-02)
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Si la red falla o el backend está apagado, igualmente se olvida la sesión aquí.
    } finally {
      this.olvidarSesion();
    }
  }

  private olvidarSesion(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_SESION);
    } catch (e) {
      console.error('No se pudo limpiar la sesión del almacenamiento local', e);
    }
  }

  /**
   * Petición con el access token de la sesión guardada. Si está por vencer lo renueva
   * antes. Ante un 401 renueva una sola vez y solo reintenta las lecturas (GET): repetir
   * un POST podría aplicarlo dos veces (C-00).
   */
  private async autenticada(
    ruta: string,
    init: RequestInit = {},
  ): Promise<Response> {
    const enviar = async (token: string) => {
      try {
        return await fetch(`${this.baseUrl}${ruta}`, {
          ...init,
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            ...init.headers,
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        this.manejarFalloRed(err);
      }
    };

    const sesion = await this.obtenerSesion();
    if (!sesion) throw new AuthSessionExpiredError();
    const token = debeRenovarse(sesion.accessTokenExpiraEn)
      ? (await this.renovarSesion()).accessToken
      : sesion.accessToken;

    const res = await enviar(token);
    if (res.status !== 401) return res;

    const renovada = await this.renovarSesion();
    if ((init.method ?? 'GET') === 'GET') {
      const reintento = await enviar(renovada.accessToken);
      if (reintento.status !== 401) return reintento;
      this.olvidarSesion();
      throw new AuthSessionExpiredError();
    }
    throw new AuthError(
      'Tu sesión se renovó. Vuelve a intentarlo.',
      401,
      undefined,
      'SESION_RENOVADA',
    );
  }

  private manejarFalloRed(err: unknown): never {
    if (err instanceof AuthError) throw err;
    if (esFalloDeRed(err)) throw new AuthError(MENSAJE_SIN_CONEXION);
    if (err instanceof Error) throw new AuthError(err.message);
    throw new AuthError(
      'Ocurrió un error de conexión al comunicarse con el servidor.',
    );
  }

  /** Traduce el error uniforme del backend (C-00), con su `codigo` y el campo afectado. */
  private async manejarErrorHttp(res: Response): Promise<never> {
    const e = await leerErrorApi(res);
    switch (res.status) {
      case 409:
        throw new AuthConflictError(e.mensaje, e.codigo, e.campo);
      case 410:
        throw new AuthExpiredError(e.mensaje, e.codigo);
      case 429:
        throw new AuthRateLimitError(e.mensaje, e.codigo);
      case 400:
        throw new AuthValidationError(e.mensaje, e.campo, e.codigo);
    }
    throw new AuthError(e.mensaje, res.status, e.campo, e.codigo);
  }
}
