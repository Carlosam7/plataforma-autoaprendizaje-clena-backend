import { Rol } from './tipos.js';

/** Quién está detrás de una sesión vigente. */
export interface SesionActiva {
  sesionId: string;
  /** Número de identificación del usuario público o uuid del personal. */
  usuarioId: string;
  /** Rol actual según la base de datos, no según el token: así un cambio de rol aplica de inmediato. */
  rol: Rol;
}

export abstract class SesionRepository {
  /**
   * Devuelve la sesión solo si no está revocada ni vencida y, si es del personal,
   * su cuenta sigue activa. Así desactivar una cuenta la saca en la siguiente petición.
   */
  abstract buscarActiva(
    sesionId: string,
    ahora: Date,
  ): Promise<SesionActiva | null>;
}
