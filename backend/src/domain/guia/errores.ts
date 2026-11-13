import { ErrorDeNegocio } from '../shared/error-de-negocio.js';

/** HU-13: regla del catálogo. Lo que el público ve siempre tiene algo que leer. */
export class GuiaSinPasosError extends ErrorDeNegocio {
  constructor() {
    super(
      'GUIA_SIN_PASOS',
      'conflicto',
      'Una guía publicada necesita al menos un paso. Agrégale un paso primero.',
    );
  }
}

/** HU-15: un borrador todavía no está en el catálogo, así que no hay nada que ocultar. */
export class GuiaNoPublicadaError extends ErrorDeNegocio {
  constructor() {
    super(
      'GUIA_NO_PUBLICADA',
      'conflicto',
      'Esta guía todavía es un borrador: no se puede ocultar.',
    );
  }
}

/** La guía no existe o no está publicada: para el público es lo mismo. */
export class GuiaNoEncontradaError extends ErrorDeNegocio {
  constructor() {
    super('GUIA_NO_ENCONTRADA', 'no_encontrado', 'No encontramos esa guía.');
  }
}
