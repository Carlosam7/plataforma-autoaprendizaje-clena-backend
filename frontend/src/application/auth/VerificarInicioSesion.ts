import type { AuthRepository } from './ports';
import { AuthValidationError } from '@/domain/auth/errors';
import type {
  AuthSession,
  VerificarInicioSesionParams,
} from '@/domain/auth/types';

export class VerificarInicioSesion {
  constructor(private readonly authRepository: AuthRepository) {}

  async ejecutar(params: VerificarInicioSesionParams): Promise<AuthSession> {
    const solicitudId = params?.solicitudId?.trim();
    if (!solicitudId) {
      throw new AuthValidationError(
        'La solicitud para iniciar sesión no es válida. Vuelve a escribir tus datos.',
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

    const sesion = await this.authRepository.verificarInicioSesion({
      solicitudId,
      codigo,
    });

    await this.authRepository.guardarSesion(sesion);
    return sesion;
  }
}

