import type { AuthRepository } from './ports';
import type { AvisoPrivacidad } from '@/domain/auth/types';

export class ObtenerAvisoPrivacidad {
  constructor(private readonly authRepository: AuthRepository) {}

  async ejecutar(): Promise<AvisoPrivacidad> {
    return this.authRepository.obtenerAvisoPrivacidad();
  }
}
