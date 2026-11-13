import { CambioPasswordNoRequeridoError } from '../../domain/personal/errores.js';
import { CodigoPersonal } from '../../domain/personal/codigo-personal.js';
import { CodigoPersonalRepository } from '../../domain/personal/codigo-personal.repository.js';
import { PersonalRepository } from '../../domain/personal/personal.repository.js';
import {
  EnviadorCodigo,
  GeneradorCodigo,
  HasherCodigo,
} from '../auth/codigo-verificacion.port.js';
import { GeneradorId } from '../shared/generador-id.port.js';
import { Reloj } from '../shared/reloj.port.js';
import { buscarPersonalOFallar } from './buscar-personal.js';
import { ConfiguracionPersonal } from './configuracion-personal.js';

export interface CodigoPasswordEnviado {
  /** Correo enmascarado: c****@clena.org */
  destino: string;
  expiraEn: Date;
}

/**
 * HU-04: quien entra por primera vez con su contraseña temporal debe cambiarla.
 * Antes se verifica su identidad con un código enviado a su correo.
 */
export class SolicitarCodigoPasswordInicialUseCase {
  constructor(
    private readonly personal: PersonalRepository,
    private readonly codigos: CodigoPersonalRepository,
    private readonly generadorCodigo: GeneradorCodigo,
    private readonly hasherCodigo: HasherCodigo,
    private readonly enviador: EnviadorCodigo,
    private readonly generadorId: GeneradorId,
    private readonly reloj: Reloj,
    private readonly config: ConfiguracionPersonal,
  ) {}

  async ejecutar(personalId: string): Promise<CodigoPasswordEnviado> {
    const cuenta = await buscarPersonalOFallar(this.personal, personalId);
    if (!cuenta.debeCambiarPassword) throw new CambioPasswordNoRequeridoError();

    const ahora = this.reloj.ahora();
    const politica = this.config.politicaCodigo;
    const anterior = await this.codigos.ultimoSinUsar(
      cuenta.id,
      'CAMBIO_PASSWORD_INICIAL',
    );
    anterior?.asegurarQuePuedeReenviar(ahora, politica);

    const codigo = this.generadorCodigo.generar();
    const nuevo = CodigoPersonal.emitir({
      id: this.generadorId.generar(),
      personalId: cuenta.id,
      proposito: 'CAMBIO_PASSWORD_INICIAL',
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
      proposito: 'CAMBIO_PASSWORD_INICIAL',
      vigenciaMinutos: politica.vigenciaMinutos,
    });
    await this.codigos.emitir(nuevo);

    return { destino: cuenta.correo.enmascarado(), expiraEn: nuevo.expiraEn };
  }
}
