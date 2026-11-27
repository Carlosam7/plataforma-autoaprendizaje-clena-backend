import { RespuestaInvalidaError } from '@/domain/practica/errors';
import type { RespuestaComando } from '@/domain/practica/types';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function esUuid(valor: unknown): valor is string {
  return typeof valor === 'string' && UUID_REGEX.test(valor);
}

/** Evita peticiones inútiles: el backend exige UUID (IsUUID) en ambos campos. */
export function validarRespuestaComando(respuesta: RespuestaComando): void {
  if (!esUuid(respuesta.preguntaId)) {
    throw new RespuestaInvalidaError(
      'Elige una pregunta válida.',
      'DATOS_INVALIDOS',
    );
  }
  if (!esUuid(respuesta.opcionId)) {
    throw new RespuestaInvalidaError(
      'Elige una de las opciones.',
      'DATOS_INVALIDOS',
    );
  }
}

export function validarSlug(slug: string): string {
  const limpio = slug?.trim();
  if (!limpio) {
    throw new RespuestaInvalidaError(
      'No encontramos la guía de esta práctica.',
      'DATOS_INVALIDOS',
    );
  }
  return limpio;
}
