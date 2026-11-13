import type { AuthRepository } from './ports';
import { AuthValidationError } from '@/domain/auth/errors';
import type { CodigoEnviado } from '@/domain/auth/types';

export class ReenviarCodigoRegistro {
  constructor(private readonly authRepository: AuthRepository) {}

  async ejecutar(registroId: string): Promise<CodigoEnviado> {
    const id = registroId?.trim();
    if (!id) {
      throw new AuthValidationError(
        'La solicitud de registro no es válida. Vuelve a llenar el formulario.',
        'registroId',
      );
    }
    return this.authRepository.reenviarCodigo(id);
  }
}
