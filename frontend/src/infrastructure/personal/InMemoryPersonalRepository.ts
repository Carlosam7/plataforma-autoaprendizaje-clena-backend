import type { PersonalRepository } from '@/application/personal/ports';
import {
  AccesoDenegadoPersonalError,
  CodigoPersonalExpiradoError,
  CodigoPersonalInvalidoError,
  CorreoEnUsoError,
  CredencialesIncorrectasError,
} from '@/domain/personal/errors';
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

const STORAGE_KEY_PERSONAL_SESION = 'kama_personal_session';

interface CodigoPendiente {
  codigo: string;
  expiraEn: number;
}

export class InMemoryPersonalRepository implements PersonalRepository {
  private cuentas: Map<string, Personal & { passwordHash: string }> = new Map();
  private codigosLogin: Map<string, CodigoPendiente> = new Map();
  private codigosPassword: Map<string, CodigoPendiente> = new Map();
  private sesionActual: SesionPersonal | null = null;

  constructor() {
    // Admin inicial por defecto para desarrollo / pruebas
    this.cuentas.set('admin-1', {
      id: 'admin-1',
      nombre: 'Administrador CLENA',
      correo: 'admin@clena.org',
      rol: 'ADMINISTRADOR',
      activo: true,
      debeCambiarPassword: false,
      ultimoAccesoEn: new Date(),
      creadoEn: new Date('2026-11-01'),
      passwordHash: 'Admin1234',
    });

    // Monitor inicial
    this.cuentas.set('personal-1', {
      id: 'personal-1',
      nombre: 'Carlos Monitor',
      correo: 'carlos.monitor@clena.org',
      rol: 'PERSONAL',
      activo: true,
      debeCambiarPassword: true,
      ultimoAccesoEn: null,
      creadoEn: new Date('2026-11-05'),
      passwordHash: 'Temporal2026',
    });
  }

  async solicitarInicioSesion(
    comando: SolicitarInicioSesionPersonalComando,
  ): Promise<InicioSesionPersonalSolicitado> {
    const cuenta = Array.from(this.cuentas.values()).find(
      (c) => c.correo.toLowerCase() === comando.correo.toLowerCase(),
    );

    if (!cuenta || !cuenta.activo || cuenta.passwordHash !== comando.password) {
      throw new CredencialesIncorrectasError('Credenciales incorrectas');
    }

    const codigo = '123456';
    const expiraEn = new Date(Date.now() + 10 * 60 * 1000);
    this.codigosLogin.set(cuenta.correo.toLowerCase(), {
      codigo,
      expiraEn: expiraEn.getTime(),
    });

    const [u, d] = cuenta.correo.split('@');
    const destinoOfuscado = `${u.slice(0, 2)}****@${d}`;

    return {
      destino: destinoOfuscado,
      expiraEn,
      reenviarEnSegundos: 60,
      mensaje: `Te enviamos un código a ${destinoOfuscado}. Escríbelo para entrar.`,
    };
  }

  async verificarInicioSesion(
    comando: VerificarInicioSesionPersonalComando,
  ): Promise<SesionPersonal> {
    const cuenta = Array.from(this.cuentas.values()).find((c) => {
      const [u, d] = c.correo.split('@');
      const destino = `${u.slice(0, 2)}****@${d}`;
      return (
        destino === comando.destino ||
        c.correo.toLowerCase() === comando.destino.toLowerCase()
      );
    });

    if (!cuenta) {
      throw new CredencialesIncorrectasError('Credenciales incorrectas');
    }

    const pendiente = this.codigosLogin.get(cuenta.correo.toLowerCase());
    if (!pendiente || pendiente.codigo !== comando.codigo) {
      throw new CodigoPersonalInvalidoError('Código incorrecto');
    }

    if (Date.now() > pendiente.expiraEn) {
      throw new CodigoPersonalExpiradoError('El código venció');
    }

    cuenta.ultimoAccesoEn = new Date();
    this.codigosLogin.delete(cuenta.correo.toLowerCase());

    const sesion: SesionPersonal = {
      usuario: {
        id: cuenta.id,
        nombre: cuenta.nombre,
        rol: cuenta.rol,
        debeCambiarPassword: cuenta.debeCambiarPassword,
      },
      accessToken: `mock-token-${cuenta.id}`,
    };

    return sesion;
  }

  async solicitarCodigoPasswordInicial(
    token: string,
  ): Promise<CodigoPasswordEnviado> {
    const cuenta = this.obtenerCuentaPorToken(token);
    const codigo = '654321';
    const expiraEn = new Date(Date.now() + 10 * 60 * 1000);

    this.codigosPassword.set(cuenta.id, {
      codigo,
      expiraEn: expiraEn.getTime(),
    });

    const [u, d] = cuenta.correo.split('@');
    const destinoOfuscado = `${u.slice(0, 2)}****@${d}`;

    return {
      destino: destinoOfuscado,
      expiraEn,
      mensaje: `Te enviamos un código a ${destinoOfuscado}. Escríbelo para cambiar tu contraseña.`,
    };
  }

  async cambiarPasswordInicial(
    token: string,
    comando: CambiarPasswordInicialComando,
  ): Promise<void> {
    const cuenta = this.obtenerCuentaPorToken(token);
    const pendiente = this.codigosPassword.get(cuenta.id);

    if (!pendiente || pendiente.codigo !== comando.codigo) {
      throw new CodigoPersonalInvalidoError('Código incorrecto');
    }
    if (Date.now() > pendiente.expiraEn) {
      throw new CodigoPersonalExpiradoError('El código venció');
    }

    cuenta.passwordHash = comando.nuevoPassword;
    cuenta.debeCambiarPassword = false;
    this.codigosPassword.delete(cuenta.id);
  }

  async listarPersonal(
    token: string,
    criterio?: ListarPersonalCriterio,
  ): Promise<PersonalPaginado> {
    this.validarAdmin(token);

    let lista = Array.from(this.cuentas.values()).map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ passwordHash, ...personal }) => personal,
    );

    if (criterio?.q) {
      const q = criterio.q.toLowerCase();
      lista = lista.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.correo.toLowerCase().includes(q),
      );
    }

    if (criterio?.rol) {
      lista = lista.filter((p) => p.rol === criterio.rol);
    }

    if (criterio?.activo !== undefined) {
      lista = lista.filter((p) => p.activo === criterio.activo);
    }

    return {
      datos: lista,
      total: lista.length,
      pagina: criterio?.pagina ?? 1,
      limite: criterio?.limite ?? 50,
    };
  }

  async crearPersonal(
    token: string,
    comando: CrearPersonalComando,
  ): Promise<Personal> {
    this.validarAdmin(token);

    const existe = Array.from(this.cuentas.values()).some(
      (c) => c.correo.toLowerCase() === comando.correo.toLowerCase(),
    );
    if (existe) {
      throw new CorreoEnUsoError('Correo en uso');
    }

    const id = `personal-${Date.now()}`;
    const nuevo: Personal & { passwordHash: string } = {
      id,
      nombre: comando.nombre,
      correo: comando.correo,
      rol: comando.rol,
      activo: true,
      debeCambiarPassword: true,
      ultimoAccesoEn: null,
      creadoEn: new Date(),
      passwordHash: comando.passwordTemporal,
    };

    this.cuentas.set(id, nuevo);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...personal } = nuevo;
    return personal;
  }

  async obtenerPersonal(token: string, id: string): Promise<Personal> {
    this.validarAdmin(token);
    const c = this.cuentas.get(id);
    if (!c) throw new Error('Personal no encontrado');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...personal } = c;
    return personal;
  }

  async editarPersonal(
    token: string,
    id: string,
    comando: EditarPersonalComando,
  ): Promise<Personal> {
    this.validarAdmin(token);
    const c = this.cuentas.get(id);
    if (!c) throw new Error('Personal no encontrado');

    if (comando.correo && comando.correo !== c.correo) {
      const existe = Array.from(this.cuentas.values()).some(
        (otra) =>
          otra.id !== id &&
          otra.correo.toLowerCase() === comando.correo!.toLowerCase(),
      );
      if (existe) throw new CorreoEnUsoError('Correo en uso');
      c.correo = comando.correo;
    }

    if (comando.nombre) c.nombre = comando.nombre;
    if (comando.rol) c.rol = comando.rol;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...personal } = c;
    return personal;
  }

  async desactivarPersonal(token: string, id: string): Promise<Personal> {
    this.validarAdmin(token);
    const c = this.cuentas.get(id);
    if (!c) throw new Error('Personal no encontrado');
    c.activo = false;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...personal } = c;
    return personal;
  }

  async reactivarPersonal(token: string, id: string): Promise<Personal> {
    this.validarAdmin(token);
    const c = this.cuentas.get(id);
    if (!c) throw new Error('Personal no encontrado');
    c.activo = true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...personal } = c;
    return personal;
  }

  async obtenerSesionPersonal(): Promise<SesionPersonal | null> {
    if (this.sesionActual) return this.sesionActual;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PERSONAL_SESION);
      if (!raw) return null;
      return JSON.parse(raw) as SesionPersonal;
    } catch {
      return null;
    }
  }

  async guardarSesionPersonal(sesion: SesionPersonal): Promise<void> {
    this.sesionActual = sesion;
    try {
      localStorage.setItem(STORAGE_KEY_PERSONAL_SESION, JSON.stringify(sesion));
    } catch {
      // Ignorar fallo de almacenamiento
    }
  }

  async cerrarSesionPersonal(): Promise<void> {
    this.sesionActual = null;
    try {
      localStorage.removeItem(STORAGE_KEY_PERSONAL_SESION);
    } catch {
      // Ignorar fallo de almacenamiento
    }
  }

  private obtenerCuentaPorToken(
    token: string,
  ): Personal & { passwordHash: string } {
    const id = token.replace('mock-token-', '');
    const c = this.cuentas.get(id);
    if (!c) throw new AccesoDenegadoPersonalError('Sin sesión válida');
    return c;
  }

  private validarAdmin(token: string): void {
    const c = this.obtenerCuentaPorToken(token);
    if (c.rol !== 'ADMINISTRADOR') {
      throw new AccesoDenegadoPersonalError();
    }
  }
}
