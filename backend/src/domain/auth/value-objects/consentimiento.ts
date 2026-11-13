import { ErrorDeNegocio } from '../../shared/error-de-negocio.js';

export class ConsentimientoRequeridoError extends ErrorDeNegocio {
  constructor() {
    super(
      'CONSENTIMIENTO_REQUERIDO',
      'validacion',
      'Para crear tu cuenta debes leer y aceptar el aviso de privacidad.',
    );
  }
}

/**
 * Autorización del titular para tratar sus datos (Ley 1581 de 2012, art. 9).
 * Guarda la versión del aviso aceptado y la fecha, como prueba del consentimiento.
 */
export class Consentimiento {
  private constructor(
    readonly versionAviso: string,
    readonly aceptadoEn: Date,
  ) {}

  static otorgar(
    aceptado: boolean,
    versionAviso: string,
    ahora: Date,
  ): Consentimiento {
    if (!aceptado) throw new ConsentimientoRequeridoError();
    return new Consentimiento(versionAviso, ahora);
  }

  static reconstituir(versionAviso: string, aceptadoEn: Date): Consentimiento {
    return new Consentimiento(versionAviso, aceptadoEn);
  }
}
