export class PracticaError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly codigo?: string,
  ) {
    super(message);
    this.name = 'PracticaError';
  }
}

/** 404 ACTIVIDAD_NO_ENCONTRADA: guía inexistente, no publicada o sin actividad. */
export class ActividadNoEncontradaError extends PracticaError {
  constructor(message = 'Esta guía no tiene actividad de práctica.') {
    super(message, 404, 'ACTIVIDAD_NO_ENCONTRADA');
    this.name = 'ActividadNoEncontradaError';
  }
}

/** 404 PREGUNTA_NO_ENCONTRADA (C-04): la pregunta no pertenece a la actividad de la guía. */
export class PreguntaNoEncontradaError extends PracticaError {
  constructor(message = 'Esta pregunta no es de la práctica de esta guía.') {
    super(message, 404, 'PREGUNTA_NO_ENCONTRADA');
    this.name = 'PreguntaNoEncontradaError';
  }
}

/**
 * 404 INTENTO_NO_ENCONTRADO. El backend también lo devuelve cuando el token
 * falta o expiró en un intento de cuenta (sesión opcional).
 */
export class IntentoNoEncontradoError extends PracticaError {
  constructor(
    message = 'No encontramos esta práctica. Vuelve a empezarla desde la guía.',
  ) {
    super(message, 404, 'INTENTO_NO_ENCONTRADO');
    this.name = 'IntentoNoEncontradoError';
  }
}

export class PreguntaYaRespondidaError extends PracticaError {
  constructor(message = 'Ya respondiste esta pregunta.') {
    super(message, 409, 'PREGUNTA_YA_RESPONDIDA');
    this.name = 'PreguntaYaRespondidaError';
  }
}

export class IntentoFinalizadoError extends PracticaError {
  constructor(
    message = 'Ya terminaste esta práctica. Si quieres, vuelve a hacerla.',
  ) {
    super(message, 409, 'INTENTO_FINALIZADO');
    this.name = 'IntentoFinalizadoError';
  }
}

/** 400: la pregunta/opción no corresponde o los identificadores no son válidos. */
export class RespuestaInvalidaError extends PracticaError {
  constructor(
    message = 'Esa respuesta no corresponde a esta pregunta.',
    codigo = 'RESPUESTA_INVALIDA',
  ) {
    super(message, 400, codigo);
    this.name = 'RespuestaInvalidaError';
  }
}

/** Se necesita una sesión de usuario público vigente (o el backend respondió 401). */
export class SesionRequeridaError extends PracticaError {
  constructor(
    message = 'Para guardar tu práctica necesitas iniciar sesión de nuevo.',
  ) {
    super(message, 401, 'NO_AUTENTICADO');
    this.name = 'SesionRequeridaError';
  }
}

export class AccesoDenegadoPracticaError extends PracticaError {
  constructor(message = 'No tienes permiso para realizar esta acción.') {
    super(message, 403, 'SIN_PERMISO');
    this.name = 'AccesoDenegadoPracticaError';
  }
}

/** 5xx o servicio temporalmente no disponible. */
export class PracticaNoDisponibleError extends PracticaError {
  constructor(
    message = 'La práctica no está disponible en este momento. Intenta de nuevo en unos minutos.',
    statusCode?: number,
  ) {
    super(message, statusCode, 'ERROR_INTERNO');
    this.name = 'PracticaNoDisponibleError';
  }
}

/**
 * Fallo de red o tiempo de espera agotado. `ambigua = true` indica que la
 * petición pudo haberse registrado en el servidor (POST sin respuesta):
 * no debe reenviarse automáticamente.
 */
export class ConexionPracticaError extends PracticaError {
  constructor(
    public readonly ambigua: boolean,
    message = ambigua
      ? 'Se perdió la conexión y no sabemos si tu respuesta se guardó. Puedes reiniciar la práctica o volver a la guía.'
      : 'No pudimos conectarnos. Revisa la conexión e intenta de nuevo.',
  ) {
    super(message, undefined, 'SIN_CONEXION');
    this.name = 'ConexionPracticaError';
  }
}

/** El servidor respondió con datos que no cumplen el contrato (JSON inválido o forma inesperada). */
export class RespuestaInesperadaError extends PracticaError {
  constructor(
    message = 'Recibimos una respuesta inesperada del servidor. Intenta de nuevo más tarde.',
  ) {
    super(message, undefined, 'RESPUESTA_INESPERADA');
    this.name = 'RespuestaInesperadaError';
  }
}

/** C-04 aún no está entregado por BE-01: la evaluación de invitados no está activa. */
export class EvaluacionInvitadoNoDisponibleError extends PracticaError {
  constructor(
    message = 'La práctica sin cuenta todavía no está disponible. Puedes iniciar sesión para practicar.',
  ) {
    super(message, undefined, 'EVALUACION_INVITADO_NO_DISPONIBLE');
    this.name = 'EvaluacionInvitadoNoDisponibleError';
  }
}
