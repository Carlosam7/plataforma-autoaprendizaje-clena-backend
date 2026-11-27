export type TipoErrorCola =
  | 'SESION'
  | 'PERMISO'
  | 'NO_ENCONTRADA'
  | 'CONFLICTO'
  | 'VALIDACION'
  | 'SERVIDOR'
  | 'CONEXION'
  | 'TIMEOUT'
  | 'RESPUESTA_INVALIDA';

export class ColaSolicitudError extends Error {
  constructor(
    message: string,
    public readonly tipo: TipoErrorCola,
    public readonly codigo?: string,
    public readonly statusCode?: number,
    /** true cuando un POST pudo haberse aplicado sin que lo sepamos. */
    public readonly resultadoIncierto = false,
  ) {
    super(message);
    this.name = 'ColaSolicitudError';
  }
}
