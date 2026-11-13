import type { AuthRepository } from './ports';
import { AuthValidationError } from '@/domain/auth/errors';
import type { CodigoEnviado } from '@/domain/auth/types';

export class SolicitarInicioSesion {
  constructor(private readonly authRepository: AuthRepository) {}

  async ejecutar(correo: string): Promise<CodigoEnviado> {
    const correoLimpio = correo?.trim().toLowerCase();

    if (!correoLimpio || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) {
      throw new AuthValidationError(
        'Escribe una dirección completa, por ejemplo: ana@correo.com.',
        'correo',
      );
    }

    return this.authRepository.solicitarInicioSesion(correoLimpio);
  }
}
