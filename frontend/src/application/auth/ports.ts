import type {
  AuthSession,
  AvisoPrivacidad,
  CodigoEnviado,
  SolicitudInicioSesion,
  SolicitudRegistro,
  VerificarInicioSesionParams,
  VerificarRegistroParams,
} from '@/domain/auth/types';

export interface AuthRepository {
  obtenerAvisoPrivacidad(): Promise<AvisoPrivacidad>;
  solicitarRegistro(datos: SolicitudRegistro): Promise<CodigoEnviado>;
  solicitarInicioSesion(datos: SolicitudInicioSesion): Promise<CodigoEnviado>;
  verificarRegistro(params: VerificarRegistroParams): Promise<AuthSession>;
  verificarInicioSesion(
    params: VerificarInicioSesionParams,
  ): Promise<AuthSession>;
  reenviarCodigo(registroId: string): Promise<CodigoEnviado>;
  obtenerSesion(): Promise<AuthSession | null>;
  guardarSesion(sesion: AuthSession): Promise<void>;
  renovarSesion?(): Promise<AuthSession>;
  cerrarSesion(): Promise<void>;
}
