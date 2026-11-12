import { CodigoPersonal, PropositoCodigoPersonal } from './codigo-personal.js';

export abstract class CodigoPersonalRepository {
  /** Último código sin usar de esa persona para ese propósito, vencido o no. */
  abstract ultimoSinUsar(
    personalId: string,
    proposito: PropositoCodigoPersonal,
  ): Promise<CodigoPersonal | null>;

  /** Guarda el código nuevo y anula los anteriores sin usar del mismo propósito. */
  abstract emitir(codigo: CodigoPersonal): Promise<void>;

  /** Persiste los intentos fallidos y la fecha de uso. */
  abstract actualizar(codigo: CodigoPersonal): Promise<void>;
}
