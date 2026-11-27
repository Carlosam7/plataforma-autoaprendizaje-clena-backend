import { RespuestaInesperadaError } from '@/domain/practica/errors';
import {
  type Actividad,
  MAX_OPCIONES,
  MAX_PREGUNTAS,
  MIN_OPCIONES,
  MIN_PREGUNTAS,
} from '@/domain/practica/types';
import type { PracticaRepository } from './ports';
import { esUuid, validarSlug } from './validaciones';

/** HU-21 · Obtiene la actividad real y verifica las invariantes de C-03. */
export class ObtenerActividad {
  constructor(private readonly repository: PracticaRepository) {}

  async ejecutar(slug: string): Promise<Actividad> {
    const actividad = await this.repository.obtenerActividad(validarSlug(slug));
    verificarActividad(actividad);
    return actividad;
  }
}

export function verificarActividad(actividad: Actividad): void {
  const { preguntas } = actividad;
  if (
    preguntas.length < MIN_PREGUNTAS ||
    preguntas.length > MAX_PREGUNTAS ||
    actividad.totalPreguntas !== preguntas.length
  ) {
    throw new RespuestaInesperadaError();
  }
  if (
    actividad.porcentajeAprobacion < 0 ||
    actividad.porcentajeAprobacion > 100
  ) {
    throw new RespuestaInesperadaError();
  }

  const idsPreguntas = new Set<string>();
  for (const pregunta of preguntas) {
    if (!esUuid(pregunta.id) || idsPreguntas.has(pregunta.id)) {
      throw new RespuestaInesperadaError();
    }
    idsPreguntas.add(pregunta.id);

    const { opciones } = pregunta;
    if (opciones.length < MIN_OPCIONES || opciones.length > MAX_OPCIONES) {
      throw new RespuestaInesperadaError();
    }
    const idsOpciones = new Set(opciones.map((o) => o.id));
    if (
      idsOpciones.size !== opciones.length ||
      opciones.some((o) => !esUuid(o.id))
    ) {
      throw new RespuestaInesperadaError();
    }
  }
}
