import { beforeEach, describe, expect, it } from 'vitest';
import { CambiarPasswordInicial } from './CambiarPasswordInicial';
import { CrearPersonal } from './CrearPersonal';
import { DesactivarPersonal } from './DesactivarPersonal';
import { ListarPersonal } from './ListarPersonal';
import { ReactivarPersonal } from './ReactivarPersonal';
import { SolicitarInicioSesionPersonal } from './SolicitarInicioSesionPersonal';
import { VerificarInicioSesionPersonal } from './VerificarInicioSesionPersonal';
import { InMemoryPersonalRepository } from '@/infrastructure/personal/InMemoryPersonalRepository';
import {
  AccesoDenegadoPersonalError,
  CodigoPersonalInvalidoError,
  CorreoEnUsoError,
  CredencialesIncorrectasError,
  PasswordDebilError,
} from '@/domain/personal/errors';

describe('Gestión y Autenticación del Personal del CLENA (HU-04, HU-06)', () => {
  let repo: InMemoryPersonalRepository;
  let solicitarLogin: SolicitarInicioSesionPersonal;
  let verificarLogin: VerificarInicioSesionPersonal;
  let cambiarPassword: CambiarPasswordInicial;
  let listarPersonal: ListarPersonal;
  let crearPersonal: CrearPersonal;
  let desactivarPersonal: DesactivarPersonal;
  let reactivarPersonal: ReactivarPersonal;

  beforeEach(() => {
    repo = new InMemoryPersonalRepository();
    solicitarLogin = new SolicitarInicioSesionPersonal(repo);
    verificarLogin = new VerificarInicioSesionPersonal(repo);
    cambiarPassword = new CambiarPasswordInicial(repo);
    listarPersonal = new ListarPersonal(repo);
    crearPersonal = new CrearPersonal(repo);
    desactivarPersonal = new DesactivarPersonal(repo);
    reactivarPersonal = new ReactivarPersonal(repo);
  });

  describe('HU-06 · Iniciar sesión como personal del CLENA', () => {
    it('solicita código de verificación con credenciales válidas', async () => {
      const res = await solicitarLogin.ejecutar({
        correo: 'admin@clena.org',
        password: 'Admin1234',
      });
      expect(res.destino).toContain('ad****@clena.org');
      expect(res.mensaje).toContain('Te enviamos un código');
    });

    it('falla con mensaje genérico si las credenciales son incorrectas (AC-HU06-02)', async () => {
      await expect(
        solicitarLogin.ejecutar({
          correo: 'admin@clena.org',
          password: 'ClaveIncorrecta',
        }),
      ).rejects.toThrow(CredencialesIncorrectasError);
    });

    it('completa login con código de 6 dígitos correcto', async () => {
      const sol = await solicitarLogin.ejecutar({
        correo: 'admin@clena.org',
        password: 'Admin1234',
      });

      const sesion = await verificarLogin.ejecutar({
        destino: sol.destino,
        codigo: '123456',
      });

      expect(sesion.usuario.nombre).toBe('Administrador CLENA');
      expect(sesion.usuario.rol).toBe('ADMINISTRADOR');
      expect(sesion.accessToken).toBeDefined();
    });

    it('rechaza código inválido', async () => {
      const sol = await solicitarLogin.ejecutar({
        correo: 'admin@clena.org',
        password: 'Admin1234',
      });

      await expect(
        verificarLogin.ejecutar({
          destino: sol.destino,
          codigo: '000000',
        }),
      ).rejects.toThrow(CodigoPersonalInvalidoError);
    });
  });

  describe('HU-04 · Cambio obligatorio de contraseña temporal', () => {
    it('permite cambiar contraseña con código y contraseña segura', async () => {
      const token = 'mock-token-personal-1';
      await repo.solicitarCodigoPasswordInicial(token);

      await cambiarPassword.ejecutar(token, {
        codigo: '654321',
        nuevoPassword: 'NuevaClaveSegura2026',
      });

      const cuenta = await repo.obtenerPersonal(
        'mock-token-admin-1',
        'personal-1',
      );
      expect(cuenta.debeCambiarPassword).toBe(false);
    });

    it('rechaza contraseña débil (sin números o menor a 8 caracteres)', async () => {
      const token = 'mock-token-personal-1';
      await expect(
        cambiarPassword.ejecutar(token, {
          codigo: '654321',
          nuevoPassword: 'corta',
        }),
      ).rejects.toThrow(PasswordDebilError);
    });
  });

  describe('HU-04 · Gestión de personal por Administrador', () => {
    const adminToken = 'mock-token-admin-1';
    const monitorToken = 'mock-token-personal-1';

    it('permite a un administrador crear una cuenta con contraseña temporal (AC-HU04-01)', async () => {
      const nuevo = await crearPersonal.ejecutar(adminToken, {
        nombre: 'María Monitora',
        correo: 'maria.monitor@clena.org',
        passwordTemporal: 'Temporal123',
        rol: 'PERSONAL',
      });

      expect(nuevo.nombre).toBe('María Monitora');
      expect(nuevo.activo).toBe(true);
      expect(nuevo.debeCambiarPassword).toBe(true);
    });

    it('impide crear cuenta si el correo ya existe', async () => {
      await expect(
        crearPersonal.ejecutar(adminToken, {
          nombre: 'Duplicado',
          correo: 'admin@clena.org',
          passwordTemporal: 'Temporal123',
          rol: 'PERSONAL',
        }),
      ).rejects.toThrow(CorreoEnUsoError);
    });

    it('bloquea a usuarios no administradores (AC-HU04-04)', async () => {
      await expect(listarPersonal.ejecutar(monitorToken)).rejects.toThrow(
        AccesoDenegadoPersonalError,
      );

      await expect(
        crearPersonal.ejecutar(monitorToken, {
          nombre: 'Intruso',
          correo: 'intruso@clena.org',
          passwordTemporal: 'Temporal123',
          rol: 'PERSONAL',
        }),
      ).rejects.toThrow(AccesoDenegadoPersonalError);
    });

    it('desactiva una cuenta y conserva el registro (AC-HU04-02)', async () => {
      const desactivado = await desactivarPersonal.ejecutar(
        adminToken,
        'personal-1',
      );
      expect(desactivado.activo).toBe(false);

      const lista = await listarPersonal.ejecutar(adminToken);
      const cuentaEnLista = lista.datos.find((p) => p.id === 'personal-1');
      expect(cuentaEnLista).toBeDefined();
      expect(cuentaEnLista?.activo).toBe(false);
    });

    it('reactiva una cuenta desactivada', async () => {
      await desactivarPersonal.ejecutar(adminToken, 'personal-1');
      const reactivado = await reactivarPersonal.ejecutar(
        adminToken,
        'personal-1',
      );
      expect(reactivado.activo).toBe(true);
    });
  });
});
