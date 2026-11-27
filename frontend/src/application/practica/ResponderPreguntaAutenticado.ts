import type { AuthRepository } from '@/application/auth/ports';
import type {
  RespuestaComando,
  RespuestaEvaluada,
} from '@/domain/practica/types';
import type { PracticaRepository } from './ports';
import { obtenerTokenUsuarioPublico, type Reloj } from './sesionPractica';
import { esUuid, validarRespuestaComando } from './validaciones';
import { IntentoNoEncontradoError } from '@/domain/practica/errors';

export interface ResponderAutenticadoParams extends RespuestaComando {
  intentoId: string;
}

/**
 * HU-21 · Envía una respuesta del intento de cuenta.
 * No reintenta: un POST sin respuesta pudo haberse registrado.
 */
export class ResponderPreguntaAutenticado {
  constructor(
    private readonly repository: PracticaRepository,
    private readonly auth: AuthRepository,
    private readonly reloj?: Reloj,
  ) {}

  async ejecutar({
    intentoId,
    preguntaId,
    opcionId,
  }: ResponderAutenticadoParams): Promise<RespuestaEvaluada> {
    if (!esUuid(intentoId)) {
      throw new IntentoNoEncontradoError();
    }
    const respuesta = { preguntaId, opcionId };
    validarRespuestaComando(respuesta);
    const token = await obtenerTokenUsuarioPublico(this.auth, this.reloj);
    return this.repository.responderAutenticado(intentoId, respuesta, token);
  }
}
