import { Consentimiento } from '../value-objects/consentimiento.js';
import { Correo } from '../value-objects/correo.js';
import { FechaNacimiento } from '../value-objects/fecha-nacimiento.js';
import { NombrePersona } from '../value-objects/nombre-persona.js';
import { NumeroIdentificacion } from '../value-objects/numero-identificacion.js';
import { Telefono } from '../value-objects/telefono.js';
import { EstadoUsuario, Rol } from '../tipos.js';

export interface UsuarioProps {
  id: string;
  nombre: NombrePersona;
  numeroIdentificacion: NumeroIdentificacion | null;
  fechaNacimiento: FechaNacimiento | null;
  telefono: Telefono | null;
  correo: Correo | null;
  rol: Rol;
  estado: EstadoUsuario;
  consentimiento: Consentimiento | null;
  creadoEn: Date;
}

export class Usuario {
  private constructor(private readonly props: UsuarioProps) {}

  /** Cuenta pública creada cuando el visitante verificó su código de registro. */
  static registrarPublico(datos: {
    id: string;
    nombre: NombrePersona;
    numeroIdentificacion: NumeroIdentificacion;
    fechaNacimiento: FechaNacimiento;
    telefono: Telefono | null;
    correo: Correo | null;
    consentimiento: Consentimiento;
    ahora: Date;
  }): Usuario {
    return new Usuario({
      id: datos.id,
      nombre: datos.nombre,
      numeroIdentificacion: datos.numeroIdentificacion,
      fechaNacimiento: datos.fechaNacimiento,
      telefono: datos.telefono,
      correo: datos.correo,
      rol: 'USUARIO_PUBLICO',
      estado: 'ACTIVO',
      consentimiento: datos.consentimiento,
      creadoEn: datos.ahora,
    });
  }

  static reconstituir(props: UsuarioProps): Usuario {
    return new Usuario({ ...props });
  }

  get id(): string {
    return this.props.id;
  }
  get nombre(): NombrePersona {
    return this.props.nombre;
  }
  get numeroIdentificacion(): NumeroIdentificacion | null {
    return this.props.numeroIdentificacion;
  }
  get fechaNacimiento(): FechaNacimiento | null {
    return this.props.fechaNacimiento;
  }
  get telefono(): Telefono | null {
    return this.props.telefono;
  }
  get correo(): Correo | null {
    return this.props.correo;
  }
  get rol(): Rol {
    return this.props.rol;
  }
  get estado(): EstadoUsuario {
    return this.props.estado;
  }
  get consentimiento(): Consentimiento | null {
    return this.props.consentimiento;
  }
  get creadoEn(): Date {
    return this.props.creadoEn;
  }
}
