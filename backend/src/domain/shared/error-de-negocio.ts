/**
 * Categoría semántica del error. La capa de presentación la traduce a un código HTTP;
 * el dominio no conoce HTTP.
 */
export type TipoError =
  | 'validacion'
  | 'conflicto'
  | 'no_encontrado'
  | 'no_autorizado'
  | 'prohibido'
  | 'demasiados_intentos'
  | 'expirado'
  | 'servicio_no_disponible';

/**
 * Error esperado del negocio. Su `mensaje` está en lenguaje sencillo
 * porque se muestra tal cual al usuario.
 */
export class ErrorDeNegocio extends Error {
  constructor(
    readonly codigo: string,
    readonly tipo: TipoError,
    mensaje: string,
    readonly detalles?: Record<string, unknown>,
  ) {
    super(mensaje);
    this.name = new.target.name;
  }
}

export class DatoInvalidoError extends ErrorDeNegocio {
  constructor(
    readonly campo: string,
    mensaje: string,
  ) {
    super('DATO_INVALIDO', 'validacion', mensaje, { campo });
  }
}
