import { CodigoInicioSesion } from '../../domain/auth/codigo-inicio-sesion.js';
import {
  ContactoRequeridoError,
  CredencialesInvalidasError,
} from '../../domain/auth/errores.js';
import { InicioSesionRepository } from '../../domain/auth/inicio-sesion.repository.js';
import { CanalVerificacion } from '../../domain/auth/tipos.js';
import { Correo } from '../../domain/auth/value-objects/correo.js';
import { NumeroIdentificacion } from '../../domain/auth/value-objects/numero-identificacion.js';
import { Telefono } from '../../domain/auth/value-objects/telefono.js';
import { GeneradorId } from '../shared/generador-id.port.js';
import { Reloj } from '../shared/reloj.port.js';
import {
  EnviadorCodigo,
  GeneradorCodigo,
  HasherCodigo,
} from './codigo-verificacion.port.js';
import { ConfiguracionRegistro } from './configuracion-registro.js';

export interface SolicitarInicioSesionComando {
  numeroIdentificacion: string;
  /** Correo o celular, en el mismo campo: si tiene «@» es un correo. */
  contacto: string;
}

export interface InicioSesionSolicitado {
  /** Se envía al verificar el código. */
  solicitudId: string;
  canal: CanalVerificacion;
  /** Destino enmascarado para que el usuario sepa dónde buscar el código. */
  destino: string;
  expiraEn: Date;
  puedeReenviarEn: Date;
}

/**
 * HU-02, paso 1: si la identificación y el correo o celular son de la misma cuenta,
 * envía un código a ese contacto. Volver a llamarlo reenvía el código (con espera mínima).
 */
export class SolicitarInicioSesionUseCase {
  constructor(
    private readonly cuentas: InicioSesionRepository,
    private readonly generadorCodigo: GeneradorCodigo,
    private readonly hasher: HasherCodigo,
    private readonly enviador: EnviadorCodigo,
    private readonly generadorId: GeneradorId,
    private readonly reloj: Reloj,
    private readonly config: ConfiguracionRegistro,
  ) {}

  async ejecutar(
    comando: SolicitarInicioSesionComando,
  ): Promise<InicioSesionSolicitado> {
    const ahora = this.reloj.ahora();
    const { politicaCodigo } = this.config;

    const numero = NumeroIdentificacion.crear(comando.numeroIdentificacion);
    const cuenta = await this.cuentas.buscarCuenta(
      numero,
      leerContacto(comando.contacto),
    );
    if (!cuenta) throw new CredencialesInvalidasError();

    const anterior = await this.cuentas.ultimoCodigoSinUsar(
      cuenta.metodoInicioId,
    );
    anterior?.asegurarQuePuedeReenviar(ahora, politicaCodigo);

    const codigo = this.generadorCodigo.generar();
    const nuevo = CodigoInicioSesion.emitir({
      id: this.generadorId.generar(),
      metodoInicioId: cuenta.metodoInicioId,
      codigoHash: await this.hasher.hash(codigo),
      ahora,
      politica: politicaCodigo,
    });
    // Primero se envía y después se guarda: si el envío falla, no queda un código
    // guardado que obligue a esperar para pedir otro.
    await this.enviador.enviar({
      canal: cuenta.canal,
      destino: cuenta.destino.valor,
      codigo,
      proposito: 'INICIO_SESION',
      vigenciaMinutos: politicaCodigo.vigenciaMinutos,
    });
    await this.cuentas.emitirCodigo(nuevo);

    return {
      solicitudId: cuenta.metodoInicioId,
      canal: cuenta.canal,
      destino: cuenta.destino.enmascarado(),
      expiraEn: nuevo.expiraEn,
      puedeReenviarEn: nuevo.puedeReenviarEn(politicaCodigo),
    };
  }
}

function leerContacto(texto: string): Correo | Telefono {
  const valor = texto.trim();
  if (valor === '') throw new ContactoRequeridoError();
  return valor.includes('@') ? Correo.crear(valor) : Telefono.crear(valor);
}
