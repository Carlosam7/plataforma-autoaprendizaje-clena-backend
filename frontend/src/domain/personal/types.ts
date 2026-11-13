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
  destino: string;
  expiraEn: Date;
  reenviarEnSegundos: number;
  mensaje: string;
}

export interface VerificarInicioSesionPersonalComando {
  destino: string;
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
}

export interface CodigoPasswordEnviado {
  destino: string;
  expiraEn: Date;
  mensaje: string;
}

export interface CambiarPasswordInicialComando {
  codigo: string;
  nuevoPassword: string;
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
