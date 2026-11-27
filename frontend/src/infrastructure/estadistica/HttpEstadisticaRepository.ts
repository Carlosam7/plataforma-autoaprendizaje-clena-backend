import type { EstadisticaRepository } from '@/application/estadistica/ports';
import { TEMAS_AYUDA } from '@/domain/ayuda/types';
import {
  EstadisticaError,
  type TipoErrorEstadistica,
} from '@/domain/estadistica/errors';
import type {
  CriterioResumen,
  ResumenEstadisticas,
} from '@/domain/estadistica/types';
import { API_BASE, leerErrorApi } from '../http/api';

const TIMEOUT_MS = 10_000;

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;
/** Cifras siempre enteros no negativos: nunca null ni NaN. */
const esConteo = (v: unknown): v is number =>
  Number.isInteger(v) && (v as number) >= 0;
const lista = (v: unknown): v is unknown[] => Array.isArray(v);

function mapear(v: unknown): ResumenEstadisticas | null {
  if (!esObjeto(v)) return null;
  const { periodo, totales } = v;
  if (
    !esObjeto(periodo) ||
    typeof periodo.desde !== 'string' ||
    typeof periodo.hasta !== 'string' ||
    typeof periodo.zonaHoraria !== 'string' ||
    !esObjeto(totales) ||
    !esConteo(totales.consultasGuias) ||
    !esConteo(totales.solicitudesAyuda) ||
    typeof v.hayDatos !== 'boolean' ||
    !lista(v.topGuias) ||
    !lista(v.consultasPorCategoria) ||
    !lista(v.solicitudesPorTema)
  )
    return null;

  const topGuias: ResumenEstadisticas['topGuias'] = [];
  for (const g of v.topGuias) {
    if (
      !esObjeto(g) ||
      typeof g.slug !== 'string' ||
      typeof g.titulo !== 'string' ||
      !esConteo(g.consultas)
    )
      return null;
    topGuias.push({ slug: g.slug, titulo: g.titulo, consultas: g.consultas });
  }
  const consultasPorCategoria: ResumenEstadisticas['consultasPorCategoria'] =
    [];
  for (const c of v.consultasPorCategoria) {
    if (
      !esObjeto(c) ||
      typeof c.slug !== 'string' ||
      typeof c.nombre !== 'string' ||
      !esConteo(c.consultas)
    )
      return null;
    consultasPorCategoria.push({
      slug: c.slug,
      nombre: c.nombre,
      consultas: c.consultas,
    });
  }
  const solicitudesPorTema: ResumenEstadisticas['solicitudesPorTema'] = [];
  for (const t of v.solicitudesPorTema) {
    if (
      !esObjeto(t) ||
      !(TEMAS_AYUDA as readonly unknown[]).includes(t.tema) ||
      !esConteo(t.cantidad)
    )
      return null;
    solicitudesPorTema.push({
      tema: t.tema as ResumenEstadisticas['solicitudesPorTema'][number]['tema'],
      cantidad: t.cantidad,
    });
  }
  return {
    periodo: {
      desde: periodo.desde,
      hasta: periodo.hasta,
      zonaHoraria: periodo.zonaHoraria,
    },
    totales: {
      consultasGuias: totales.consultasGuias,
      solicitudesAyuda: totales.solicitudesAyuda,
    },
    topGuias,
    consultasPorCategoria,
    solicitudesPorTema,
    hayDatos: v.hayDatos,
  };
}

export class HttpEstadisticaRepository implements EstadisticaRepository {
  constructor(private readonly baseUrl = API_BASE) {}

  async resumen(
    token: string,
    criterio: CriterioResumen,
  ): Promise<ResumenEstadisticas> {
    const params = new URLSearchParams();
    if (criterio.desde) params.set('desde', criterio.desde);
    if (criterio.hasta) params.set('hasta', criterio.hasta);
    const qs = params.toString();

    let res: Response;
    try {
      res = await fetch(
        `${this.baseUrl}/gestion/estadisticas/resumen${qs ? `?${qs}` : ''}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          credentials: 'include',
          signal: AbortSignal.timeout(TIMEOUT_MS),
        },
      );
    } catch (err) {
      const tiempo = err instanceof DOMException && err.name === 'TimeoutError';
      throw new EstadisticaError(
        tiempo
          ? 'El servidor tardó demasiado en responder.'
          : 'No pudimos conectarnos con el servidor.',
        tiempo ? 'TIMEOUT' : 'CONEXION',
      );
    }

    if (!res.ok) {
      const e = await leerErrorApi(res, 'No pudimos atender la solicitud.');
      const tipos: Record<number, TipoErrorEstadistica> = {
        400: 'PERIODO_INVALIDO',
        401: 'SESION',
        403: 'PERMISO',
      };
      throw new EstadisticaError(
        res.status >= 500
          ? 'El servidor no pudo atender la solicitud.'
          : e.mensaje,
        tipos[res.status] ?? 'SERVIDOR',
        e.codigo,
        res.status,
      );
    }

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      throw this.invalida(res.status);
    }
    const resumen = mapear(json);
    if (!resumen) throw this.invalida(res.status);
    return resumen;
  }

  private invalida(status: number) {
    return new EstadisticaError(
      'El servidor envió una respuesta inesperada.',
      'RESPUESTA_INVALIDA',
      undefined,
      status,
    );
  }
}
