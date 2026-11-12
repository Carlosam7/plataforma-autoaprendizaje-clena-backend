import { ErrorDeNegocio } from '../shared/error-de-negocio.js';

export class PersonalNoEncontradoError extends ErrorDeNegocio {
  constructor() {
    super(
      'PERSONAL_NO_ENCONTRADO',
      'no_encontrado',
      'No encontramos esa cuenta del personal.',
    );
  }
}

export class CorreoPersonalEnUsoError extends ErrorDeNegocio {
  constructor() {
    super(
      'CORREO_EN_USO',
      'conflicto',
      'Ese correo ya está en uso, prueba con otro',
    );
  }
}

/** Un administrador no puede desactivarse ni quitarse el rol: podría dejar el sistema sin administrador. */
export class AutoModificacionNoPermitidaError extends ErrorDeNegocio {
  constructor(accion: 'desactivar' | 'cambiar el rol') {
    super(
      'AUTO_MODIFICACION_NO_PERMITIDA',
      'prohibido',
      accion === 'desactivar'
        ? 'No puedes desactivar tu propia cuenta. Pídeselo a otro administrador.'
        : 'No puedes cambiar tu propio rol. Pídeselo a otro administrador.',
    );
  }
}

export class CambioPasswordNoRequeridoError extends ErrorDeNegocio {
  constructor() {
    super(
      'CAMBIO_PASSWORD_NO_REQUERIDO',
      'conflicto',
      'Tu contraseña ya fue cambiada. No necesitas hacerlo de nuevo.',
    );
  }
}

export class CodigoNoSolicitadoError extends ErrorDeNegocio {
  constructor() {
    super(
      'CODIGO_NO_SOLICITADO',
      'validacion',
      'Primero pide el código que te enviamos al correo.',
    );
  }
}

export class PasswordRepetidaError extends ErrorDeNegocio {
  constructor() {
    super(
      'PASSWORD_REPETIDA',
      'validacion',
      'La contraseña nueva debe ser diferente a la temporal.',
    );
  }
}
