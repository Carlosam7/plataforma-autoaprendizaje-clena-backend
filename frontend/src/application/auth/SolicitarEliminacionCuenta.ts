import type { AuthRepository } from './ports';
import { AuthSessionExpiredError } from '@/domain/auth/errors';
import type {
  CanalVerificacion,
  EliminacionSolicitada,
} from '@/domain/auth/types';

/**
 * HU-05 (Ley 1581): el usuario público pide eliminar su cuenta. Se le envía un código al
 * correo o al celular de la cuenta; todavía no se borra nada.
 */
export class SolicitarEliminacionCuenta {
  constructor(private readonly authRepository: AuthRepository) {}

  async ejecutar(canal?: CanalVerificacion): Promise<EliminacionSolicitada> {
    const sesion = await this.authRepository.obtenerSesion();
    if (!sesion || sesion.usuario.rol !== 'USUARIO_PUBLICO') {
      throw new AuthSessionExpiredError(
        'Inicia sesión con tu cuenta para eliminarla.',
      );
    }
    return this.authRepository.solicitarEliminacionCuenta(canal);
  }
}
