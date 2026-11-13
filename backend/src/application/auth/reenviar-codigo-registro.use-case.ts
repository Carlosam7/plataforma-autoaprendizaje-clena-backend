import { Reloj } from '../shared/reloj.port.js';
import { RegistroNoEncontradoError } from '../../domain/auth/errores.js';
import { RegistroPendienteRepository } from '../../domain/auth/registro-pendiente.repository.js';
import { ConfiguracionRegistro } from './configuracion-registro.js';
import {
  EnviadorCodigo,
  GeneradorCodigo,
  HasherCodigo,
} from './codigo-verificacion.port.js';
import {
  CodigoEnviadoResultado,
  resultadoCodigoEnviado,
} from './codigo-enviado.js';

export class ReenviarCodigoRegistroUseCase {
  constructor(
    private readonly registros: RegistroPendienteRepository,
    private readonly generadorCodigo: GeneradorCodigo,
    private readonly hasher: HasherCodigo,
    private readonly enviador: EnviadorCodigo,
    private readonly reloj: Reloj,
    private readonly config: ConfiguracionRegistro,
  ) {}

  async ejecutar(comando: {
    registroId: string;
  }): Promise<CodigoEnviadoResultado> {
    const { politicaCodigo } = this.config;
    const registro = await this.registros.buscarPorId(comando.registroId);
    if (!registro) throw new RegistroNoEncontradoError();

    const codigo = this.generadorCodigo.generar();
    registro.renovarCodigo(
      await this.hasher.hash(codigo),
      this.reloj.ahora(),
      politicaCodigo,
    );

    // Primero se envía y después se guarda: si el envío falla, no queda un código
    // guardado que obligue a esperar para pedir otro.
    await this.enviador.enviar({
      canal: registro.canal,
      destino: registro.destino.valor,
      codigo,
      proposito: 'REGISTRO',
      vigenciaMinutos: politicaCodigo.vigenciaMinutos,
    });
    await this.registros.guardar(registro);

    return resultadoCodigoEnviado(
      registro,
      politicaCodigo.esperaReenvioSegundos,
    );
  }
}
