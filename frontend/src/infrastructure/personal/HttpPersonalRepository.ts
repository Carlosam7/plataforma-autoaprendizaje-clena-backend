import type { PersonalRepository } from '@/application/personal/ports';
import {
  AccesoDenegadoPersonalError,
  CodigoPersonalExpiradoError,
  CodigoPersonalInvalidoError,
  CorreoEnUsoError,
  CredencialesIncorrectasError,
  PersonalError,
  ServicioNoDisponiblePersonalError,
  SesionPersonalExpiradaError,
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
import {
  API_BASE,
  debeRenovarse,
  esFalloDeRed,
  leerErrorApi,
  renovarAccessToken,
} from '@/infrastructure/http/api';

// El access token se guarda en localStorage, como la sesión pública (ver C-08: riesgo
// documentado en computadores compartidos). El refresh token nunca: va en cookie httpOnly.
const STORAGE_KEY_PERSONAL_SESION = 'kama_personal_session';
/** FE-03: sin respuesta en 10 s se avisa en vez de dejar la pantalla esperando. */
const TIMEOUT_MS = 10_000;

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

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/**
 * Adaptador de las rutas de personal (C-09). Nunca simula una respuesta: si el servidor no
 * responde lanza ServicioNoDisponiblePersonalError, y cada error del backend llega tal cual a la
 * pantalla con su `mensaje`.
 */
export class HttpPersonalRepository implements PersonalRepository {
  constructor(private readonly baseUrl = API_BASE) {}

  async solicitarInicioSesion(
    comando: SolicitarInicioSesionPersonalComando,
  ): Promise<InicioSesionPersonalSolicitado> {
    const res = await this.enviar('/auth/personal/login', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(comando),
    });
    if (!res.ok) await this.lanzarError(res);

    const data = await this.leerJson<{
      solicitudId: string;
      destino: string;
      expiraEn: string;
      puedeReenviarEn: string;
      mensaje: string;
    }>(res);
    const puedeReenviarEn = new Date(data.puedeReenviarEn);
    return {
      solicitudId: data.solicitudId,
      destino: data.destino,
      expiraEn: new Date(data.expiraEn),
      puedeReenviarEn,
      reenviarEnSegundos: Math.max(
        0,
        Math.ceil((puedeReenviarEn.getTime() - Date.now()) / 1000),
      ),
      mensaje: data.mensaje,
    };
  }

  async verificarInicioSesion(
    comando: VerificarInicioSesionPersonalComando,
  ): Promise<SesionPersonal> {
    const res = await this.enviar('/auth/personal/login/verificar', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        solicitudId: comando.solicitudId,
        codigo: comando.codigo,
      }),
    });
    if (!res.ok) await this.lanzarError(res);

    const data = await this.leerJson<{
      usuario: {
        id?: string;
        nombre: string;
        rol: 'PERSONAL' | 'ADMINISTRADOR';
        debeCambiarPassword: boolean;
      };
      accessToken: string;
      accessTokenExpiraEn?: string;
    }>(res);
    const sesion: SesionPersonal = {
      usuario: {
        // El backend no devuelve el id en la sesión; la solicitud es el id de la cuenta.
        id: data.usuario.id ?? comando.solicitudId,
        nombre: data.usuario.nombre,
        rol: data.usuario.rol,
        debeCambiarPassword: data.usuario.debeCambiarPassword,
      },
      accessToken: data.accessToken,
      accessTokenExpiraEn: data.accessTokenExpiraEn,
    };
    await this.guardarSesionPersonal(sesion);
    return sesion;
  }

  async solicitarCodigoPasswordInicial(
    token: string,
  ): Promise<CodigoPasswordEnviado> {
    const res = await this.autenticada(token, '/personal/yo/password/codigo', {
      method: 'POST',
    });
    if (!res.ok) await this.lanzarError(res);
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
    const res = await this.autenticada(token, '/personal/yo/password', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        codigo: comando.codigo,
        passwordNueva: comando.passwordNueva,
      }),
    });
    if (!res.ok) await this.lanzarError(res);
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

    const res = await this.autenticada(token, `/personal${qs}`);
    if (!res.ok) await this.lanzarError(res);
    const data = await this.leerJson<PersonalPaginadoBackend>(res);
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
    const res = await this.autenticada(token, '/personal', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(comando),
    });
    if (!res.ok) await this.lanzarError(res);
    return mapearPersonal(await this.leerJson<PersonalBackend>(res));
  }

  async obtenerPersonal(token: string, id: string): Promise<Personal> {
    const res = await this.autenticada(
      token,
      `/personal/${encodeURIComponent(id)}`,
    );
    if (!res.ok) await this.lanzarError(res);
    return mapearPersonal(await this.leerJson<PersonalBackend>(res));
  }

  async editarPersonal(
    token: string,
    id: string,
    comando: EditarPersonalComando,
  ): Promise<Personal> {
    const res = await this.autenticada(
      token,
      `/personal/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify(comando),
      },
    );
    if (!res.ok) await this.lanzarError(res);
    return mapearPersonal(await this.leerJson<PersonalBackend>(res));
  }

  async desactivarPersonal(token: string, id: string): Promise<Personal> {
    const res = await this.autenticada(
      token,
      `/personal/${encodeURIComponent(id)}/desactivar`,
      { method: 'POST' },
    );
    if (!res.ok) await this.lanzarError(res);
    return mapearPersonal(await this.leerJson<PersonalBackend>(res));
  }

  async reactivarPersonal(token: string, id: string): Promise<Personal> {
    const res = await this.autenticada(
      token,
      `/personal/${encodeURIComponent(id)}/reactivar`,
      { method: 'POST' },
    );
    if (!res.ok) await this.lanzarError(res);
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
      // Almacenamiento bloqueado (modo privado): la sesión dura hasta recargar.
    }
  }

  async cerrarSesionPersonal(): Promise<void> {
    try {
      // Revoca la sesión y borra la cookie httpOnly del refresh token (C-08).
      await this.enviar('/auth/logout', { method: 'POST' });
    } catch {
      // Sin conexión: igual se olvida la sesión en este navegador.
    } finally {
      this.olvidarSesion();
    }
  }

  /**
   * `fetch` con cookies y un tiempo máximo de 10 s (FE-03). Sin respuesta del servidor lanza
   * ServicioNoDisponiblePersonalError: nunca se simula una respuesta.
   */
  private async enviar(
    ruta: string,
    init: RequestInit = {},
  ): Promise<Response> {
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

  /**
   * Petición con el access token. Si está por vencer, primero lo renueva con la cookie
   * (`POST /auth/refresh`). Ante un 401 renueva una sola vez y solo **reintenta las
   * lecturas (GET)**: repetir un POST/PATCH podría aplicarlo dos veces (C-00).
   */
  private async autenticada(
    token: string,
    ruta: string,
    init: RequestInit = {},
  ): Promise<Response> {
    const conToken = (t: string): RequestInit => ({
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${t}` },
    });

    // Las pantallas pasan el token que leyeron al abrirse; el guardado puede ser más
    // nuevo (otra pestaña o una renovación), así que manda el guardado.
    const sesion = await this.obtenerSesionPersonal();
    const actual = sesion?.accessToken ?? token;
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
  private async renovar(): Promise<string> {
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
    const sesion = await this.obtenerSesionPersonal();
    if (sesion) {
      await this.guardarSesionPersonal({
        ...sesion,
        accessToken: renovado.accessToken,
        accessTokenExpiraEn: renovado.accessTokenExpiraEn,
      });
    }
    return renovado.accessToken;
  }

  private olvidarSesion(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_PERSONAL_SESION);
    } catch {
      // Ignorar: almacenamiento bloqueado.
    }
  }

  /** Traduce el error uniforme del backend (C-00) a los errores del dominio. */
  private async lanzarError(res: Response): Promise<never> {
    const e = await leerErrorApi(res, 'Ocurrió un error en el servidor.');
    switch (res.status) {
      case 401:
        // Las rutas con token ya trataron su 401: aquí solo llegan los de login.
        throw new CredencialesIncorrectasError(e.mensaje);
      case 403:
        throw new AccesoDenegadoPersonalError(e.mensaje);
      case 409:
        if (e.codigo === 'CORREO_EN_USO') throw new CorreoEnUsoError(e.mensaje);
        break;
      case 410:
        throw new CodigoPersonalExpiradoError(e.mensaje);
      case 502:
      case 503:
      case 504:
        throw new ServicioNoDisponiblePersonalError(e.mensaje, res.status);
      case 400:
        if (e.codigo === 'CODIGO_INCORRECTO')
          throw new CodigoPersonalInvalidoError(e.mensaje);
        break;
    }
    throw new PersonalError(e.mensaje, res.status, e.codigo);
  }
}
