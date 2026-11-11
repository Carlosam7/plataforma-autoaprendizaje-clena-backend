import { Correo } from './value-objects/correo.js';
import { NumeroIdentificacion } from './value-objects/numero-identificacion.js';
import { Telefono } from './value-objects/telefono.js';

/** Consultas sobre cuentas ya verificadas; los registros pendientes no cuentan. */
export abstract class UsuarioRepository {
  abstract existePorIdentificacion(
    numero: NumeroIdentificacion,
  ): Promise<boolean>;
  abstract existePorTelefono(telefono: Telefono): Promise<boolean>;
  abstract existePorCorreo(correo: Correo): Promise<boolean>;
}
