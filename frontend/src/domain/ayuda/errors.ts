export class AyudaError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly codigo?: string,
  ) {
    super(message);
    this.name = 'AyudaError';
  }
}

/** 400: datos del formulario no válidos. `campo` indica cuál, si se sabe. */
export class DatosAyudaInvalidosError extends AyudaError {
  constructor(
    message: string,
    public readonly campo?: 'equipo' | 'tema',
    codigo = 'DATOS_INVALIDOS',
  ) {
    super(message, 400, codigo);
    this.name = 'DatosAyudaInvalidosError';
  }
}

/** 409 EQUIPO_CON_SOLICITUD_ACTIVA: otro navegador ya pidió ayuda para ese equipo. */
export class EquipoConSolicitudActivaError extends AyudaError {
  constructor(
    message = 'Ya hay una solicitud de ayuda para ese equipo y un monitor irá pronto. Si estás en otro equipo, revisa el número.',
  ) {
    super(message, 409, 'EQUIPO_CON_SOLICITUD_ACTIVA');
    this.name = 'EquipoConSolicitudActivaError';
  }
}

/**
 * 404 SOLICITUD_NO_ENCONTRADA: no existe o no la pidió este navegador (C-05 no distingue).
 * Para la persona significa que ya no podemos seguir su solicitud desde aquí.
 */
export class SolicitudNoEncontradaError extends AyudaError {
  constructor(
    message = 'Ya no podemos mostrar el estado de tu solicitud desde este computador. Si todavía necesitas ayuda, vuelve a pedirla.',
  ) {
    super(message, 404, 'SOLICITUD_NO_ENCONTRADA');
    this.name = 'SolicitudNoEncontradaError';
  }
}

/** 409 SOLICITUD_CERRADA / SOLICITUD_MODIFICADA: cambió de estado antes de cancelarla. */
export class SolicitudCambioEstadoError extends AyudaError {
  constructor(
    message = 'Tu solicitud cambió hace un momento.',
    codigo = 'SOLICITUD_CERRADA',
  ) {
    super(message, 409, codigo);
    this.name = 'SolicitudCambioEstadoError';
  }
}

/** 5xx o servicio temporalmente no disponible. */
export class AyudaNoDisponibleError extends AyudaError {
  constructor(
    message = 'El servicio de ayuda no está disponible en este momento. Si puedes, levanta la mano para llamar a un monitor.',
    statusCode?: number,
  ) {
    super(message, statusCode, 'ERROR_INTERNO');
    this.name = 'AyudaNoDisponibleError';
  }
}

/**
 * Red caída o tiempo de espera agotado. `ambigua = true`: la petición (POST/DELETE) pudo
 * llegar al servidor aunque no recibimos respuesta.
 */
export class ConexionAyudaError extends AyudaError {
  constructor(
    public readonly ambigua: boolean,
    message = ambigua
      ? 'Se perdió la conexión y no sabemos si tu pedido llegó. Vuelve a intentarlo: si ya había llegado, no se repetirá.'
      : 'No pudimos conectarnos. Revisa la conexión e intenta de nuevo.',
  ) {
    super(message, undefined, 'SIN_CONEXION');
    this.name = 'ConexionAyudaError';
  }
}

/** El servidor respondió algo que no cumple C-05. */
export class RespuestaInesperadaAyudaError extends AyudaError {
  constructor(
    message = 'Recibimos una respuesta inesperada del servidor. Intenta de nuevo en unos minutos.',
  ) {
    super(message, undefined, 'RESPUESTA_INESPERADA');
    this.name = 'RespuestaInesperadaAyudaError';
  }
}
