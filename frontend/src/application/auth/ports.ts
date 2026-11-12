import type {
  AuthSession,
  AvisoPrivacidad,
  CodigoEnviado,
  SolicitudRegistro,
  VerificarRegistroParams,
} from '@/domain/auth/types';

export interface AuthRepository {
  obtenerAvisoPrivacidad(): Promise<AvisoPrivacidad>;
  solicitarRegistro(datos: SolicitudRegistro): Promise<CodigoEnviado>;
  solicitarInicioSesion(correo: string): Promise<CodigoEnviado>;
  verificarRegistro(params: VerificarRegistroParams): Promise<AuthSession>;
  reenviarCodigo(registroId: string): Promise<CodigoEnviado>;
  obtenerSesion(): Promise<AuthSession | null>;
  guardarSesion(sesion: AuthSession): Promise<void>;
  cerrarSesion(): Promise<void>;
}
