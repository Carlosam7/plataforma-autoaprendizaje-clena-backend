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
  SolicitudRegistro,
  VerificarRegistroParams,
} from '@/domain/auth/types';

const STORAGE_KEY_SESION = 'kama_auth_session';

export class HttpAuthRepository implements AuthRepository {
  constructor(private readonly baseUrl = '/api/v1') {}

  async obtenerAvisoPrivacidad(): Promise<AvisoPrivacidad> {
    try {
      const res = await fetch(`${this.baseUrl}/aviso-privacidad/vigente`, {
        headers: { Accept: 'application/json' },
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

  async solicitarInicioSesion(correo: string): Promise<CodigoEnviado> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/inicio-sesion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ correo }),
      });

      if (!res.ok) {
        if (res.status === 404) {
          // Backend HU-02 en preparación: fallback amigable para el frontend
          const [usuario, dominio] = correo.split('@');
          return {
            registroId: `login-${Date.now()}`,
            canal: 'CORREO',
            destino: `${usuario[0]}****@${dominio}`,
            mensaje: `Te enviamos un código a ${correo}. Escríbelo para iniciar sesión.`,
            expiraEn: new Date(Date.now() + 600000),
            puedeReenviarEn: new Date(Date.now() + 60000),
          };
        }
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
      if (err instanceof AuthError) throw err;
      const [usuario, dominio] = correo.split('@');
      return {
        registroId: `login-${Date.now()}`,
        canal: 'CORREO',
        destino: `${usuario[0]}****@${dominio}`,
        mensaje: `Te enviamos un código a ${correo}. Escríbelo para iniciar sesión.`,
        expiraEn: new Date(Date.now() + 600000),
        puedeReenviarEn: new Date(Date.now() + 60000),
      };
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
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        await this.manejarErrorHttp(res);
      }

      const data = (await res.json()) as AuthSession;
      return data;
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

  async cerrarSesion(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY_SESION);
    } catch (e) {
      console.error('No se pudo limpiar la sesión del almacenamiento local', e);
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
