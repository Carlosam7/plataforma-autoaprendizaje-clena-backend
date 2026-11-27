export type TipoErrorProgreso =
  | 'SESION'
  | 'PERMISO'
  | 'PASO_NO_ENCONTRADO'
  | 'NO_ENCONTRADA'
  | 'VALIDACION'
  | 'SERVIDOR'
  | 'CONEXION'
  | 'TIMEOUT'
  | 'RESPUESTA_INVALIDA';

export class ProgresoError extends Error {
  constructor(
    message: string,
    public readonly tipo: TipoErrorProgreso,
    public readonly codigo?: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'ProgresoError';
  }
}
