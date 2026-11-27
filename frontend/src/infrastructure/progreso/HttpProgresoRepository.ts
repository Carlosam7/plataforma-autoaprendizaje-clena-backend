import type { ProgresoRepository } from '@/application/progreso/ports';
import {
  ProgresoError,
  type TipoErrorProgreso,
} from '@/domain/progreso/errors';
import {
  ESTADOS_AVANCE,
  type ListarProgresoCriterio,
  type ProgresoGuia,
  type ProgresoPaginado,
} from '@/domain/progreso/types';
import { API_BASE, leerErrorApi } from '../http/api';

const TIMEOUT_MS = 10_000;
const NIVELES = ['BASICO', 'INTERMEDIO', 'AVANZADO'];

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;
const esEntero = (v: unknown): v is number => Number.isInteger(v);

function mapearProgreso(v: unknown): ProgresoGuia | null {
  if (!esObjeto(v)) return null;
  let completadaEn: Date | null = null;
  if (v.completadaEn !== null) {
    if (typeof v.completadaEn !== 'string') return null;
    completadaEn = new Date(v.completadaEn);
    if (Number.isNaN(completadaEn.getTime())) return null;
  }
  if (
    typeof v.slug !== 'string' ||
    typeof v.categoria !== 'string' ||
    typeof v.titulo !== 'string' ||
    !NIVELES.includes(v.nivel as string) ||
    !esEntero(v.totalPasos) ||
    !esEntero(v.pasosLeidos) ||
    !esEntero(v.porcentaje) ||
    v.porcentaje < 0 ||
    v.porcentaje > 100 ||
    !(ESTADOS_AVANCE as readonly unknown[]).includes(v.estado) ||
    typeof v.completada !== 'boolean' ||
    typeof v.tieneActividad !== 'boolean' ||
    typeof v.actividadAprobada !== 'boolean' ||
    !(v.ultimoPaso === null || esEntero(v.ultimoPaso))
  ) {
    return null;
  }
  return {
    slug: v.slug,
    categoria: v.categoria,
    titulo: v.titulo,
    nivel: v.nivel as ProgresoGuia['nivel'],
    totalPasos: v.totalPasos,
    pasosLeidos: v.pasosLeidos,
    porcentaje: v.porcentaje,
    estado: v.estado as ProgresoGuia['estado'],
    completada: v.completada,
    tieneActividad: v.tieneActividad,
    actividadAprobada: v.actividadAprobada,
    ultimoPaso: v.ultimoPaso as number | null,
    completadaEn,
  };
}

export class HttpProgresoRepository implements ProgresoRepository {
  constructor(private readonly baseUrl = API_BASE) {}

  async listar(
    token: string,
    criterio: ListarProgresoCriterio,
  ): Promise<ProgresoPaginado> {
    const params = new URLSearchParams();
    if (criterio.categoria) params.set('categoria', criterio.categoria);
    params.set('ordenarPor', 'titulo');
    params.set('direccion', 'asc');
    params.set('pagina', String(criterio.pagina ?? 1));
    params.set('limite', String(criterio.limite ?? 20));

    const res = await this.enviar(`/progreso?${params.toString()}`, {
      headers: this.cabeceras(token),
    });
    const json = await this.leerJson(res);
    if (
      !esObjeto(json) ||
      !Array.isArray(json.datos) ||
      !esEntero(json.total) ||
      !esEntero(json.pagina) ||
      !esEntero(json.limite)
    ) {
      throw this.respuestaInvalida(res.status);
    }
    const datos = json.datos.map(mapearProgreso);
    if (datos.some((d) => d === null)) throw this.respuestaInvalida(res.status);
    return {
      datos: datos as ProgresoGuia[],
      total: json.total,
      pagina: json.pagina,
      limite: json.limite,
    };
  }

  async registrarLectura(
    token: string,
    slug: string,
    orden: number,
  ): Promise<ProgresoGuia> {
    const res = await this.enviar(
      `/guias/${encodeURIComponent(slug)}/pasos/${orden}/lectura`,
      { method: 'POST', headers: this.cabeceras(token) },
    );
    const progreso = mapearProgreso(await this.leerJson(res));
    if (!progreso) throw this.respuestaInvalida(res.status);
    return progreso;
  }

  private cabeceras(token: string): HeadersInit {
    return { Authorization: `Bearer ${token}`, Accept: 'application/json' };
  }

  private async enviar(ruta: string, init: RequestInit): Promise<Response> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${ruta}`, {
        ...init,
        credentials: 'include',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'TimeoutError') {
        throw new ProgresoError(
          'El servidor tardó demasiado en responder.',
          'TIMEOUT',
        );
      }
      throw new ProgresoError(
        'No pudimos conectarnos con el servidor.',
        'CONEXION',
      );
    }
    if (!res.ok) throw await this.errorHttp(res);
    return res;
  }

  private async errorHttp(res: Response): Promise<ProgresoError> {
    const e = await leerErrorApi(res, 'No pudimos atender la solicitud.');
    let tipo: TipoErrorProgreso;
    if (res.status === 401) tipo = 'SESION';
    else if (res.status === 403) tipo = 'PERMISO';
    else if (res.status === 404)
      tipo =
        e.codigo === 'PASO_NO_ENCONTRADO'
          ? 'PASO_NO_ENCONTRADO'
          : 'NO_ENCONTRADA';
    else if (res.status === 400) tipo = 'VALIDACION';
    else tipo = 'SERVIDOR';
    return new ProgresoError(
      res.status >= 500
        ? 'El servidor no pudo atender la solicitud.'
        : e.mensaje,
      tipo,
      e.codigo,
      res.status,
    );
  }

  private async leerJson(res: Response): Promise<unknown> {
    try {
      return await res.json();
    } catch {
      throw this.respuestaInvalida(res.status);
    }
  }

  private respuestaInvalida(status: number) {
    return new ProgresoError(
      'El servidor envió una respuesta inesperada.',
      'RESPUESTA_INVALIDA',
      undefined,
      status,
    );
  }
}
