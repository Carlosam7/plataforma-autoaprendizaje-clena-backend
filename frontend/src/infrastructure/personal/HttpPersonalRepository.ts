import type { PersonalRepository } from '@/application/personal/ports';
import {
  AccesoDenegadoPersonalError,
  CodigoPersonalExpiradoError,
  CodigoPersonalInvalidoError,
  CorreoEnUsoError,
  CredencialesIncorrectasError,
  PersonalError,
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
import { InMemoryPersonalRepository } from './InMemoryPersonalRepository';

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
  private readonly fallback: InMemoryPersonalRepository;

  constructor(
    private readonly baseUrl = '/api/v1',
    fallback?: InMemoryPersonalRepository,
  ) {
    this.fallback = fallback ?? new InMemoryPersonalRepository();
  }

  async solicitarInicioSesion(
    comando: SolicitarInicioSesionPersonalComando,
  ): Promise<InicioSesionPersonalSolicitado> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/personal/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(comando),
      });

      if (!res.ok) {
        await this.manejarErrorHttp(res);
      }

      const data = (await res.json()) as {
        destino: string;
        expiraEn: string;
        reenviarEnSegundos?: number;
        puedeReenviarEn?: string;
        mensaje: string;
      };

      return {
        destino: data.destino,
        expiraEn: new Date(data.expiraEn),
        reenviarEnSegundos: data.reenviarEnSegundos ?? 60,
        mensaje: data.mensaje,
      };
    } catch (err) {
      if (err instanceof PersonalError) throw err;
      return this.fallback.solicitarInicioSesion(comando);
    }
  }

  async verificarInicioSesion(
    comando: VerificarInicioSesionPersonalComando,
  ): Promise<SesionPersonal> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/personal/login/verificar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(comando),
      });

      if (!res.ok) {
        await this.manejarErrorHttp(res);
      }

      const data = (await res.json()) as {
        usuario: {
          id?: string;
          nombre: string;
          rol: 'PERSONAL' | 'ADMINISTRADOR';
          debeCambiarPassword: boolean;
        };
        accessToken: string;
      };

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
    } catch (err) {
      if (err instanceof PersonalError) throw err;
      return this.fallback.verificarInicioSesion(comando);
    }
  }

  async solicitarCodigoPasswordInicial(
    token: string,
  ): Promise<CodigoPasswordEnviado> {
    try {
      const res = await fetch(`${this.baseUrl}/personal/yo/password/codigo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!res.ok) {
        await this.manejarErrorHttp(res);
      }

      const data = (await res.json()) as {
        destino: string;
        expiraEn: string;
        mensaje: string;
      };

      return {
        destino: data.destino,
        expiraEn: new Date(data.expiraEn),
        mensaje: data.mensaje,
      };
    } catch (err) {
      if (err instanceof PersonalError) throw err;
      return this.fallback.solicitarCodigoPasswordInicial(token);
    }
  }

  async cambiarPasswordInicial(
    token: string,
    comando: CambiarPasswordInicialComando,
  ): Promise<void> {
    try {
      const res = await fetch(`${this.baseUrl}/personal/yo/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(comando),
      });

      if (!res.ok) {
        await this.manejarErrorHttp(res);
      }
    } catch (err) {
      if (err instanceof PersonalError) throw err;
      return this.fallback.cambiarPasswordInicial(token, comando);
    }
  }

  async listarPersonal(
    token: string,
    criterio?: ListarPersonalCriterio,
  ): Promise<PersonalPaginado> {
    try {
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
      const res = await fetch(`${this.baseUrl}/personal${qs}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!res.ok) {
        await this.manejarErrorHttp(res);
      }

      const data = (await res.json()) as PersonalPaginadoBackend;
      return {
        datos: data.datos.map(mapearPersonal),
        total: data.total,
        pagina: data.pagina,
        limite: data.limite,
      };
    } catch (err) {
      if (err instanceof PersonalError) throw err;
      return this.fallback.listarPersonal(token, criterio);
    }
  }

  async crearPersonal(
    token: string,
    comando: CrearPersonalComando,
  ): Promise<Personal> {
    try {
      const res = await fetch(`${this.baseUrl}/personal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(comando),
      });

      if (!res.ok) {
        await this.manejarErrorHttp(res);
      }

      const data = (await res.json()) as PersonalBackend;
      return mapearPersonal(data);
    } catch (err) {
      if (err instanceof PersonalError) throw err;
      return this.fallback.crearPersonal(token, comando);
    }
  }

  async obtenerPersonal(token: string, id: string): Promise<Personal> {
    try {
      const res = await fetch(`${this.baseUrl}/personal/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!res.ok) {
        await this.manejarErrorHttp(res);
      }

      const data = (await res.json()) as PersonalBackend;
      return mapearPersonal(data);
    } catch (err) {
      if (err instanceof PersonalError) throw err;
      return this.fallback.obtenerPersonal(token, id);
    }
  }

  async editarPersonal(
    token: string,
    id: string,
    comando: EditarPersonalComando,
  ): Promise<Personal> {
    try {
      const res = await fetch(`${this.baseUrl}/personal/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(comando),
      });

      if (!res.ok) {
        await this.manejarErrorHttp(res);
      }

      const data = (await res.json()) as PersonalBackend;
      return mapearPersonal(data);
    } catch (err) {
      if (err instanceof PersonalError) throw err;
      return this.fallback.editarPersonal(token, id, comando);
    }
  }

  async desactivarPersonal(token: string, id: string): Promise<Personal> {
    try {
      const res = await fetch(`${this.baseUrl}/personal/${id}/desactivar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!res.ok) {
        await this.manejarErrorHttp(res);
      }

      const data = (await res.json()) as PersonalBackend;
      return mapearPersonal(data);
    } catch (err) {
      if (err instanceof PersonalError) throw err;
      return this.fallback.desactivarPersonal(token, id);
    }
  }

  async reactivarPersonal(token: string, id: string): Promise<Personal> {
    try {
      const res = await fetch(`${this.baseUrl}/personal/${id}/reactivar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!res.ok) {
        await this.manejarErrorHttp(res);
      }

      const data = (await res.json()) as PersonalBackend;
      return mapearPersonal(data);
    } catch (err) {
      if (err instanceof PersonalError) throw err;
      return this.fallback.reactivarPersonal(token, id);
    }
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
      });
    } catch {
      // Fallback
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
    throw new PersonalError(mensaje, res.status);
  }
}
