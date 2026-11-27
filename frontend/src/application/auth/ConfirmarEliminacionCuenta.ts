import type { AuthRepository } from './ports';
import { AuthValidationError } from '@/domain/auth/errors';
import type { ConfirmarEliminacionParams } from '@/domain/auth/types';

/**
 * HU-05: con el código, la cuenta se borra de verdad y no se puede deshacer. Después la
 * sesión de este navegador queda cerrada.
 */
export class ConfirmarEliminacionCuenta {
  constructor(private readonly authRepository: AuthRepository) {}

  async ejecutar(params: ConfirmarEliminacionParams): Promise<void> {
    const solicitudId = params?.solicitudId?.trim();
    if (!solicitudId) {
      throw new AuthValidationError(
        'Primero pide el código para eliminar tu cuenta.',
        'solicitudId',
      );
    }
    const codigo = params?.codigo?.trim().replace(/\s+/g, '');
    if (!codigo || !/^\d{6}$/.test(codigo)) {
      throw new AuthValidationError(
        'El código debe tener 6 números.',
        'codigo',
      );
    }
    await this.authRepository.confirmarEliminacionCuenta({
      solicitudId,
      codigo,
    });
  }
}
