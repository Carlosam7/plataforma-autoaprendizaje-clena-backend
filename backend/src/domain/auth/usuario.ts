import { Consentimiento } from './value-objects/consentimiento.js';
import { Correo } from './value-objects/correo.js';
import { FechaNacimiento } from './value-objects/fecha-nacimiento.js';
import { NombrePersona } from './value-objects/nombre-persona.js';
import { NumeroIdentificacion } from './value-objects/numero-identificacion.js';
import { Telefono } from './value-objects/telefono.js';
import { Rol } from './tipos.js';

export interface UsuarioProps {
  numeroIdentificacion: NumeroIdentificacion;
  nombre: NombrePersona;
  fechaNacimiento: FechaNacimiento;
  telefono: Telefono | null;
  correo: Correo | null;
  consentimiento: Consentimiento;
  creadoEn: Date;
}

/**
 * Cuenta de un visitante de la Sala de Internet (usuario público) que ya verificó
 * su correo o su celular. Su identificador es el número de identificación.
 */
export class Usuario {
  readonly rol: Rol = 'USUARIO_PUBLICO';

  private constructor(private readonly props: UsuarioProps) {}

  static reconstituir(props: UsuarioProps): Usuario {
    return new Usuario({ ...props });
  }

  get id(): string {
    return this.props.numeroIdentificacion.valor;
  }
  get numeroIdentificacion(): NumeroIdentificacion {
    return this.props.numeroIdentificacion;
  }
  get nombre(): NombrePersona {
    return this.props.nombre;
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
  get creadoEn(): Date {
    return this.props.creadoEn;
  }
}
