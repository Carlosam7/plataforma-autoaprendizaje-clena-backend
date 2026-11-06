import { Usuario } from '../entities/usuario.js';
import { Correo } from '../value-objects/correo.js';
import { NumeroIdentificacion } from '../value-objects/numero-identificacion.js';
import { Telefono } from '../value-objects/telefono.js';

export interface UsuarioRepository {
  existePorIdentificacion(numero: NumeroIdentificacion): Promise<boolean>;
  existePorTelefono(telefono: Telefono): Promise<boolean>;
  existePorCorreo(correo: Correo): Promise<boolean>;
  /**
   * Persiste un usuario nuevo. Si otro registro ganó la carrera y ya ocupa la identificación,
   * el teléfono o el correo, lanza el error de dominio correspondiente.
   */
  crear(usuario: Usuario): Promise<void>;
}
