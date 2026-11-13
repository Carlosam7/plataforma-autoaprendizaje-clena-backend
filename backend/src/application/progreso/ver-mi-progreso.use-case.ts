import {
  CriterioProgreso,
  ProgresoRepository,
} from '../../domain/progreso/progreso.repository.js';
import { ResultadoPaginado } from '../shared/resultado-paginado.js';
import { ProgresoGuiaResumen, resumenProgreso } from './progreso.resultado.js';

/**
 * HU-23: «Mi progreso». Todas las guías publicadas con lo que el usuario lleva en cada una;
 * las que no ha empezado salen en 0 %, para ofrecerle «Empezar».
 */
export class VerMiProgresoUseCase {
  constructor(private readonly progresos: ProgresoRepository) {}

  async ejecutar(
    usuarioId: string,
    criterio: CriterioProgreso,
  ): Promise<ResultadoPaginado<ProgresoGuiaResumen>> {
    const { elementos, total } = await this.progresos.listar(
      usuarioId,
      criterio,
    );
    return {
      datos: elementos.map(resumenProgreso),
      total,
      pagina: criterio.pagina,
      limite: criterio.limite,
    };
  }
}
