import { Correo } from '../../domain/auth/value-objects/correo.js';
import { CodigoPersonal } from '../../domain/personal/codigo-personal.js';
import { CodigoPersonalRepository } from '../../domain/personal/codigo-personal.repository.js';
import { CredencialesIncorrectasError } from '../../domain/personal/errores.js';
import { PersonalRepository } from '../../domain/personal/personal.repository.js';
import {
  EnviadorCodigo,
  GeneradorCodigo,
  HasherCodigo,
} from '../auth/codigo-verificacion.port.js';
import { InicioSesionSolicitado } from '../auth/solicitar-inicio-sesion.use-case.js';
import { GeneradorId } from '../shared/generador-id.port.js';
import { Reloj } from '../shared/reloj.port.js';
import { ConfiguracionPersonal } from './configuracion-personal.js';
import { HasherPassword } from './hasher-password.port.js';

export interface SolicitarInicioSesionPersonalComando {
  correo: string;
  password: string;
}

/**
 * HU-06, paso 1: si el correo y la contraseña son de una cuenta activa del personal,
 * envía un código a ese correo. Volver a llamarlo reenvía el código (con espera mínima).
 */
export class SolicitarInicioSesionPersonalUseCase {
  constructor(
    private readonly personal: PersonalRepository,
    private readonly codigos: CodigoPersonalRepository,
    private readonly hasherPassword: HasherPassword,
    private readonly generadorCodigo: GeneradorCodigo,
    private readonly hasherCodigo: HasherCodigo,
    private readonly enviador: EnviadorCodigo,
    private readonly generadorId: GeneradorId,
    private readonly reloj: Reloj,
    private readonly config: ConfiguracionPersonal,
  ) {}

  async ejecutar(
    comando: SolicitarInicioSesionPersonalComando,
  ): Promise<InicioSesionSolicitado> {
    const cuenta = await this.personal.buscarPorCorreo(
      Correo.crear(comando.correo),
    );
    if (!cuenta) {
      // Se gasta el mismo tiempo que al comparar la contraseña: así la demora de la
      // respuesta no revela qué correos tienen cuenta.
      await this.hasherPassword.hash(comando.password);
      throw new CredencialesIncorrectasError();
    }
    if (
      !(await this.hasherPassword.coincide(
        comando.password,
        cuenta.passwordHash,
      )) ||
      !cuenta.activo
    ) {
      throw new CredencialesIncorrectasError();
    }

    const ahora = this.reloj.ahora();
    const politica = this.config.politicaCodigo;
    const anterior = await this.codigos.ultimoSinUsar(
      cuenta.id,
      'INICIO_SESION',
    );
    anterior?.asegurarQuePuedeReenviar(ahora, politica);

    const codigo = this.generadorCodigo.generar();
    const nuevo = CodigoPersonal.emitir({
      id: this.generadorId.generar(),
      personalId: cuenta.id,
      proposito: 'INICIO_SESION',
      codigoHash: await this.hasherCodigo.hash(codigo),
      ahora,
      politica,
    });
    // Primero se envía y después se guarda: si el envío falla, no queda un código
    // guardado que obligue a esperar para pedir otro.
    await this.enviador.enviar({
      canal: 'CORREO',
      destino: cuenta.correo.valor,
      codigo,
      proposito: 'INICIO_SESION',
      vigenciaMinutos: politica.vigenciaMinutos,
    });
    await this.codigos.emitir(nuevo);

    return {
      solicitudId: cuenta.id,
      canal: 'CORREO',
      destino: cuenta.correo.enmascarado(),
      expiraEn: nuevo.expiraEn,
      puedeReenviarEn: new Date(
        ahora.getTime() + politica.esperaReenvioSegundos * 1000,
      ),
    };
  }
}
