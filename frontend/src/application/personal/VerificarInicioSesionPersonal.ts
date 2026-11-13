import type { PersonalRepository } from './ports';
import type {
  SesionPersonal,
  VerificarInicioSesionPersonalComando,
} from '@/domain/personal/types';
import { CodigoPersonalInvalidoError } from '@/domain/personal/errors';

export class VerificarInicioSesionPersonal {
  constructor(private readonly repository: PersonalRepository) {}

  async ejecutar(
    comando: VerificarInicioSesionPersonalComando,
  ): Promise<SesionPersonal> {
    const codigo = comando.codigo.trim();
    if (!codigo || codigo.length < 6) {
      throw new CodigoPersonalInvalidoError('El código debe tener 6 dígitos');
    }
    const sesion = await this.repository.verificarInicioSesion({
      destino: comando.destino,
      codigo,
    });
    await this.repository.guardarSesionPersonal(sesion);
    return sesion;
  }
}
