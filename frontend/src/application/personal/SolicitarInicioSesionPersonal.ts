import type { PersonalRepository } from './ports';
import type {
  InicioSesionPersonalSolicitado,
  SolicitarInicioSesionPersonalComando,
} from '@/domain/personal/types';
import { CredencialesIncorrectasError } from '@/domain/personal/errors';

export class SolicitarInicioSesionPersonal {
  constructor(private readonly repository: PersonalRepository) {}

  async ejecutar(
    comando: SolicitarInicioSesionPersonalComando,
  ): Promise<InicioSesionPersonalSolicitado> {
    const correo = comando.correo.trim();
    if (!correo || !comando.password) {
      throw new CredencialesIncorrectasError('Credenciales incorrectas');
    }
    return this.repository.solicitarInicioSesion({
      correo,
      password: comando.password,
    });
  }
}
