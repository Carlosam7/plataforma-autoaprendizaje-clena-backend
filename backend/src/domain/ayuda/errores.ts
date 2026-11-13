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
