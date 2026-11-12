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
  }

  async solicitarRegistro(datos: SolicitudRegistro): Promise<CodigoEnviado> {
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
  }

  async verificarRegistro(
    params: VerificarRegistroParams,
  ): Promise<AuthSession> {
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
  }

  async reenviarCodigo(registroId: string): Promise<CodigoEnviado> {
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
