import type { AuthRepository } from '@/application/auth/ports';
import {
  AuthConflictError,
  AuthError,
  AuthExpiredError,
  AuthRateLimitError,
  AuthValidationError,
} from '@/domain/auth/errors';
import type {
  AuthSession,
  AvisoPrivacidad,
  CodigoEnviado,
  SolicitudInicioSesion,
  SolicitudRegistro,
  VerificarInicioSesionParams,
  VerificarRegistroParams,
} from '@/domain/auth/types';

const STORAGE_KEY_SESION = 'kama_auth_session';

export class HttpAuthRepository implements AuthRepository {
  constructor(private readonly baseUrl = '/api/v1') {}

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

  async renovarSesion(): Promise<AuthSession> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!res.ok) {
        await this.manejarErrorHttp(res);
      }

      const data = (await res.json()) as {
        accessToken: string;
        accessTokenExpiraEn?: string;
        refreshTokenExpiraEn?: string;
      };

      const actual = await this.obtenerSesion();
      const sesion: AuthSession = {
        usuario: actual?.usuario ?? {
          nombre: 'Usuario',
          rol: 'USUARIO_PUBLICO',
        },
        accessToken: data.accessToken,
        accessTokenExpiraEn: data.accessTokenExpiraEn
          ? new Date(data.accessTokenExpiraEn)
          : undefined,
        refreshTokenExpiraEn: data.refreshTokenExpiraEn
          ? new Date(data.refreshTokenExpiraEn)
          : undefined,
      };

      await this.guardarSesion(sesion);
      return sesion;
    } catch (err) {
      this.manejarFalloRed(err);
    }
  }

  async cerrarSesion(): Promise<void> {
    try {
      // Invalida la sesión y borra la cookie httpOnly refresh_token en el backend (HU-02)
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Si la red falla o el backend está apagado, igualmente limpiamos el almacenamiento local
    } finally {
      try {
        localStorage.removeItem(STORAGE_KEY_SESION);
      } catch (e) {
        console.error(
          'No se pudo limpiar la sesión del almacenamiento local',
          e,
        );
      }
    }
  }

  private manejarFalloRed(err: unknown): never {
    if (err instanceof AuthError) throw err;
    if (
      err instanceof TypeError &&
      err.message.toLowerCase().includes('fetch')
    ) {
      throw new AuthError(
        'No se pudo conectar con el servidor. Asegúrate de que el backend esté iniciado en http://localhost:3000.',
      );
    }
    if (err instanceof Error) {
      throw new AuthError(err.message);
    }
    throw new AuthError(
      'Ocurrió un error de conexión al comunicarse con el servidor.',
    );
  }

  private async manejarErrorHttp(res: Response): Promise<never> {
    let mensaje = 'Ocurrió un error al procesar tu solicitud.';
    let campo: string | undefined;

    try {
      const errorJson = (await res.json()) as {
        mensaje?: string | string[];
        message?: string | string[];
        error?: string;
        campo?: string;
      };
      const msg = errorJson.mensaje || errorJson.message || errorJson.error;
      if (Array.isArray(msg)) {
        mensaje = msg.join('. ');
      } else if (typeof msg === 'string') {
        mensaje = msg;
      }
      campo = errorJson.campo;
    } catch {
      // Ignorar fallo de parseo JSON y usar mensaje genérico
    }

    if (res.status === 409) {
      throw new AuthConflictError(mensaje);
    }
    if (res.status === 410) {
      throw new AuthExpiredError(mensaje);
    }
    if (res.status === 429) {
      throw new AuthRateLimitError(mensaje);
    }
    if (res.status === 400) {
      throw new AuthValidationError(mensaje, campo);
    }

    throw new AuthError(mensaje, res.status, campo);
  }
}
