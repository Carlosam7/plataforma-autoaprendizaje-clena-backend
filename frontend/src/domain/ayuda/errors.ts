export type TipoErrorSolicitud =
  | 'SESION'
  | 'PERMISO'
  | 'NO_ENCONTRADA'
  | 'CONFLICTO'
  | 'VALIDACION'
  | 'SERVIDOR'
  | 'CONEXION'
  | 'TIMEOUT'
  | 'RESPUESTA_INVALIDA';

export class SolicitudAyudaError extends Error {
  constructor(
    message: string,
    public readonly tipo: TipoErrorSolicitud,
    public readonly codigo?: string,
    public readonly statusCode?: number,
    /** true cuando un POST pudo haberse aplicado sin que lo sepamos. */
    public readonly resultadoIncierto = false,
  ) {
    super(message);
    this.name = 'SolicitudAyudaError';
  }
}
