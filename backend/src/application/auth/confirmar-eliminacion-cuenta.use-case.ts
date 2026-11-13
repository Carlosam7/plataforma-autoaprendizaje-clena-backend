import { EliminacionCuentaRepository } from '../../domain/auth/eliminacion-cuenta.repository.js';
import {
  CodigoIncorrectoError,
  IntentosAgotadosError,
  SolicitudEliminacionNoEncontradaError,
} from '../../domain/auth/errores.js';
import { Reloj } from '../shared/reloj.port.js';
import { HasherCodigo } from './codigo-verificacion.port.js';
import { ConfiguracionRegistro } from './configuracion-registro.js';

export interface ConfirmarEliminacionCuentaComando {
  solicitudId: string;
  codigo: string;
}

/**
 * HU-05, paso 2: con el código correcto se borra la cuenta. Sus sesiones se borran con
 * ella, así que el access token deja de servir de inmediato.
 */
export class ConfirmarEliminacionCuentaUseCase {
  constructor(
    private readonly cuentas: EliminacionCuentaRepository,
    private readonly hasher: HasherCodigo,
    private readonly reloj: Reloj,
    private readonly config: ConfiguracionRegistro,
  ) {}

  async ejecutar(
    usuarioId: string,
    comando: ConfirmarEliminacionCuentaComando,
  ): Promise<void> {
    const ahora = this.reloj.ahora();
    const { politicaCodigo } = this.config;

    // La solicitud tiene que ser de un contacto de quien tiene la sesión: nadie elimina
    // la cuenta de otro con su propio código.
    const esSuya = (await this.cuentas.contactos(usuarioId)).some(
      (c) => c.metodoInicioId === comando.solicitudId,
    );
    const codigo = esSuya
      ? await this.cuentas.ultimoCodigoSinUsar(comando.solicitudId)
      : null;
    if (!codigo) throw new SolicitudEliminacionNoEncontradaError();

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

    await this.cuentas.eliminar(usuarioId);
  }
}
