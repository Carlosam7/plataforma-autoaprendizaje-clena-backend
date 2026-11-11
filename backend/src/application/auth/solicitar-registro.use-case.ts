import { AvisoPrivacidadRepository } from '../../domain/auth/aviso-privacidad.repository.js';
import {
  AvisoPrivacidadNoDisponibleError,
  CorreoEnUsoError,
  IdentificacionYaRegistradaError,
  TelefonoEnUsoError,
} from '../../domain/auth/errores.js';
import { RegistroPendiente } from '../../domain/auth/registro-pendiente.js';
import { RegistroPendienteRepository } from '../../domain/auth/registro-pendiente.repository.js';
import { CanalVerificacion } from '../../domain/auth/tipos.js';
import { UsuarioRepository } from '../../domain/auth/usuario.repository.js';
import {
  Consentimiento,
  ConsentimientoRequeridoError,
} from '../../domain/auth/value-objects/consentimiento.js';
import { Correo } from '../../domain/auth/value-objects/correo.js';
import { FechaNacimiento } from '../../domain/auth/value-objects/fecha-nacimiento.js';
import { NombrePersona } from '../../domain/auth/value-objects/nombre-persona.js';
import { NumeroIdentificacion } from '../../domain/auth/value-objects/numero-identificacion.js';
import { Telefono } from '../../domain/auth/value-objects/telefono.js';
import { GeneradorId } from '../shared/generador-id.port.js';
import { Reloj } from '../shared/reloj.port.js';
import {
  EnviadorCodigo,
  GeneradorCodigo,
  HasherCodigo,
} from './codigo-verificacion.port.js';
import {
  CodigoEnviadoResultado,
  resultadoCodigoEnviado,
} from './codigo-enviado.js';
import { ConfiguracionRegistro } from './configuracion-registro.js';

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
 * al correo o al celular. La cuenta queda activa al verificar el código.
 */
export class SolicitarRegistroUseCase {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly registros: RegistroPendienteRepository,
    private readonly avisos: AvisoPrivacidadRepository,
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

    // Sin consentimiento no se hace nada más, ni siquiera consultar el aviso.
    if (!comando.aceptaAvisoPrivacidad)
      throw new ConsentimientoRequeridoError();
    const aviso = await this.avisos.vigente(ahora);
    if (!aviso) throw new AvisoPrivacidadNoDisponibleError();
    const consentimiento = Consentimiento.otorgar(true, aviso.version, ahora);

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

    await this.liberarContacto(telefono, numeroIdentificacion, ahora);
    await this.liberarContacto(correo, numeroIdentificacion, ahora);

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

  /**
   * Si otra persona dejó un registro sin terminar con este correo o celular, el dato se
   * libera cuando su código ya venció; si todavía puede verificarlo, el dato está en uso.
   */
  private async liberarContacto(
    contacto: Telefono | Correo | null,
    numero: NumeroIdentificacion,
    ahora: Date,
  ): Promise<void> {
    if (!contacto) return;
    const otro = await this.registros.buscarPorContacto(contacto);
    if (!otro || otro.numeroIdentificacion.igualA(numero)) return;
    if (!otro.estaAbandonado(ahora)) {
      throw contacto instanceof Telefono
        ? new TelefonoEnUsoError()
        : new CorreoEnUsoError();
    }
    await this.registros.eliminar(otro.id);
  }
}

function textoPresente(valor: string | undefined): boolean {
  return valor !== undefined && valor.trim() !== '';
}
