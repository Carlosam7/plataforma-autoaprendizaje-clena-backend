import { ErrorDeNegocio } from '../shared/error-de-negocio.js';

// Los textos de los tres primeros vienen literales de los criterios de aceptación de HU-01.

export class IdentificacionYaRegistradaError extends ErrorDeNegocio {
  constructor() {
    super(
      'IDENTIFICACION_YA_REGISTRADA',
      'conflicto',
      'Este usuario ya tiene una cuenta',
    );
  }
}

export class TelefonoEnUsoError extends ErrorDeNegocio {
  constructor() {
    super(
      'TELEFONO_EN_USO',
      'conflicto',
      'Ese teléfono ya está en uso, prueba con otro',
    );
  }
}

export class CorreoEnUsoError extends ErrorDeNegocio {
  constructor() {
    super(
      'CORREO_EN_USO',
      'conflicto',
      'Ese correo ya está en uso, prueba con otro',
    );
  }
}

export class ContactoRequeridoError extends ErrorDeNegocio {
  constructor() {
    super(
      'CONTACTO_REQUERIDO',
      'validacion',
      'Escribe tu número de celular o tu correo para enviarte el código de verificación.',
    );
  }
}

export class CanalSinContactoError extends ErrorDeNegocio {
  constructor(canal: 'CORREO' | 'TELEFONO') {
    super(
      'CANAL_SIN_CONTACTO',
      'validacion',
      canal === 'CORREO'
        ? 'Elegiste recibir el código por correo, pero no escribiste un correo.'
        : 'Elegiste recibir el código por mensaje de texto, pero no escribiste un celular.',
    );
  }
}

export class RegistroNoEncontradoError extends ErrorDeNegocio {
  constructor() {
    super(
      'REGISTRO_NO_ENCONTRADO',
      'no_encontrado',
      'No encontramos tu solicitud de registro. Vuelve a llenar el formulario.',
    );
  }
}

export class CodigoIncorrectoError extends ErrorDeNegocio {
  constructor(readonly intentosRestantes: number) {
    super(
      'CODIGO_INCORRECTO',
      'validacion',
      intentosRestantes === 1
        ? 'El código no es correcto. Te queda 1 intento.'
        : `El código no es correcto. Te quedan ${intentosRestantes} intentos.`,
      { intentosRestantes },
    );
  }
}

export class CodigoExpiradoError extends ErrorDeNegocio {
  constructor() {
    super(
      'CODIGO_EXPIRADO',
      'expirado',
      'El código ya venció. Pide uno nuevo.',
    );
  }
}

export class IntentosAgotadosError extends ErrorDeNegocio {
  constructor() {
    super(
      'INTENTOS_AGOTADOS',
      'demasiados_intentos',
      'Escribiste el código mal varias veces. Pide un código nuevo.',
    );
  }
}

export class AvisoPrivacidadNoDisponibleError extends ErrorDeNegocio {
  constructor() {
    super(
      'AVISO_PRIVACIDAD_NO_DISPONIBLE',
      'servicio_no_disponible',
      'En este momento no podemos mostrarte el aviso de privacidad, así que no es posible crear la cuenta. Pide ayuda a un monitor.',
    );
  }
}

export class ReenvioMuyProntoError extends ErrorDeNegocio {
  constructor(readonly segundosRestantes: number) {
    super(
      'REENVIO_MUY_PRONTO',
      'demasiados_intentos',
      `Ya te enviamos un código. Espera ${segundosRestantes} segundos antes de pedir otro.`,
      { segundosRestantes },
    );
  }
}

export class EnvioCodigoFallidoError extends ErrorDeNegocio {
  constructor() {
    super(
      'ENVIO_CODIGO_FALLIDO',
      'servicio_no_disponible',
      'No pudimos enviarte el código. Intenta de nuevo más tarde o pide ayuda a un monitor.',
    );
  }
}
