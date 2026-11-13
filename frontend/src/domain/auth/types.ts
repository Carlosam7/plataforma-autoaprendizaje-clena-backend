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
  solicitudId?: string;
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
  numeroIdentificacion: string;
  fechaNacimiento: string; // Formato AAAA-MM-DD
  correo?: string;
  telefono?: string;
  aceptaAvisoPrivacidad: boolean;
  canalVerificacion?: CanalVerificacion;
}

export interface SolicitudInicioSesion {
  numeroIdentificacion: string;
  contacto: string;
}

export interface VerificarInicioSesionParams {
  solicitudId: string;
  codigo: string;
}

export interface VerificarRegistroParams {
  registroId: string;
  codigo: string;
}
