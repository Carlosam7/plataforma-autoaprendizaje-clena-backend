import type { AuthRepository } from './ports';
import { AuthValidationError } from '@/domain/auth/errors';
import type { AuthSession, VerificarRegistroParams } from '@/domain/auth/types';

export class VerificarCodigoRegistro {
  constructor(private readonly authRepository: AuthRepository) {}

  async ejecutar(params: VerificarRegistroParams): Promise<AuthSession> {
    const registroId = params.registroId?.trim();
    if (!registroId) {
      throw new AuthValidationError(
        'La solicitud de registro no es válida. Vuelve a llenar el formulario.',
        'registroId',
      );
    }

    const codigo = params.codigo?.trim().replace(/\s+/g, '');
    if (!codigo || !/^\d{6}$/.test(codigo)) {
      throw new AuthValidationError(
        'El código debe tener 6 números.',
        'codigo',
      );
    }

    const sesion = await this.authRepository.verificarRegistro({
      registroId,
      codigo,
    });

    await this.authRepository.guardarSesion(sesion);
    return sesion;
  }
}
