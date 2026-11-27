export type TipoErrorCatalogo =
  'CONEXION' | 'TIMEOUT' | 'SERVIDOR' | 'RESPUESTA_INVALIDA';

export class CatalogoError extends Error {
  constructor(
    message: string,
    public readonly tipo: TipoErrorCatalogo,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'CatalogoError';
  }
}
