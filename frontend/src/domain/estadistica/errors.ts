export type TipoErrorEstadistica =
  | 'SESION'
  | 'PERMISO'
  | 'PERIODO_INVALIDO'
  | 'SERVIDOR'
  | 'CONEXION'
  | 'TIMEOUT'
  | 'RESPUESTA_INVALIDA';

export class EstadisticaError extends Error {
  constructor(
    message: string,
    public readonly tipo: TipoErrorEstadistica,
    public readonly codigo?: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'EstadisticaError';
  }
}
