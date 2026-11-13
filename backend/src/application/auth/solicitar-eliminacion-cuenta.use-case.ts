import { CodigoInicioSesion } from '../../domain/auth/codigo-inicio-sesion.js';
import { EliminacionCuentaRepository } from '../../domain/auth/eliminacion-cuenta.repository.js';
import { ContactoNoVerificadoError } from '../../domain/auth/errores.js';
import { CanalVerificacion } from '../../domain/auth/tipos.js';
import { GeneradorId } from '../shared/generador-id.port.js';
import { Reloj } from '../shared/reloj.port.js';
import {
  EnviadorCodigo,
  GeneradorCodigo,
  HasherCodigo,
} from './codigo-verificacion.port.js';
import { ConfiguracionRegistro } from './configuracion-registro.js';

export interface EliminacionSolicitada {
  /** Se envía al confirmar con el código. */
  solicitudId: string;
  canal: CanalVerificacion;
  /** Destino enmascarado para que el usuario sepa dónde buscar el código. */
  destino: string;
  expiraEn: Date;
  puedeReenviarEn: Date;
}

/**
 * HU-05, paso 1: el usuario pide eliminar su cuenta y recibe un código en su correo o su
 * celular para confirmar que es él. Todavía no se borra nada. Volver a llamarlo reenvía el
 * código (con espera mínima).
 */
export class SolicitarEliminacionCuentaUseCase {
  constructor(
    private readonly cuentas: EliminacionCuentaRepository,
    private readonly generadorCodigo: GeneradorCodigo,
    private readonly hasher: HasherCodigo,
    private readonly enviador: EnviadorCodigo,
    private readonly generadorId: GeneradorId,
    private readonly reloj: Reloj,
    private readonly config: ConfiguracionRegistro,
  ) {}

  /** `canal`: por dónde quiere el código; sin él, por correo si tiene y si no por celular. */
  async ejecutar(
    usuarioId: string,
    canal?: CanalVerificacion,
  ): Promise<EliminacionSolicitada> {
    const ahora = this.reloj.ahora();
    const { politicaCodigo } = this.config;

    const contactos = await this.cuentas.contactos(usuarioId);
    const contacto = canal
      ? contactos.find((c) => c.canal === canal)
      : (contactos.find((c) => c.canal === 'CORREO') ?? contactos[0]);
    if (!contacto) throw new ContactoNoVerificadoError(canal);

    const anterior = await this.cuentas.ultimoCodigoSinUsar(
      contacto.metodoInicioId,
    );
    anterior?.asegurarQuePuedeReenviar(ahora, politicaCodigo);

    const codigo = this.generadorCodigo.generar();
    const nuevo = CodigoInicioSesion.emitir({
      id: this.generadorId.generar(),
      metodoInicioId: contacto.metodoInicioId,
      codigoHash: await this.hasher.hash(codigo),
      ahora,
      politica: politicaCodigo,
    });
    // Primero se envía y después se guarda: si el envío falla, no queda un código
    // guardado que obligue a esperar para pedir otro.
    await this.enviador.enviar({
      canal: contacto.canal,
      destino: contacto.destino.valor,
      codigo,
      proposito: 'ELIMINAR_CUENTA',
      vigenciaMinutos: politicaCodigo.vigenciaMinutos,
    });
    await this.cuentas.emitirCodigo(nuevo);

    return {
      solicitudId: contacto.metodoInicioId,
      canal: contacto.canal,
      destino: contacto.destino.enmascarado(),
      expiraEn: nuevo.expiraEn,
      puedeReenviarEn: nuevo.puedeReenviarEn(politicaCodigo),
    };
  }
}
