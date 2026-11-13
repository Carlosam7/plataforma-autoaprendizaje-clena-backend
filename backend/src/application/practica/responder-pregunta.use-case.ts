import { Rol } from '../../domain/auth/tipos.js';
import { IntentoNoEncontradoError } from '../../domain/practica/errores.js';
import {
  Calificacion,
  RespuestaCalificada,
} from '../../domain/practica/intento.js';
import { IntentoRepository } from '../../domain/practica/intento.repository.js';
import { Reloj } from '../shared/reloj.port.js';

export interface ResponderPreguntaComando {
  intentoId: string;
  preguntaId: string;
  opcionId: string;
}

export interface RespuestaResultado extends RespuestaCalificada {
  respondidas: number;
  totalPreguntas: number;
  /** Solo con la última pregunta: cuántas acertó y si aprobó. */
  resultado: Calificacion | null;
}

/** HU-21: responde una pregunta y dice al instante si acertó y por qué. */
export class ResponderPreguntaUseCase {
  constructor(
    private readonly intentos: IntentoRepository,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    { intentoId, preguntaId, opcionId }: ResponderPreguntaComando,
    usuario: { id: string; rol: Rol } | null,
  ): Promise<RespuestaResultado> {
    const resultado = await this.intentos.modificar(intentoId, (intento) => {
      if (!intento.perteneceA(usuario?.id ?? null)) {
        throw new IntentoNoEncontradoError();
      }
      const respuesta = intento.responder(
        preguntaId,
        opcionId,
        this.reloj.ahora(),
      );
      return {
        ...respuesta,
        respondidas: intento.respuestas.length,
        totalPreguntas: intento.totalPreguntas,
        resultado: intento.finalizadoEn ? intento.calificar() : null,
      };
    });
    if (!resultado) throw new IntentoNoEncontradoError();
    return resultado;
  }
}
