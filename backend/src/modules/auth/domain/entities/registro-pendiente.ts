import {
  CanalSinContactoError,
  CodigoExpiradoError,
  ContactoRequeridoError,
  IntentosAgotadosError,
  ReenvioMuyProntoError,
} from '../errores.js';
import { CanalVerificacion } from '../tipos.js';
import { Consentimiento } from '../value-objects/consentimiento.js';
import { Correo } from '../value-objects/correo.js';
import { FechaNacimiento } from '../value-objects/fecha-nacimiento.js';
import { NombrePersona } from '../value-objects/nombre-persona.js';
import { NumeroIdentificacion } from '../value-objects/numero-identificacion.js';
import { Telefono } from '../value-objects/telefono.js';
import { Usuario } from './usuario.js';

export interface PoliticaCodigo {
  /** Minutos que dura vigente un código. */
  vigenciaMinutos: number;
  /** Intentos fallidos permitidos antes de exigir un código nuevo. */
  maxIntentos: number;
  /** Segundos mínimos entre un envío y el siguiente, para no saturar al usuario ni al proveedor. */
  esperaReenvioSegundos: number;
}

export interface RegistroPendienteProps {
  id: string;
  nombre: NombrePersona;
  numeroIdentificacion: NumeroIdentificacion;
  fechaNacimiento: FechaNacimiento;
  telefono: Telefono | null;
  correo: Correo | null;
  consentimiento: Consentimiento;
  canal: CanalVerificacion;
  codigoHash: string;
  codigoEnviadoEn: Date;
  codigoExpiraEn: Date;
  intentosFallidos: number;
  creadoEn: Date;
}

/**
 * Solicitud de registro que espera la verificación del código enviado al correo o al celular.
 * La cuenta (`Usuario`) solo existe cuando el código se valida.
 */
export class RegistroPendiente {
  private constructor(private props: RegistroPendienteProps) {}

  static solicitar(datos: {
    id: string;
    nombre: NombrePersona;
    numeroIdentificacion: NumeroIdentificacion;
    fechaNacimiento: FechaNacimiento;
    telefono: Telefono | null;
    correo: Correo | null;
    consentimiento: Consentimiento;
    canalPreferido?: CanalVerificacion;
    codigoHash: string;
    ahora: Date;
    politica: PoliticaCodigo;
  }): RegistroPendiente {
    const canal = RegistroPendiente.resolverCanal(
      datos.telefono,
      datos.correo,
      datos.canalPreferido,
    );
    return new RegistroPendiente({
      id: datos.id,
      nombre: datos.nombre,
      numeroIdentificacion: datos.numeroIdentificacion,
      fechaNacimiento: datos.fechaNacimiento,
      telefono: datos.telefono,
      correo: datos.correo,
      consentimiento: datos.consentimiento,
      canal,
      codigoHash: datos.codigoHash,
      codigoEnviadoEn: datos.ahora,
      codigoExpiraEn: sumarMinutos(datos.ahora, datos.politica.vigenciaMinutos),
      intentosFallidos: 0,
      creadoEn: datos.ahora,
    });
  }

  static reconstituir(props: RegistroPendienteProps): RegistroPendiente {
    return new RegistroPendiente({ ...props });
  }

  /** Lanza un error si todavía no ha pasado la espera mínima desde el último envío. */
  asegurarQuePuedeReenviar(ahora: Date, politica: PoliticaCodigo): void {
    const transcurridos =
      (ahora.getTime() - this.props.codigoEnviadoEn.getTime()) / 1000;
    if (transcurridos < politica.esperaReenvioSegundos) {
      throw new ReenvioMuyProntoError(
        Math.ceil(politica.esperaReenvioSegundos - transcurridos),
      );
    }
  }

  /** Reemplaza el código por uno nuevo y reinicia los intentos. */
  renovarCodigo(
    codigoHash: string,
    ahora: Date,
    politica: PoliticaCodigo,
  ): void {
    this.asegurarQuePuedeReenviar(ahora, politica);
    this.props.codigoHash = codigoHash;
    this.props.codigoEnviadoEn = ahora;
    this.props.codigoExpiraEn = sumarMinutos(ahora, politica.vigenciaMinutos);
    this.props.intentosFallidos = 0;
  }

  /** Lanza un error si el código ya venció o se agotaron los intentos. */
  asegurarCodigoUtilizable(ahora: Date, politica: PoliticaCodigo): void {
    if (this.props.intentosFallidos >= politica.maxIntentos)
      throw new IntentosAgotadosError();
    if (ahora.getTime() >= this.props.codigoExpiraEn.getTime())
      throw new CodigoExpiradoError();
  }

  /** Registra un intento fallido y devuelve cuántos quedan. */
  registrarIntentoFallido(politica: PoliticaCodigo): number {
    this.props.intentosFallidos += 1;
    return Math.max(politica.maxIntentos - this.props.intentosFallidos, 0);
  }

  /** Crea la cuenta pública con los datos de esta solicitud. */
  confirmar(idUsuario: string, ahora: Date): Usuario {
    return Usuario.registrarPublico({
      id: idUsuario,
      nombre: this.props.nombre,
      numeroIdentificacion: this.props.numeroIdentificacion,
      fechaNacimiento: this.props.fechaNacimiento,
      telefono: this.props.telefono,
      correo: this.props.correo,
      consentimiento: this.props.consentimiento,
      ahora,
    });
  }

  /** Dirección (correo o celular) a la que se envía el código. */
  get destino(): Correo | Telefono {
    // `resolverCanal` garantiza que el contacto del canal elegido existe.
    return this.props.canal === 'CORREO'
      ? this.props.correo!
      : this.props.telefono!;
  }

  get id(): string {
    return this.props.id;
  }
  get nombre(): NombrePersona {
    return this.props.nombre;
  }
  get numeroIdentificacion(): NumeroIdentificacion {
    return this.props.numeroIdentificacion;
  }
  get fechaNacimiento(): FechaNacimiento {
    return this.props.fechaNacimiento;
  }
  get telefono(): Telefono | null {
    return this.props.telefono;
  }
  get correo(): Correo | null {
    return this.props.correo;
  }
  get consentimiento(): Consentimiento {
    return this.props.consentimiento;
  }
  get canal(): CanalVerificacion {
    return this.props.canal;
  }
  get codigoHash(): string {
    return this.props.codigoHash;
  }
  get codigoEnviadoEn(): Date {
    return this.props.codigoEnviadoEn;
  }
  get codigoExpiraEn(): Date {
    return this.props.codigoExpiraEn;
  }
  get intentosFallidos(): number {
    return this.props.intentosFallidos;
  }
  get creadoEn(): Date {
    return this.props.creadoEn;
  }

  private static resolverCanal(
    telefono: Telefono | null,
    correo: Correo | null,
    preferido?: CanalVerificacion,
  ): CanalVerificacion {
    if (!telefono && !correo) throw new ContactoRequeridoError();
    if (preferido === 'CORREO' && !correo)
      throw new CanalSinContactoError('CORREO');
    if (preferido === 'TELEFONO' && !telefono)
      throw new CanalSinContactoError('TELEFONO');
    if (preferido) return preferido;
    return correo ? 'CORREO' : 'TELEFONO';
  }
}

function sumarMinutos(fecha: Date, minutos: number): Date {
  return new Date(fecha.getTime() + minutos * 60_000);
}
