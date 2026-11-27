export type RolPersonal = 'PERSONAL' | 'ADMINISTRADOR';

export interface Personal {
  id: string;
  nombre: string;
  correo: string;
  rol: RolPersonal;
  activo: boolean;
  debeCambiarPassword: boolean;
  ultimoAccesoEn: Date | null;
  creadoEn: Date;
}

export interface SolicitarInicioSesionPersonalComando {
  correo: string;
  password: string;
}

export interface InicioSesionPersonalSolicitado {
  /** Se envía de vuelta al verificar el código (C-09). */
  solicitudId: string;
  /** Correo enmascarado, p. ej. `a****@clena.example`. */
  destino: string;
  expiraEn: Date;
  /** Desde cuándo se puede pedir otro código. */
  puedeReenviarEn: Date;
  /** Segundos que faltan para poder pedir otro código, calculados de `puedeReenviarEn`. */
  reenviarEnSegundos: number;
  mensaje: string;
}

export interface VerificarInicioSesionPersonalComando {
  solicitudId: string;
  codigo: string;
}

export interface SesionPersonal {
  usuario: {
    id: string;
    nombre: string;
    rol: RolPersonal;
    debeCambiarPassword: boolean;
  };
  accessToken: string;
  /** Para renovar el token antes de que venza (dura 15 minutos). */
  accessTokenExpiraEn?: Date | string;
}

export interface CodigoPasswordEnviado {
  destino: string;
  expiraEn: Date;
  mensaje: string;
}

/** Mismos nombres que el DTO del backend (C-09): `{codigo, passwordNueva}`. */
export interface CambiarPasswordInicialComando {
  codigo: string;
  passwordNueva: string;
}

export interface CrearPersonalComando {
  nombre: string;
  correo: string;
  passwordTemporal: string;
  rol: RolPersonal;
}

export interface EditarPersonalComando {
  nombre?: string;
  correo?: string;
  rol?: RolPersonal;
}

export interface ListarPersonalCriterio {
  q?: string;
  rol?: RolPersonal;
  activo?: boolean;
  ordenarPor?: 'nombre' | 'correo' | 'creadoEn';
  direccion?: 'asc' | 'desc';
  pagina?: number;
  limite?: number;
}

export interface PersonalPaginado {
  datos: Personal[];
  total: number;
  pagina: number;
  limite: number;
}
