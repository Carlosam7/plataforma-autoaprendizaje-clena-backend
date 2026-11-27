import { ErrorDeNegocio } from '../shared/error-de-negocio.js';

/** HU-31: `desde`/`hasta` no son fechas reales, están al revés o abarcan demasiados días. */
export class RangoFechasInvalidoError extends ErrorDeNegocio {
  constructor(mensaje: string, campo: 'desde' | 'hasta') {
    super('RANGO_FECHAS_INVALIDO', 'validacion', mensaje, { campo });
  }
}
