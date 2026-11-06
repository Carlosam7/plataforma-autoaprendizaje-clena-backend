import { GeneradorId } from '../../../../shared/application/generador-id.port.js';
import { Reloj } from '../../../../shared/application/reloj.port.js';
import { RegistroPendiente } from '../../domain/entities/registro-pendiente.js';
import {
  CorreoEnUsoError,
  IdentificacionYaRegistradaError,
  TelefonoEnUsoError,
} from '../../domain/errores.js';
import { RegistroPendienteRepository } from '../../domain/repositories/registro-pendiente.repository.js';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository.js';
import { CanalVerificacion } from '../../domain/tipos.js';
import { Consentimiento } from '../../domain/value-objects/consentimiento.js';
import { Correo } from '../../domain/value-objects/correo.js';
import { FechaNacimiento } from '../../domain/value-objects/fecha-nacimiento.js';
import { NombrePersona } from '../../domain/value-objects/nombre-persona.js';
import { NumeroIdentificacion } from '../../domain/value-objects/numero-identificacion.js';
import { Telefono } from '../../domain/value-objects/telefono.js';
import { ConfiguracionRegistro } from '../configuracion-registro.js';
import {
  EnviadorCodigo,
  GeneradorCodigo,
  HasherCodigo,
} from '../ports/codigo-verificacion.port.js';
import {
  CodigoEnviadoResultado,
  resultadoCodigoEnviado,
} from './codigo-enviado.js';

export interface SolicitarRegistroComando {
  nombre: string;
  numeroIdentificacion: string;
  /** AAAA-MM-DD */
  fechaNacimiento: string;
  telefono?: string;
  correo?: string;
  aceptaAvisoPrivacidad: boolean;
  canalVerificacion?: CanalVerificacion;
}

/**
 * HU-01, paso 1: valida los datos, verifica que no estén en uso y envía un código
 * al correo o al celular. La cuenta se crea al verificar el código.
 */
export class SolicitarRegistroUseCase {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly registros: RegistroPendienteRepository,
    private readonly generadorCodigo: GeneradorCodigo,
    private readonly hasher: HasherCodigo,
    private readonly enviador: EnviadorCodigo,
    private readonly generadorId: GeneradorId,
    private readonly reloj: Reloj,
    private readonly config: ConfiguracionRegistro,
  ) {}

  async ejecutar(
    comando: SolicitarRegistroComando,
  ): Promise<CodigoEnviadoResultado> {
    const ahora = this.reloj.ahora();
    const { politicaCodigo } = this.config;

    const consentimiento = Consentimiento.otorgar(
      comando.aceptaAvisoPrivacidad,
      this.config.versionAvisoPrivacidad,
      ahora,
    );
    const nombre = NombrePersona.crear(comando.nombre);
    const numeroIdentificacion = NumeroIdentificacion.crear(
      comando.numeroIdentificacion,
    );
    const fechaNacimiento = FechaNacimiento.desdeTexto(
      comando.fechaNacimiento,
      ahora,
    );
    const telefono = textoPresente(comando.telefono)
      ? Telefono.crear(comando.telefono!)
      : null;
    const correo = textoPresente(comando.correo)
      ? Correo.crear(comando.correo!)
      : null;

    await this.asegurarDatosDisponibles(numeroIdentificacion, telefono, correo);

    // Si la persona ya había empezado el registro, se reemplaza su solicitud anterior
    // (conservando el id) y se respeta la espera mínima entre envíos.
    const anterior =
      await this.registros.buscarPorIdentificacion(numeroIdentificacion);
    anterior?.asegurarQuePuedeReenviar(ahora, politicaCodigo);

    const codigo = this.generadorCodigo.generar();
    const registro = RegistroPendiente.solicitar({
      id: anterior?.id ?? this.generadorId.generar(),
      nombre,
      numeroIdentificacion,
      fechaNacimiento,
      telefono,
      correo,
      consentimiento,
      canalPreferido: comando.canalVerificacion,
      codigoHash: await this.hasher.hash(codigo),
      ahora,
      politica: politicaCodigo,
    });

    await this.registros.guardar(registro);
    await this.enviador.enviar({
      canal: registro.canal,
      destino: registro.destino.valor,
      codigo,
      proposito: 'REGISTRO',
      vigenciaMinutos: politicaCodigo.vigenciaMinutos,
    });

    return resultadoCodigoEnviado(
      registro,
      politicaCodigo.esperaReenvioSegundos,
    );
  }

  /** El orden de las verificaciones define qué mensaje ve el usuario si hay varios conflictos. */
  private async asegurarDatosDisponibles(
    numero: NumeroIdentificacion,
    telefono: Telefono | null,
    correo: Correo | null,
  ): Promise<void> {
    if (await this.usuarios.existePorIdentificacion(numero)) {
      throw new IdentificacionYaRegistradaError();
    }
    if (telefono && (await this.usuarios.existePorTelefono(telefono))) {
      throw new TelefonoEnUsoError();
    }
    if (correo && (await this.usuarios.existePorCorreo(correo))) {
      throw new CorreoEnUsoError();
    }
  }
}

function textoPresente(valor: string | undefined): boolean {
  return valor !== undefined && valor.trim() !== '';
}
