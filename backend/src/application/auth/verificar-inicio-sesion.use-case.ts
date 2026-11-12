import {
  CodigoIncorrectoError,
  IntentosAgotadosError,
  SolicitudInicioSesionNoEncontradaError,
} from '../../domain/auth/errores.js';
import { InicioSesionRepository } from '../../domain/auth/inicio-sesion.repository.js';
import { Reloj } from '../shared/reloj.port.js';
import { HasherCodigo } from './codigo-verificacion.port.js';
import { ConfiguracionRegistro } from './configuracion-registro.js';
import { EmisorSesion } from './emisor-sesion.port.js';
import { UsuarioRegistradoResultado } from './verificar-registro.use-case.js';

/** HU-02, paso 2: valida el código y abre la sesión (access token + refresh token). */
export class VerificarInicioSesionUseCase {
  constructor(
    private readonly cuentas: InicioSesionRepository,
    private readonly hasher: HasherCodigo,
    private readonly emisorSesion: EmisorSesion,
    private readonly reloj: Reloj,
    private readonly config: ConfiguracionRegistro,
  ) {}

  async ejecutar(comando: {
    solicitudId: string;
    codigo: string;
  }): Promise<UsuarioRegistradoResultado> {
    const ahora = this.reloj.ahora();
    const { politicaCodigo } = this.config;

    const cuenta = await this.cuentas.buscarCuentaPorContacto(
      comando.solicitudId,
    );
    const codigo = cuenta
      ? await this.cuentas.ultimoCodigoSinUsar(cuenta.metodoInicioId)
      : null;
    if (!cuenta || !codigo) throw new SolicitudInicioSesionNoEncontradaError();

    codigo.asegurarUtilizable(ahora, politicaCodigo);
    // Se reserva el intento antes de comparar: así, con peticiones en paralelo, solo
    // maxIntentos llegan a probar un código.
    if (
      !(await this.cuentas.reservarIntento(
        codigo.id,
        politicaCodigo.maxIntentos,
      ))
    ) {
      throw new IntentosAgotadosError();
    }

    if (
      !(await this.hasher.coincide(comando.codigo.trim(), codigo.codigoHash))
    ) {
      throw new CodigoIncorrectoError(
        codigo.registrarIntentoFallido(politicaCodigo),
      );
    }

    codigo.marcarUsado(ahora);
    await this.cuentas.confirmar(codigo);

    const sesion = await this.emisorSesion.iniciar({
      id: cuenta.usuarioId,
      rol: 'USUARIO_PUBLICO',
    });
    return {
      usuario: { nombre: cuenta.nombre, rol: 'USUARIO_PUBLICO' },
      sesion,
    };
  }
}
