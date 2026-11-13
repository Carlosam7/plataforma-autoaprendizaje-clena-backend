import type { ResultadoPractica } from '../../domain/guias/types';

export interface CalculoParametros {
  guiaSlug: string;
  totalPreguntas: number;
  aciertos: number;
  umbralAprobacion?: number; // por defecto 70 según AC-HU21-04
}

export class CalcularResultadoPractica {
  ejecutar(params: CalculoParametros): ResultadoPractica {
    const {
      guiaSlug,
      totalPreguntas,
      aciertos,
      umbralAprobacion = 70,
    } = params;

    const porcentaje =
      totalPreguntas > 0 ? Math.round((aciertos / totalPreguntas) * 100) : 0;
    const aprobada = porcentaje >= umbralAprobacion;

    return {
      guiaSlug,
      totalPreguntas,
      aciertos,
      porcentaje,
      aprobada,
      umbralAprobacion,
    };
  }
}
