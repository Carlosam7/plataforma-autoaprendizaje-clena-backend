import type { AyudaRepository } from '@/application/ayuda/ports';
import {
  AyudaError,
  AyudaNoDisponibleError,
  ConexionAyudaError,
  DatosAyudaInvalidosError,
  EquipoConSolicitudActivaError,
  RespuestaInesperadaAyudaError,
  SolicitudCambioEstadoError,
  SolicitudNoEncontradaError,
} from '@/domain/ayuda/errors';
import {
  ESTADOS_SOLICITUD,
  TEMAS_AYUDA,
  type EstadoSolicitud,
  type SolicitarAyudaComando,
  type SolicitudAyuda,
  type SolicitudCreada,
  type TemaAyuda,
} from '@/domain/ayuda/types';

export interface HttpAyudaOpciones {
  baseUrl?: string;
  /** Tiempo máximo de espera por petición (ms). */
  timeoutMs?: number;
}

interface ErrorBackend {
  codigo?: string;
  mensaje?: string | string[];
  detalles?: { campo?: string; campos?: Record<string, unknown> };
}

type Json = Record<string, unknown>;

const TIMEOUT_POR_DEFECTO_MS = 15_000;

// ---- Mapeo estricto de C-05: solo se copian campos conocidos ----

function esObjeto(valor: unknown): valor is Json {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function texto(valor: unknown): string {
  if (typeof valor !== 'string') throw new RespuestaInesperadaAyudaError();
  return valor;
}

function unoDe<T extends string>(lista: readonly T[], valor: unknown): T {
  if (
    typeof valor !== 'string' ||
    !(lista as readonly string[]).includes(valor)
  ) {
    throw new RespuestaInesperadaAyudaError();
  }
  return valor as T;
}

function posicion(valor: unknown): number | null {
  if (valor === null) return null;
  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 1) {
    throw new RespuestaInesperadaAyudaError();
  }
  return valor;
}

export function mapearSolicitud(valor: unknown): SolicitudAyuda {
  if (!esObjeto(valor)) throw new RespuestaInesperadaAyudaError();
  return {
    id: texto(valor.id),
    equipo: texto(valor.equipo),
    tema: unoDe<TemaAyuda>(TEMAS_AYUDA, valor.tema),
    estado: unoDe<EstadoSolicitud>(ESTADOS_SOLICITUD, valor.estado),
    posicion: posicion(valor.posicion),
    creadaEn: texto(valor.creadaEn),
  };
}

function mapearSolicitudCreada(valor: unknown): SolicitudCreada {
  const solicitud = mapearSolicitud(valor);
  const yaExistia = (valor as Json).yaExistia;
  if (typeof yaExistia !== 'boolean') throw new RespuestaInesperadaAyudaError();
  return { ...solicitud, yaExistia };
}

// ---- Adaptador ----

type Metodo = 'GET' | 'POST' | 'DELETE';

export class HttpAyudaRepository implements AyudaRepository {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(opciones: HttpAyudaOpciones = {}) {
    this.baseUrl = opciones.baseUrl ?? '/api/v1';
    this.timeoutMs = opciones.timeoutMs ?? TIMEOUT_POR_DEFECTO_MS;
  }

  async solicitar(comando: SolicitarAyudaComando): Promise<SolicitudCreada> {
    const body: Json = { equipo: comando.equipo, tema: comando.tema };
    if (comando.guiaSlug) {
      body.guiaSlug = comando.guiaSlug;
      if (comando.pasoOrden !== undefined) body.pasoOrden = comando.pasoOrden;
    }
    const res = await this.solicitarHttp('/solicitudes-ayuda', 'POST', body);
    return mapearSolicitudCreada(await this.leerJson(res));
  }

  async consultar(id: string): Promise<SolicitudAyuda> {
    const res = await this.solicitarHttp(
      `/solicitudes-ayuda/${encodeURIComponent(id)}`,
      'GET',
    );
    return mapearSolicitud(await this.leerJson(res));
  }

  async cancelar(id: string): Promise<void> {
    // 204 sin cuerpo: nunca se llama a .json() (C-00).
    await this.solicitarHttp(
      `/solicitudes-ayuda/${encodeURIComponent(id)}`,
      'DELETE',
    );
  }

  private async solicitarHttp(
    ruta: string,
    method: Metodo,
    body?: Json,
  ): Promise<Response> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body) headers['Content-Type'] = 'application/json';

    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), this.timeoutMs);

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${ruta}`, {
        method,
        headers,
        // C-05: la cookie httpOnly llave_ayuda demuestra que este navegador pidió la ayuda.
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
        signal: controlador.signal,
      });
    } catch {
      // Un POST o DELETE sin respuesta pudo haber llegado al servidor.
      throw new ConexionAyudaError(method !== 'GET');
    } finally {
      clearTimeout(temporizador);
    }

    if (!res.ok) await this.lanzarErrorHttp(res);
    return res;
  }

  private async leerJson(res: Response): Promise<unknown> {
    try {
      return await res.json();
    } catch {
      throw new RespuestaInesperadaAyudaError();
    }
  }

  private async lanzarErrorHttp(res: Response): Promise<never> {
    let cuerpo: ErrorBackend = {};
    try {
      const json: unknown = await res.json();
      if (esObjeto(json)) cuerpo = json as ErrorBackend;
    } catch {
      // Cuerpo vacío o no JSON: se usa el mensaje por defecto del error tipado.
    }

    const mensaje = Array.isArray(cuerpo.mensaje)
      ? cuerpo.mensaje.join('. ')
      : typeof cuerpo.mensaje === 'string' && cuerpo.mensaje.trim()
        ? cuerpo.mensaje
        : undefined;
    const codigo = typeof cuerpo.codigo === 'string' ? cuerpo.codigo : '';

    switch (codigo) {
      case 'EQUIPO_CON_SOLICITUD_ACTIVA':
        throw new EquipoConSolicitudActivaError(mensaje);
      case 'SOLICITUD_NO_ENCONTRADA':
        throw new SolicitudNoEncontradaError();
      case 'SOLICITUD_CERRADA':
      case 'SOLICITUD_MODIFICADA':
        throw new SolicitudCambioEstadoError(mensaje, codigo);
    }

    const status = res.status;
    if (status === 400) {
      throw new DatosAyudaInvalidosError(
        mensaje ?? 'Revisa los datos del formulario.',
        campoConError(cuerpo),
        codigo || 'DATOS_INVALIDOS',
      );
    }
    // 404 sin código de negocio (p. ej. id que no es UUID): para la persona es lo mismo.
    if (status === 404) throw new SolicitudNoEncontradaError();
    if (status === 409) throw new SolicitudCambioEstadoError(mensaje, codigo);
    if (status >= 500) throw new AyudaNoDisponibleError(undefined, status);

    throw new AyudaError(
      mensaje ?? 'No pudimos completar tu pedido de ayuda.',
      status,
      codigo || undefined,
    );
  }
}

/** El backend indica el campo en `detalles.campo` (dominio) o `detalles.campos` (DTO). */
function campoConError(cuerpo: ErrorBackend): 'equipo' | 'tema' | undefined {
  const candidatos = [
    cuerpo.detalles?.campo,
    ...Object.keys(cuerpo.detalles?.campos ?? {}),
  ];
  return candidatos.find(
    (c): c is 'equipo' | 'tema' => c === 'equipo' || c === 'tema',
  );
}
