import type { AuthRepository } from './ports';
import type { AuthSession } from '@/domain/auth/types';

/** La sesión del usuario público guardada en este navegador, o null si no hay. */
export class ObtenerSesionPublica {
  constructor(private readonly authRepository: AuthRepository) {}

  async ejecutar(): Promise<AuthSession | null> {
    const sesion = await this.authRepository.obtenerSesion();
    return sesion?.usuario.rol === 'USUARIO_PUBLICO' ? sesion : null;
  }
}
