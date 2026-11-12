import { CodigoIncorrectoError } from '../../domain/auth/errores.js';
import {
  CambioPasswordNoRequeridoError,
  CodigoNoSolicitadoError,
  PasswordRepetidaError,
} from '../../domain/personal/errores.js';
import { CodigoPersonalRepository } from '../../domain/personal/codigo-personal.repository.js';
import { Password } from '../../domain/personal/password.js';
import { PersonalRepository } from '../../domain/personal/personal.repository.js';
import { HasherCodigo } from '../auth/codigo-verificacion.port.js';
import { Reloj } from '../shared/reloj.port.js';
import { buscarPersonalOFallar } from './buscar-personal.js';
import { ConfiguracionPersonal } from './configuracion-personal.js';
import { HasherPassword } from './hasher-password.port.js';

export interface CambiarPasswordInicialEntrada {
  codigo: string;
  passwordNueva: string;
}

/** HU-04: con el código del correo, cambia la contraseña temporal por una propia. */
export class CambiarPasswordInicialUseCase {
  constructor(
    private readonly personal: PersonalRepository,
    private readonly codigos: CodigoPersonalRepository,
    private readonly hasherCodigo: HasherCodigo,
    private readonly hasherPassword: HasherPassword,
    private readonly reloj: Reloj,
    private readonly config: ConfiguracionPersonal,
  ) {}

  async ejecutar(
    personalId: string,
    entrada: CambiarPasswordInicialEntrada,
  ): Promise<void> {
    const password = Password.crear(entrada.passwordNueva, 'passwordNueva');
    const cuenta = await buscarPersonalOFallar(this.personal, personalId);
    if (!cuenta.debeCambiarPassword) throw new CambioPasswordNoRequeridoError();

    const codigo = await this.codigos.ultimoSinUsar(
      cuenta.id,
      'CAMBIO_PASSWORD_INICIAL',
    );
    if (!codigo) throw new CodigoNoSolicitadoError();

    const ahora = this.reloj.ahora();
    const politica = this.config.politicaCodigo;
    codigo.asegurarUtilizable(ahora, politica);
    if (
      !(await this.hasherCodigo.coincide(entrada.codigo, codigo.codigoHash))
    ) {
      const restantes = codigo.registrarIntentoFallido(politica);
      await this.codigos.actualizar(codigo);
      throw new CodigoIncorrectoError(restantes);
    }

    if (
      await this.hasherPassword.coincide(password.valor, cuenta.passwordHash)
    ) {
      throw new PasswordRepetidaError();
    }

    codigo.marcarUsado(ahora);
    cuenta.cambiarPasswordInicial(
      await this.hasherPassword.hash(password.valor),
    );
    await this.codigos.actualizar(codigo);
    await this.personal.actualizar(cuenta);
  }
}
