import { CodigoInicioSesion } from './codigo-inicio-sesion.js';
import { CanalVerificacion } from './tipos.js';
import { Correo } from './value-objects/correo.js';
import { Telefono } from './value-objects/telefono.js';

/** Correo o celular verificado de la cuenta, al que se puede enviar el código. */
export interface ContactoCuenta {
  metodoInicioId: string;
  canal: CanalVerificacion;
  destino: Correo | Telefono;
}

/**
 * HU-05: lo que necesita el derecho de supresión. El código de confirmación es el mismo
 * código de un solo uso del inicio de sesión, guardado con el propósito ELIMINAR_CUENTA.
 */
// abstract class (no interface) para que sirva como token de inyección de Nest.
export abstract class EliminacionCuentaRepository {
  /** Contactos verificados de la cuenta; vacío si la cuenta no existe. */
  abstract contactos(usuarioId: string): Promise<ContactoCuenta[]>;

  /** Último código para eliminar la cuenta sin usar de ese contacto, vencido o no. */
  abstract ultimoCodigoSinUsar(
    metodoInicioId: string,
  ): Promise<CodigoInicioSesion | null>;

  /** Guarda el código nuevo y anula los anteriores sin usar. */
  abstract emitirCodigo(codigo: CodigoInicioSesion): Promise<void>;

  /** Suma un intento al código solo si todavía le quedan; false si ya se agotaron. */
  abstract reservarIntento(
    codigoId: string,
    maxIntentos: number,
  ): Promise<boolean>;

  /**
   * Borra la cuenta en una sola operación, todo o nada. Con ella se borran sus datos
   * personales, sus sesiones, su progreso y sus intentos; sus consultas, solicitudes de
   * ayuda y calificaciones se conservan sin referencia a la persona.
   */
  abstract eliminar(usuarioId: string): Promise<void>;
}
