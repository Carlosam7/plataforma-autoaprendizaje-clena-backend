import { CodigoPersonal, PropositoCodigoPersonal } from './codigo-personal.js';

export abstract class CodigoPersonalRepository {
  /** Último código sin usar de esa persona para ese propósito, vencido o no. */
  abstract ultimoSinUsar(
    personalId: string,
    proposito: PropositoCodigoPersonal,
  ): Promise<CodigoPersonal | null>;

  /** Guarda el código nuevo y anula los anteriores sin usar del mismo propósito. */
  abstract emitir(codigo: CodigoPersonal): Promise<void>;

  /**
   * Suma un intento al código solo si todavía le quedan; devuelve false si ya se agotaron.
   * Es una sola operación en la base de datos: con peticiones en paralelo, solo `maxIntentos`
   * la superan, así que no se puede probar más códigos que los permitidos.
   */
  abstract reservarIntento(
    codigoId: string,
    maxIntentos: number,
  ): Promise<boolean>;

  /** Persiste la fecha de uso. */
  abstract actualizar(codigo: CodigoPersonal): Promise<void>;
}
