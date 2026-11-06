import { RegistroPendiente } from '../entities/registro-pendiente.js';
import { NumeroIdentificacion } from '../value-objects/numero-identificacion.js';

export interface RegistroPendienteRepository {
  buscarPorId(id: string): Promise<RegistroPendiente | null>;
  buscarPorIdentificacion(
    numero: NumeroIdentificacion,
  ): Promise<RegistroPendiente | null>;
  /** Crea o actualiza la solicitud. */
  guardar(registro: RegistroPendiente): Promise<void>;
  eliminar(id: string): Promise<void>;
}
