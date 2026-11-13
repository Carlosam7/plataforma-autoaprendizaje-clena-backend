import type { PersonalRepository } from './ports';
import type { CrearPersonalComando, Personal } from '@/domain/personal/types';
import { PasswordDebilError, PersonalError } from '@/domain/personal/errors';

export class CrearPersonal {
  constructor(private readonly repository: PersonalRepository) {}

  async ejecutar(
    token: string,
    comando: CrearPersonalComando,
  ): Promise<Personal> {
    const nombre = comando.nombre.trim();
    const correo = comando.correo.trim();
    const passwordTemporal = comando.passwordTemporal.trim();

    if (!nombre) {
      throw new PersonalError('El nombre es obligatorio', 400);
    }
    if (!correo || !correo.includes('@')) {
      throw new PersonalError('El correo es inválido', 400);
    }
    if (
      passwordTemporal.length < 8 ||
      !/\d/.test(passwordTemporal) ||
      !/[a-zA-Z]/.test(passwordTemporal)
    ) {
      throw new PasswordDebilError();
    }

    return this.repository.crearPersonal(token, {
      nombre,
      correo,
      passwordTemporal,
      rol: comando.rol,
    });
  }
}
