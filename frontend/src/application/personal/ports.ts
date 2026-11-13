import type {
  CambiarPasswordInicialComando,
  CodigoPasswordEnviado,
  CrearPersonalComando,
  EditarPersonalComando,
  InicioSesionPersonalSolicitado,
  ListarPersonalCriterio,
  Personal,
  PersonalPaginado,
  SesionPersonal,
  SolicitarInicioSesionPersonalComando,
  VerificarInicioSesionPersonalComando,
} from '@/domain/personal/types';

export interface PersonalRepository {
  solicitarInicioSesion(
    comando: SolicitarInicioSesionPersonalComando,
  ): Promise<InicioSesionPersonalSolicitado>;

  verificarInicioSesion(
    comando: VerificarInicioSesionPersonalComando,
  ): Promise<SesionPersonal>;

  solicitarCodigoPasswordInicial(token: string): Promise<CodigoPasswordEnviado>;

  cambiarPasswordInicial(
    token: string,
    comando: CambiarPasswordInicialComando,
  ): Promise<void>;

  listarPersonal(
    token: string,
    criterio?: ListarPersonalCriterio,
  ): Promise<PersonalPaginado>;

  crearPersonal(
    token: string,
    comando: CrearPersonalComando,
  ): Promise<Personal>;

  obtenerPersonal(token: string, id: string): Promise<Personal>;

  editarPersonal(
    token: string,
    id: string,
    comando: EditarPersonalComando,
  ): Promise<Personal>;

  desactivarPersonal(token: string, id: string): Promise<Personal>;

  reactivarPersonal(token: string, id: string): Promise<Personal>;

  obtenerSesionPersonal(): Promise<SesionPersonal | null>;
  guardarSesionPersonal(sesion: SesionPersonal): Promise<void>;
  cerrarSesionPersonal(): Promise<void>;
}
