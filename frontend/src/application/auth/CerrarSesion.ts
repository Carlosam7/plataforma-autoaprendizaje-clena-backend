import type { AuthRepository } from './ports';

/** HU-02: cierra la sesión pública (revoca el refresh token y borra la cookie). */
export class CerrarSesion {
  constructor(private readonly authRepository: AuthRepository) {}

  ejecutar(): Promise<void> {
    return this.authRepository.cerrarSesion();
  }
}
