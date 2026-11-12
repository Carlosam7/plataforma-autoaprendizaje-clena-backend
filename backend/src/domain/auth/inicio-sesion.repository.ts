import { CodigoInicioSesion } from './codigo-inicio-sesion.js';
import { CanalVerificacion } from './tipos.js';
import { Correo } from './value-objects/correo.js';
import { NumeroIdentificacion } from './value-objects/numero-identificacion.js';
import { Telefono } from './value-objects/telefono.js';

/** Cuenta activa de un usuario público vista desde uno de sus contactos. */
export interface CuentaParaInicio {
  /** Número de identificación: nunca sale hacia el cliente. */
  usuarioId: string;
  nombre: string;
  /** Contacto (correo o celular) por el que se envía el código. */
  metodoInicioId: string;
  canal: CanalVerificacion;
  destino: Correo | Telefono;
}

// abstract class (no interface) para que sirva como token de inyección de Nest.
export abstract class InicioSesionRepository {
  /**
   * Cuenta activa (con al menos un contacto verificado) a la que pertenecen ese número de
   * identificación y ese correo o celular. Si no coinciden los dos, devuelve null.
   */
  abstract buscarCuenta(
    numero: NumeroIdentificacion,
    contacto: Correo | Telefono,
  ): Promise<CuentaParaInicio | null>;

  /** Igual que `buscarCuenta`, a partir del contacto al que se envió el código. */
  abstract buscarCuentaPorContacto(
    metodoInicioId: string,
  ): Promise<CuentaParaInicio | null>;

  /** Último código de inicio de sesión sin usar de ese contacto, vencido o no. */
  abstract ultimoCodigoSinUsar(
    metodoInicioId: string,
  ): Promise<CodigoInicioSesion | null>;

  /** Guarda el código nuevo y anula los anteriores sin usar. */
  abstract emitirCodigo(codigo: CodigoInicioSesion): Promise<void>;

  /**
   * Suma un intento al código solo si todavía le quedan; devuelve false si ya se agotaron.
   * Es una sola operación en la base de datos: con peticiones en paralelo, solo `maxIntentos`
   * la superan, así que no se puede probar más códigos que los permitidos.
   */
  abstract reservarIntento(
    codigoId: string,
    maxIntentos: number,
  ): Promise<boolean>;

  /**
   * Marca el código como usado y, si el contacto aún no estaba verificado (se registró con
   * el otro), lo deja verificado: la persona acaba de demostrar que es suyo.
   */
  abstract confirmar(codigo: CodigoInicioSesion): Promise<void>;
}
