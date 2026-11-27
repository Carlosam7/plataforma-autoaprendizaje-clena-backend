import type {
  AuthSession,
  AvisoPrivacidad,
  CanalVerificacion,
  CodigoEnviado,
  ConfirmarEliminacionParams,
  EliminacionSolicitada,
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
  /** HU-05: envía un código para confirmar; todavía no borra nada. */
  solicitarEliminacionCuenta(
    canal?: CanalVerificacion,
  ): Promise<EliminacionSolicitada>;
  /** HU-05: borra la cuenta y olvida la sesión en este navegador. No se puede deshacer. */
  confirmarEliminacionCuenta(params: ConfirmarEliminacionParams): Promise<void>;
}
