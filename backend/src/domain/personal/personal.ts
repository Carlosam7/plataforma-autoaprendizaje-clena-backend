import { Rol } from '../auth/tipos.js';
import { Correo } from '../auth/value-objects/correo.js';
import { NombrePersona } from '../auth/value-objects/nombre-persona.js';
import {
  AutoModificacionNoPermitidaError,
  CambioPasswordNoRequeridoError,
} from './errores.js';

export type RolPersonal = Extract<Rol, 'PERSONAL' | 'ADMINISTRADOR'>;
export const ROLES_PERSONAL: readonly RolPersonal[] = [
  'PERSONAL',
  'ADMINISTRADOR',
];

export interface PersonalProps {
  id: string;
  nombre: NombrePersona;
  correo: Correo;
  rol: RolPersonal;
  activo: boolean;
  debeCambiarPassword: boolean;
  passwordHash: string;
  creadoPorId: string | null;
  ultimoAccesoEn: Date | null;
  creadoEn: Date;
}

/**
 * Cuenta de un monitor o encargado del CLENA. Nunca se borra, solo se desactiva:
 * guías, solicitudes atendidas y demás registros históricos apuntan a ella.
 */
export class Personal {
  private constructor(private props: PersonalProps) {}

  /** Cuenta nueva creada por un administrador: activa y con contraseña temporal. */
  static crear(datos: {
    id: string;
    nombre: NombrePersona;
    correo: Correo;
    rol: RolPersonal;
    passwordHash: string;
    creadoPorId: string | null;
    ahora: Date;
  }): Personal {
    return new Personal({
      id: datos.id,
      nombre: datos.nombre,
      correo: datos.correo,
      rol: datos.rol,
      activo: true,
      debeCambiarPassword: true,
      passwordHash: datos.passwordHash,
      creadoPorId: datos.creadoPorId,
      ultimoAccesoEn: null,
      creadoEn: datos.ahora,
    });
  }

  static reconstituir(props: PersonalProps): Personal {
    return new Personal({ ...props });
  }

  editar(
    cambios: { nombre?: NombrePersona; correo?: Correo; rol?: RolPersonal },
    actorId: string,
  ): void {
    if (cambios.rol && cambios.rol !== this.props.rol && actorId === this.id) {
      throw new AutoModificacionNoPermitidaError('cambiar el rol');
    }
    if (cambios.nombre) this.props.nombre = cambios.nombre;
    if (cambios.correo) this.props.correo = cambios.correo;
    if (cambios.rol) this.props.rol = cambios.rol;
  }

  /** Ya no puede iniciar sesión; sus registros históricos se conservan. */
  desactivar(actorId: string): void {
    if (actorId === this.id) {
      throw new AutoModificacionNoPermitidaError('desactivar');
    }
    this.props.activo = false;
  }

  reactivar(): void {
    this.props.activo = true;
  }

  registrarAcceso(ahora: Date): void {
    this.props.ultimoAccesoEn = ahora;
  }

  /** Reemplaza la contraseña temporal por la que eligió su dueño. */
  cambiarPasswordInicial(passwordHash: string): void {
    if (!this.props.debeCambiarPassword) {
      throw new CambioPasswordNoRequeridoError();
    }
    this.props.passwordHash = passwordHash;
    this.props.debeCambiarPassword = false;
  }

  get id(): string {
    return this.props.id;
  }
  get nombre(): NombrePersona {
    return this.props.nombre;
  }
  get correo(): Correo {
    return this.props.correo;
  }
  get rol(): RolPersonal {
    return this.props.rol;
  }
  get activo(): boolean {
    return this.props.activo;
  }
  get debeCambiarPassword(): boolean {
    return this.props.debeCambiarPassword;
  }
  get passwordHash(): string {
    return this.props.passwordHash;
  }
  get creadoPorId(): string | null {
    return this.props.creadoPorId;
  }
  get ultimoAccesoEn(): Date | null {
    return this.props.ultimoAccesoEn;
  }
  get creadoEn(): Date {
    return this.props.creadoEn;
  }
}
