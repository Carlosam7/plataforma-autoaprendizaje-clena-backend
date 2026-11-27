import type {
  CalificacionPractica,
  ResultadoPractica,
} from '../../domain/guias/types';

export interface CalculoParametros {
  guiaSlug: string;
  totalPreguntas: number;
  respuestasCorrectas?: number;
  aciertos?: number;
  porcentajeAprobacion?: number;
  umbralAprobacion?: number; // por defecto 70 según AC-HU21-04
}

export class CalcularResultadoPractica {
  ejecutar(params: CalculoParametros): ResultadoPractica {
    const {
      guiaSlug,
      totalPreguntas,
      respuestasCorrectas = params.aciertos ?? 0,
      porcentajeAprobacion = params.umbralAprobacion ?? 70,
    } = params;

    const porcentaje =
      totalPreguntas > 0
        ? Math.round((respuestasCorrectas * 100) / totalPreguntas)
        : 0;
    // Sin redondear a favor: 69,5 % no aprueba con umbral del 70 % (RN-16).
    const aprobado =
      totalPreguntas > 0 &&
      respuestasCorrectas * 100 >= porcentajeAprobacion * totalPreguntas;

    return {
      guiaSlug,
      totalPreguntas,
      respuestasCorrectas,
      aciertos: respuestasCorrectas,
      porcentaje,
      aprobado,
      aprobada: aprobado,
      porcentajeAprobacion,
      umbralAprobacion: porcentajeAprobacion,
    };
  }

  desdeCalificacion(
    guiaSlug: string,
    calificacion: CalificacionPractica,
  ): ResultadoPractica {
    return {
      ...calificacion,
      guiaSlug,
      aciertos: calificacion.respuestasCorrectas,
      aprobada: calificacion.aprobado,
      umbralAprobacion: calificacion.porcentajeAprobacion,
    };
  }
}
