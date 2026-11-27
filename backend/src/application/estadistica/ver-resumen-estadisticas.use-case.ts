import {
  Agregados,
  EstadisticaRepository,
} from '../../domain/estadistica/estadistica.repository.js';
import { Periodo, ZONA_HORARIA } from '../../domain/estadistica/periodo.js';
import { Reloj } from '../shared/reloj.port.js';

/** Máximo de guías en `topGuias`. */
export const LIMITE_TOP_GUIAS = 10;

export interface CriterioResumen {
  /** YYYY-MM-DD; sin él, 6 días antes de `hasta`. */
  desde?: string;
  /** YYYY-MM-DD; sin él, hoy en Bogotá. */
  hasta?: string;
}

export interface ResumenEstadisticas {
  periodo: { desde: string; hasta: string; zonaHoraria: string };
  totales: { consultasGuias: number; solicitudesAyuda: number };
  topGuias: Agregados['topGuias'];
  consultasPorCategoria: Agregados['consultasPorCategoria'];
  solicitudesPorTema: Agregados['solicitudesPorTema'];
  /** false si no hubo consultas ni solicitudes: el frontend muestra «sin datos». */
  hayDatos: boolean;
}

/**
 * HU-31: el personal ve qué guías se consultan más y para qué se pide ayuda en un rango
 * de días. Solo cifras agregadas: nunca datos de quién consultó o pidió ayuda.
 */
export class VerResumenEstadisticasUseCase {
  constructor(
    private readonly estadisticas: EstadisticaRepository,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(criterio: CriterioResumen): Promise<ResumenEstadisticas> {
    const periodo = Periodo.crear({ ...criterio, ahora: this.reloj.ahora() });
    const agregados = await this.estadisticas.agregar(
      periodo.inicio,
      periodo.fin,
      LIMITE_TOP_GUIAS,
    );
    return {
      periodo: {
        desde: periodo.desde,
        hasta: periodo.hasta,
        zonaHoraria: ZONA_HORARIA,
      },
      totales: {
        consultasGuias: agregados.consultasGuias,
        solicitudesAyuda: agregados.solicitudesAyuda,
      },
      topGuias: agregados.topGuias,
      consultasPorCategoria: agregados.consultasPorCategoria,
      solicitudesPorTema: agregados.solicitudesPorTema,
      hayDatos: agregados.consultasGuias + agregados.solicitudesAyuda > 0,
    };
  }
}
