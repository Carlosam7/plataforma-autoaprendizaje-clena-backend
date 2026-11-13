import { ErrorDeNegocio } from '../shared/error-de-negocio.js';

export class SolicitudNoEncontradaError extends ErrorDeNegocio {
  constructor() {
    super(
      'SOLICITUD_NO_ENCONTRADA',
      'no_encontrado',
      'No encontramos esa solicitud de ayuda.',
    );
  }
}

/** HU-30: dos monitores no atienden la misma solicitud. */
export class SolicitudYaTomadaError extends ErrorDeNegocio {
  constructor() {
    super(
      'SOLICITUD_YA_TOMADA',
      'conflicto',
      'Otro monitor ya está atendiendo esta solicitud.',
    );
  }
}

/** HU-30: solo se resuelve lo que alguien ya está atendiendo. */
export class SolicitudSinTomarError extends ErrorDeNegocio {
  constructor() {
    super(
      'SOLICITUD_SIN_TOMAR',
      'conflicto',
      'Primero toma la solicitud para atenderla.',
    );
  }
}

/** HU-30: la resuelve quien la tomó. */
export class SolicitudDeOtroMonitorError extends ErrorDeNegocio {
  constructor() {
    super(
      'SOLICITUD_DE_OTRO_MONITOR',
      'prohibido',
      'Esta solicitud la está atendiendo otra persona.',
    );
  }
}

/** Otra petición la cambió entre que se leyó y se guardó (por ejemplo, la cancelaron). */
export class SolicitudModificadaError extends ErrorDeNegocio {
  constructor() {
    super(
      'SOLICITUD_MODIFICADA',
      'conflicto',
      'Esta solicitud cambió hace un momento. Actualiza la lista e inténtalo de nuevo.',
    );
  }
}

/** Ya fue resuelta o cancelada: no se puede cambiar. */
export class SolicitudCerradaError extends ErrorDeNegocio {
  constructor() {
    super(
      'SOLICITUD_CERRADA',
      'conflicto',
      'Esta solicitud ya fue atendida o cancelada.',
    );
  }
}
