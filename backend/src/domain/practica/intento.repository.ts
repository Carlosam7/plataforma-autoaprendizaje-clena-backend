import { Intento } from './intento.js';

export abstract class IntentoRepository {
  abstract crear(intento: Intento): Promise<void>;

  /**
   * Carga el intento, aplica `cambio` y guarda lo que cambió, todo en una transacción y sin
   * que otra petición modifique el mismo intento a la vez. Si `cambio` lanza, no se guarda nada.
   * null si el intento no existe.
   */
  abstract modificar<T>(
    id: string,
    cambio: (intento: Intento) => T,
  ): Promise<T | null>;
}
