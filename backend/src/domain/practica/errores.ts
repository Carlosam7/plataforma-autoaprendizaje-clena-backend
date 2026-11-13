import { ErrorDeNegocio } from '../shared/error-de-negocio.js';

/** La guía no existe, no está publicada o no tiene actividad con preguntas. */
export class ActividadNoEncontradaError extends ErrorDeNegocio {
  constructor() {
    super(
      'ACTIVIDAD_NO_ENCONTRADA',
      'no_encontrado',
      'Esta guía no tiene actividad de práctica.',
    );
  }
}

/** No existe, o es de otra cuenta: para quien pregunta es lo mismo. */
export class IntentoNoEncontradoError extends ErrorDeNegocio {
  constructor() {
    super(
      'INTENTO_NO_ENCONTRADO',
      'no_encontrado',
      'No encontramos esta práctica. Vuelve a empezarla desde la guía.',
    );
  }
}

export class IntentoFinalizadoError extends ErrorDeNegocio {
  constructor() {
    super(
      'INTENTO_FINALIZADO',
      'conflicto',
      'Ya terminaste esta práctica. Si quieres, vuelve a hacerla.',
    );
  }
}

export class PreguntaYaRespondidaError extends ErrorDeNegocio {
  constructor() {
    super(
      'PREGUNTA_YA_RESPONDIDA',
      'conflicto',
      'Ya respondiste esta pregunta.',
    );
  }
}

/** La pregunta no es de la actividad, o la opción no es de la pregunta. */
export class RespuestaInvalidaError extends ErrorDeNegocio {
  constructor() {
    super(
      'RESPUESTA_INVALIDA',
      'validacion',
      'Esa respuesta no corresponde a esta pregunta.',
    );
  }
}
