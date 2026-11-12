export interface Usuario {
  nombre: string;
  rol: 'USUARIO_PUBLICO' | 'PERSONAL' | 'ADMINISTRADOR' | string;
}

export interface AuthSession {
  usuario: Usuario;
  accessToken: string;
  accessTokenExpiraEn?: Date | string;
  refreshTokenExpiraEn?: Date | string;
}

export type CanalVerificacion = 'CORREO' | 'TELEFONO';

export interface CodigoEnviado {
  registroId: string;
  canal: CanalVerificacion;
  destino: string;
  mensaje: string;
  expiraEn: Date;
  puedeReenviarEn: Date;
}

export interface AvisoPrivacidad {
  version: string;
  contenido: string;
  vigenteDesde: Date;
}

export interface SolicitudRegistro {
  nombre: string;
  correo?: string;
  telefono?: string;
  numeroIdentificacion?: string;
  fechaNacimiento?: string;
  aceptaAvisoPrivacidad?: boolean;
  canalVerificacion?: CanalVerificacion;
}

export interface SolicitudInicioSesion {
  correo: string;
}

export interface VerificarRegistroParams {
  registroId: string;
  codigo: string;
}
