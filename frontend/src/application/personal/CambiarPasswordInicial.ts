import type { PersonalRepository } from './ports';
import type { CambiarPasswordInicialComando } from '@/domain/personal/types';
import { PasswordDebilError } from '@/domain/personal/errors';

export class CambiarPasswordInicial {
  constructor(private readonly repository: PersonalRepository) {}

  async ejecutar(
    token: string,
    comando: CambiarPasswordInicialComando,
  ): Promise<void> {
    const password = comando.nuevoPassword.trim();
    if (
      password.length < 8 ||
      !/\d/.test(password) ||
      !/[a-zA-Z]/.test(password)
    ) {
      throw new PasswordDebilError();
    }
    await this.repository.cambiarPasswordInicial(token, {
      codigo: comando.codigo.trim(),
      nuevoPassword: password,
    });
    // Actualizar sesión si correspondía cambiar clave
    const sesion = await this.repository.obtenerSesionPersonal();
    if (sesion) {
      sesion.usuario.debeCambiarPassword = false;
      await this.repository.guardarSesionPersonal(sesion);
    }
  }
}
