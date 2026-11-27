import type { Feedback, RespuestaComando } from '@/domain/practica/types';
import type { PracticaRepository } from './ports';
import { validarRespuestaComando, validarSlug } from './validaciones';

export interface EvaluarInvitadoParams extends RespuestaComando {
  slug: string;
}

/**
 * HU-03 · Evalúa una respuesta de visitante sin persistencia (C-04 PROPUESTO).
 * El progreso del invitado lo conserva la UI solo en memoria.
 */
export class EvaluarRespuestaInvitado {
  constructor(private readonly repository: PracticaRepository) {}

  async ejecutar({
    slug,
    preguntaId,
    opcionId,
  }: EvaluarInvitadoParams): Promise<Feedback> {
    const slugValido = validarSlug(slug);
    const respuesta = { preguntaId, opcionId };
    validarRespuestaComando(respuesta);
    return this.repository.evaluarInvitado(slugValido, respuesta);
  }
}
