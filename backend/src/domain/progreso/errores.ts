import { ErrorDeNegocio } from '../shared/error-de-negocio.js';

/** La guía no está publicada o no tiene un paso con ese número. */
export class PasoNoEncontradoError extends ErrorDeNegocio {
  constructor() {
    super(
      'PASO_NO_ENCONTRADO',
      'no_encontrado',
      'No encontramos ese paso de la guía.',
    );
  }
}
