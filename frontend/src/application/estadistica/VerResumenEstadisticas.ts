import { EstadisticaError } from '@/domain/estadistica/errors';
import { validarPeriodo } from '@/domain/estadistica/periodo';
import type {
  CriterioResumen,
  ResumenEstadisticas,
} from '@/domain/estadistica/types';
import type { EstadisticaRepository } from './ports';

export class VerResumenEstadisticas {
  constructor(private readonly repository: EstadisticaRepository) {}

  /** Un periodo inválido ni siquiera llega al servidor. */
  ejecutar(
    token: string,
    criterio: CriterioResumen = {},
  ): Promise<ResumenEstadisticas> {
    const limpio: CriterioResumen = {
      ...(criterio.desde ? { desde: criterio.desde } : {}),
      ...(criterio.hasta ? { hasta: criterio.hasta } : {}),
    };
    const problema = validarPeriodo(limpio);
    if (problema) throw new EstadisticaError(problema, 'PERIODO_INVALIDO');
    return this.repository.resumen(token, limpio);
  }
}
