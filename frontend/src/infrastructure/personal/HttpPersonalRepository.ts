import type { PersonalRepository } from '@/application/personal/ports';
import {
  AccesoDenegadoPersonalError,
  CodigoPersonalExpiradoError,
  CodigoPersonalInvalidoError,
  CorreoEnUsoError,
  CredencialesIncorrectasError,
  PersonalError,
  ServicioNoDisponiblePersonalError,
} from '@/domain/personal/errors';
import type {
  CambiarPasswordInicialComando,
  CodigoPasswordEnviado,
  CrearPersonalComando,
  EditarPersonalComando,
  InicioSesionPersonalSolicitado,
  ListarPersonalCriterio,
  Personal,
  PersonalPaginado,
  SesionPersonal,
  SolicitarInicioSesionPersonalComando,
  VerificarInicioSesionPersonalComando,
} from '@/domain/personal/types';

const TIMEOUT_MS = 10_000;
const STORAGE_KEY_PERSONAL_SESION = 'kama_personal_session';

interface PersonalBackend {
  id: string;
  nombre: string;
  correo: string;
  rol: 'PERSONAL' | 'ADMINISTRADOR';
  activo: boolean;
  debeCambiarPassword: boolean;
  ultimoAccesoEn: string | null;
  creadoEn: string;
}

interface PersonalPaginadoBackend {
  datos: PersonalBackend[];
  total: number;
  pagina: number;
  limite: number;
}

function mapearPersonal(p: PersonalBackend): Personal {
  return {
    id: p.id,
    nombre: p.nombre,
    correo: p.correo,
    rol: p.rol,
    activo: p.activo,
    debeCambiarPassword: p.debeCambiarPassword,
    ultimoAccesoEn: p.ultimoAccesoEn ? new Date(p.ultimoAccesoEn) : null,
    creadoEn: new Date(p.creadoEn),
  };
}

export class HttpPersonalRepository implements PersonalRepository {
  constructor(private readonly baseUrl = '/api/v1') {}

  /** fetch que traduce red/timeout/HTTP no-OK a errores de dominio. Sin fallback. */
  private async enviar(ruta: string, init: RequestInit): Promise<Response> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${ruta}`, {
        ...init,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'TimeoutError') {
        throw new ServicioNoDisponiblePersonalError(
          'El servidor tardó demasiado en responder. Inténtalo de nuevo.',
        );
      }
      throw new ServicioNoDisponiblePersonalError();
    }
    if (!res.ok) await this.manejarErrorHttp(res);
    return res;
  }

  private async leerJson<T>(res: Response): Promise<T> {
    try {
      return (await res.json()) as T;
    } catch {
      throw new ServicioNoDisponiblePersonalError(
        'El servidor envió una respuesta inesperada.',
        res.status,
      );
    }
  }

  private cabeceras(token?: string, conCuerpo = false): HeadersInit {
    return {
      ...(conCuerpo ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: 'application/json',
    };
  }

  async solicitarInicioSesion(
    comando: SolicitarInicioSesionPersonalComando,
  ): Promise<InicioSesionPersonalSolicitado> {
    const res = await this.enviar('/auth/personal/login', {
      method: 'POST',
      headers: this.cabeceras(undefined, true),
      credentials: 'include',
      body: JSON.stringify(comando),
    });

    const data = await this.leerJson<{
      destino: string;
      expiraEn: string;
      reenviarEnSegundos?: number;
      mensaje: string;
    }>(res);

    return {
      destino: data.destino,
      expiraEn: new Date(data.expiraEn),
      reenviarEnSegundos: data.reenviarEnSegundos ?? 60,
      mensaje: data.mensaje,
    };
  }

  async verificarInicioSesion(
    comando: VerificarInicioSesionPersonalComando,
  ): Promise<SesionPersonal> {
    const res = await this.enviar('/auth/personal/login/verificar', {
      method: 'POST',
      headers: this.cabeceras(undefined, true),
      credentials: 'include',
      body: JSON.stringify(comando),
    });

    const data = await this.leerJson<{
      usuario: {
        id?: string;
        nombre: string;
        rol: 'PERSONAL' | 'ADMINISTRADOR';
        debeCambiarPassword: boolean;
      };
      accessToken: string;
    }>(res);

    const sesion: SesionPersonal = {
      usuario: {
        id: data.usuario.id ?? 'personal-yo',
        nombre: data.usuario.nombre,
        rol: data.usuario.rol,
        debeCambiarPassword: data.usuario.debeCambiarPassword,
      },
      accessToken: data.accessToken,
    };

    await this.guardarSesionPersonal(sesion);
    return sesion;
  }

  async solicitarCodigoPasswordInicial(
    token: string,
  ): Promise<CodigoPasswordEnviado> {
    const res = await this.enviar('/personal/yo/password/codigo', {
      method: 'POST',
      headers: this.cabeceras(token),
      credentials: 'include',
    });

    const data = await this.leerJson<{
      destino: string;
      expiraEn: string;
      mensaje: string;
    }>(res);

    return {
      destino: data.destino,
      expiraEn: new Date(data.expiraEn),
      mensaje: data.mensaje,
    };
  }

  async cambiarPasswordInicial(
    token: string,
    comando: CambiarPasswordInicialComando,
  ): Promise<void> {
    await this.enviar('/personal/yo/password', {
      method: 'POST',
      headers: this.cabeceras(token, true),
      credentials: 'include',
      body: JSON.stringify(comando),
    });
  }

  async listarPersonal(
    token: string,
    criterio?: ListarPersonalCriterio,
  ): Promise<PersonalPaginado> {
    const params = new URLSearchParams();
    if (criterio?.q) params.set('q', criterio.q);
    if (criterio?.rol) params.set('rol', criterio.rol);
    if (criterio?.activo !== undefined)
      params.set('activo', String(criterio.activo));
    if (criterio?.ordenarPor) params.set('ordenarPor', criterio.ordenarPor);
    if (criterio?.direccion) params.set('direccion', criterio.direccion);
    if (criterio?.pagina) params.set('pagina', String(criterio.pagina));
    if (criterio?.limite) params.set('limite', String(criterio.limite));

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await this.enviar(`/personal${qs}`, {
      headers: this.cabeceras(token),
      credentials: 'include',
    });

    const data = await this.leerJson<PersonalPaginadoBackend>(res);
    if (!Array.isArray(data?.datos)) {
      throw new ServicioNoDisponiblePersonalError(
        'El servidor envió una respuesta inesperada.',
        res.status,
      );
    }
    return {
      datos: data.datos.map(mapearPersonal),
      total: data.total,
      pagina: data.pagina,
      limite: data.limite,
    };
  }

  async crearPersonal(
    token: string,
    comando: CrearPersonalComando,
  ): Promise<Personal> {
    const res = await this.enviar('/personal', {
      method: 'POST',
      headers: this.cabeceras(token, true),
      credentials: 'include',
      body: JSON.stringify(comando),
    });
    return mapearPersonal(await this.leerJson<PersonalBackend>(res));
  }

  async obtenerPersonal(token: string, id: string): Promise<Personal> {
    const res = await this.enviar(`/personal/${encodeURIComponent(id)}`, {
      headers: this.cabeceras(token),
      credentials: 'include',
    });
    return mapearPersonal(await this.leerJson<PersonalBackend>(res));
  }

  async editarPersonal(
    token: string,
    id: string,
    comando: EditarPersonalComando,
  ): Promise<Personal> {
    const res = await this.enviar(`/personal/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: this.cabeceras(token, true),
      credentials: 'include',
      body: JSON.stringify(comando),
    });
    return mapearPersonal(await this.leerJson<PersonalBackend>(res));
  }

  async desactivarPersonal(token: string, id: string): Promise<Personal> {
    const res = await this.enviar(
      `/personal/${encodeURIComponent(id)}/desactivar`,
      {
        method: 'POST',
        headers: this.cabeceras(token),
        credentials: 'include',
      },
    );
    return mapearPersonal(await this.leerJson<PersonalBackend>(res));
  }

  async reactivarPersonal(token: string, id: string): Promise<Personal> {
    const res = await this.enviar(
      `/personal/${encodeURIComponent(id)}/reactivar`,
      {
        method: 'POST',
        headers: this.cabeceras(token),
        credentials: 'include',
      },
    );
    return mapearPersonal(await this.leerJson<PersonalBackend>(res));
  }

  async obtenerSesionPersonal(): Promise<SesionPersonal | null> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PERSONAL_SESION);
      if (!raw) return null;
      return JSON.parse(raw) as SesionPersonal;
    } catch {
      return null;
    }
  }

  async guardarSesionPersonal(sesion: SesionPersonal): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY_PERSONAL_SESION, JSON.stringify(sesion));
    } catch {
      // Ignorar fallo de almacenamiento
    }
  }

  async cerrarSesionPersonal(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      // El cierre local de sesión no depende de la red
    } finally {
      try {
        localStorage.removeItem(STORAGE_KEY_PERSONAL_SESION);
      } catch {
        // Ignorar fallo
      }
    }
  }

  private async manejarErrorHttp(res: Response): Promise<never> {
    let mensaje = 'Ocurrió un error en el servidor.';
    try {
      const err = (await res.json()) as {
        mensaje?: string | string[];
        message?: string | string[];
        error?: string;
      };
      const m = err.mensaje || err.message || err.error;
      if (Array.isArray(m)) mensaje = m.join('. ');
      else if (typeof m === 'string') mensaje = m;
    } catch {
      // Ignorar
    }

    if (res.status === 401) {
      throw new CredencialesIncorrectasError(mensaje);
    }
    if (res.status === 403) {
      throw new AccesoDenegadoPersonalError(mensaje);
    }
    if (res.status === 409) {
      throw new CorreoEnUsoError(mensaje);
    }
    if (res.status === 410) {
      throw new CodigoPersonalExpiradoError(mensaje);
    }
    if (res.status === 400) {
      if (mensaje.toLowerCase().includes('código')) {
        throw new CodigoPersonalInvalidoError(mensaje);
      }
      throw new PersonalError(mensaje, 400);
    }
    if (res.status >= 500) {
      throw new ServicioNoDisponiblePersonalError(
        'El servidor no pudo atender la solicitud. Inténtalo de nuevo en unos minutos.',
        res.status,
      );
    }
    throw new PersonalError(mensaje, res.status);
  }
}
