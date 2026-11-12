import { RegistroPendiente } from './registro-pendiente.js';
import { Correo } from './value-objects/correo.js';
import { NumeroIdentificacion } from './value-objects/numero-identificacion.js';
import { Telefono } from './value-objects/telefono.js';

// abstract class (no interface) para que sirva como token de inyección de Nest.
export abstract class RegistroPendienteRepository {
  abstract buscarPorId(id: string): Promise<RegistroPendiente | null>;
  abstract buscarPorIdentificacion(
    numero: NumeroIdentificacion,
  ): Promise<RegistroPendiente | null>;
  /** Registro sin verificar que tiene reservado ese correo o celular, sea de quien sea. */
  abstract buscarPorContacto(
    contacto: Correo | Telefono,
  ): Promise<RegistroPendiente | null>;
  /**
   * Crea o actualiza la solicitud. Si otra persona ocupó el correo o el celular entre la
   * comprobación y el guardado, lanza el error de dominio correspondiente.
   */
  abstract guardar(registro: RegistroPendiente): Promise<void>;
  /**
   * Suma un intento al código vigente del registro solo si todavía le quedan; devuelve false si ya se agotaron.
   * Es una sola operación en la base de datos: con peticiones en paralelo, solo `maxIntentos`
   * la superan, así que no se puede probar más códigos que los permitidos.
   */
  abstract reservarIntento(
    registroId: string,
    maxIntentos: number,
  ): Promise<boolean>;
  /** Marca como verificado el contacto por el que se envió el código: la cuenta queda activa. */
  abstract confirmar(registro: RegistroPendiente, ahora: Date): Promise<void>;
  /** Borra un registro sin verificar (nunca una cuenta verificada). */
  abstract eliminar(id: string): Promise<void>;
}
