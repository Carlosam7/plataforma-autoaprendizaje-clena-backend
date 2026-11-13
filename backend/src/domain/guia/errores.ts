import { ErrorDeNegocio } from '../shared/error-de-negocio.js';

/** La guía no existe o no está publicada: para el público es lo mismo. */
export class GuiaNoEncontradaError extends ErrorDeNegocio {
  constructor() {
    super('GUIA_NO_ENCONTRADA', 'no_encontrado', 'No encontramos esa guía.');
  }
}
