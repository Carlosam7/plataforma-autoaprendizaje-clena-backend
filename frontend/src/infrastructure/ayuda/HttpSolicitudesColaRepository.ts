import type { SolicitudesColaRepository } from '@/application/ayuda/colaPorts';
import {
  ColaSolicitudError,
  type TipoErrorCola,
} from '@/domain/ayuda/erroresCola';
import {
  ESTADOS_SOLICITUD,
  TEMAS_AYUDA,
  type ListarSolicitudesCriterio,
  type SolicitudEnCola,
  type SolicitudesPaginadas,
} from '@/domain/ayuda/solicitudCola';

const TIMEOUT_MS = 10_000;

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

const textoONulo = (v: unknown): v is string | null =>
  v === null || typeof v === 'string';

function fechaONula(v: unknown): Date | null | undefined {
  if (v === null) return null;
  if (typeof v !== 'string') return undefined;
  const fecha = new Date(v);
  return Number.isNaN(fecha.getTime()) ? undefined : fecha;
}

/** Valida y mapea una solicitud del contrato C-06; null si no es compatible. */
function mapearSolicitud(v: unknown): SolicitudEnCola | null {
  if (!esObjeto(v)) return null;
  const creadaEn = fechaONula(v.creadaEn);
  const tomadaEn = fechaONula(v.tomadaEn);
  const resueltaEn = fechaONula(v.resueltaEn);
  const guia = v.guia;
  if (
    typeof v.id !== 'string' ||
    typeof v.equipo !== 'string' ||
    !(TEMAS_AYUDA as readonly unknown[]).includes(v.tema) ||
    !(ESTADOS_SOLICITUD as readonly unknown[]).includes(v.estado) ||
    !creadaEn ||
    tomadaEn === undefined ||
    resueltaEn === undefined ||
    !textoONulo(v.atendidaPor) ||
    !textoONulo(v.comentarioResolucion) ||
    !(v.paso === null || typeof v.paso === 'number') ||
    !(
      guia === null ||
      (esObjeto(guia) &&
        typeof guia.slug === 'string' &&
        typeof guia.titulo === 'string')
    )
  ) {
    return null;
  }
  return {
    id: v.id,
    equipo: v.equipo,
    tema: v.tema as SolicitudEnCola['tema'],
    estado: v.estado as SolicitudEnCola['estado'],
    guia:
      guia === null
        ? null
        : { slug: guia.slug as string, titulo: guia.titulo as string },
    paso: v.paso,
    creadaEn,
    atendidaPor: v.atendidaPor,
    tomadaEn,
    resueltaEn,
    comentarioResolucion: v.comentarioResolucion,
  };
}

export class HttpSolicitudesColaRepository implements SolicitudesColaRepository {
  constructor(private readonly baseUrl = '/api/v1') {}

  async listar(
    token: string,
    criterio: ListarSolicitudesCriterio,
  ): Promise<SolicitudesPaginadas> {
    const params = new URLSearchParams();
    if (criterio.estado) params.set('estado', criterio.estado);
    if (criterio.tema) params.set('tema', criterio.tema);
    params.set('pagina', String(criterio.pagina ?? 1));
    params.set('limite', String(criterio.limite ?? 20));
    params.set('ordenarPor', 'creadaEn');
    params.set('direccion', 'asc');

    const res = await this.enviar(
      `/solicitudes-ayuda?${params.toString()}`,
      { headers: this.cabeceras(token) },
      false,
    );
    const json = await this.leerJson(res, false);
    if (
      !esObjeto(json) ||
      !Array.isArray(json.datos) ||
      typeof json.total !== 'number' ||
      typeof json.pagina !== 'number' ||
      typeof json.limite !== 'number'
    ) {
      throw this.respuestaInvalida(res.status, false);
    }
    const datos = json.datos.map(mapearSolicitud);
    if (datos.some((d) => d === null)) {
      throw this.respuestaInvalida(res.status, false);
    }
    return {
      datos: datos as SolicitudEnCola[],
      total: json.total,
      pagina: json.pagina,
      limite: json.limite,
    };
  }

  async tomar(token: string, id: string): Promise<SolicitudEnCola> {
    const res = await this.enviar(
      `/solicitudes-ayuda/${encodeURIComponent(id)}/tomar`,
      { method: 'POST', headers: this.cabeceras(token) },
      true,
    );
    return this.leerSolicitud(res);
  }

  async resolver(
    token: string,
    id: string,
    comentario: string | null,
  ): Promise<SolicitudEnCola> {
    const res = await this.enviar(
      `/solicitudes-ayuda/${encodeURIComponent(id)}/resolver`,
      {
        method: 'POST',
        headers: this.cabeceras(token, true),
        body: JSON.stringify({ comentario }),
      },
      true,
    );
    return this.leerSolicitud(res);
  }

  private cabeceras(token: string, conCuerpo = false): HeadersInit {
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(conCuerpo ? { 'Content-Type': 'application/json' } : {}),
    };
  }

  /** `escritura`: si el POST falla sin respuesta, su efecto es incierto. */
  private async enviar(
    ruta: string,
    init: RequestInit,
    escritura: boolean,
  ): Promise<Response> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${ruta}`, {
        ...init,
        credentials: 'include',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'TimeoutError') {
        throw new ColaSolicitudError(
          'El servidor tardó demasiado en responder.',
          'TIMEOUT',
          undefined,
          undefined,
          escritura,
        );
      }
      throw new ColaSolicitudError(
        'No pudimos conectarnos con el servidor.',
        'CONEXION',
        undefined,
        undefined,
        escritura,
      );
    }
    if (!res.ok) throw await this.errorHttp(res);
    return res;
  }

  private async errorHttp(res: Response): Promise<ColaSolicitudError> {
    let mensaje: string | undefined;
    let codigo: string | undefined;
    try {
      const cuerpo: unknown = await res.json();
      if (esObjeto(cuerpo)) {
        if (typeof cuerpo.codigo === 'string') codigo = cuerpo.codigo;
        const m = cuerpo.mensaje;
        if (typeof m === 'string') mensaje = m;
        else if (Array.isArray(m)) mensaje = m.join('. ');
      }
    } catch {
      // cuerpo no JSON: se usa un mensaje genérico
    }
    const tipos: Record<number, [TipoErrorCola, string]> = {
      400: ['VALIDACION', 'Los datos enviados no son válidos.'],
      401: ['SESION', 'Tu sesión terminó. Vuelve a ingresar.'],
      403: ['PERMISO', 'No tienes permiso para esta acción.'],
      404: ['NO_ENCONTRADA', 'La solicitud ya no existe.'],
      409: ['CONFLICTO', 'La solicitud cambió hace un momento.'],
    };
    const [tipo, generico] =
      tipos[res.status] ??
      (res.status >= 500
        ? (['SERVIDOR', 'El servidor no pudo atender la solicitud.'] as const)
        : (['SERVIDOR', 'Ocurrió un error inesperado.'] as const));
    return new ColaSolicitudError(
      res.status >= 500 ? generico : (mensaje ?? generico),
      tipo,
      codigo,
      res.status,
    );
  }

  private async leerJson(res: Response, escritura: boolean): Promise<unknown> {
    try {
      return await res.json();
    } catch {
      throw this.respuestaInvalida(res.status, escritura);
    }
  }

  private async leerSolicitud(res: Response): Promise<SolicitudEnCola> {
    const solicitud = mapearSolicitud(await this.leerJson(res, true));
    if (!solicitud) throw this.respuestaInvalida(res.status, true);
    return solicitud;
  }

  private respuestaInvalida(status: number, escritura: boolean) {
    return new ColaSolicitudError(
      'El servidor envió una respuesta inesperada.',
      'RESPUESTA_INVALIDA',
      undefined,
      status,
      escritura,
    );
  }
}
