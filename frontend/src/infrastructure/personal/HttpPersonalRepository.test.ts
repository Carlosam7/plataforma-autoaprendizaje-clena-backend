import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpPersonalRepository } from './HttpPersonalRepository';
import {
  AccesoDenegadoPersonalError,
  CodigoPersonalExpiradoError,
  CodigoPersonalInvalidoError,
  CorreoEnUsoError,
  CredencialesIncorrectasError,
  PersonalError,
  SesionPersonalExpiradaError,
  SinConexionPersonalError,
} from '@/domain/personal/errors';

const storageMap = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => storageMap.get(key) ?? null,
    setItem: (key: string, value: string) => storageMap.set(key, value),
    removeItem: (key: string) => storageMap.delete(key),
    clear: () => storageMap.clear(),
  },
  writable: true,
});
const CLAVE_SESION = 'kama_personal_session';

/** Respuesta de fetch con el cuerpo JSON indicado. */
function respuesta(status: number, cuerpo?: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => cuerpo,
  } as unknown as Response;
}

/** Error uniforme del backend (C-00). */
function errorApi(status: number, codigo: string, mensaje: string) {
  return respuesta(status, { statusCode: status, codigo, mensaje });
}

const PERSONAL = {
  id: 'personal-123',
  nombre: 'Lucía Monitora',
  correo: 'lucia@clena.org',
  rol: 'PERSONAL',
  activo: true,
  debeCambiarPassword: true,
  ultimoAccesoEn: null,
  creadoEn: '2026-11-13T09:00:00.000Z',
};
const LISTADO = { datos: [PERSONAL], total: 1, pagina: 1, limite: 20 };

function guardarSesion(accessToken: string, accessTokenExpiraEn?: string) {
  storageMap.set(
    CLAVE_SESION,
    JSON.stringify({
      usuario: {
        id: 'admin-1',
        nombre: 'Andrea',
        rol: 'ADMINISTRADOR',
        debeCambiarPassword: false,
      },
      accessToken,
      accessTokenExpiraEn,
    }),
  );
}
const sesionGuardada = () => {
  const raw = storageMap.get(CLAVE_SESION);
  return raw ? JSON.parse(raw) : null;
};
const VIGENTE = new Date(Date.now() + 15 * 60_000).toISOString();
const VENCIDO = new Date(Date.now() - 1000).toISOString();

describe('HttpPersonalRepository (C-09)', () => {
  let repo: HttpPersonalRepository;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    repo = new HttpPersonalRepository('/api/v1');
    storageMap.clear();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  describe('inicio de sesión', () => {
    it('pide el código con correo y contraseña y conserva el solicitudId', async () => {
      const puedeReenviarEn = new Date(Date.now() + 60_000).toISOString();
      fetchMock.mockResolvedValueOnce(
        respuesta(202, {
          solicitudId: 'admin-1',
          canal: 'CORREO',
          destino: 'a****@clena.org',
          mensaje: 'Te enviamos un código a a****@clena.org.',
          expiraEn: '2026-11-13T10:00:00.000Z',
          puedeReenviarEn,
        }),
      );

      const res = await repo.solicitarInicioSesion({
        correo: 'admin@clena.org',
        password: 'MiClaveSegura1',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/auth/personal/login',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({
            correo: 'admin@clena.org',
            password: 'MiClaveSegura1',
          }),
        }),
      );
      expect(res).toMatchObject({
        solicitudId: 'admin-1',
        destino: 'a****@clena.org',
        puedeReenviarEn: new Date(puedeReenviarEn),
      });
      expect(res.reenviarEnSegundos).toBeGreaterThan(55);
      expect(res.reenviarEnSegundos).toBeLessThanOrEqual(60);
    });

    it('verifica el código con {solicitudId, codigo} y guarda la sesión con su vencimiento', async () => {
      fetchMock.mockResolvedValueOnce(
        respuesta(200, {
          usuario: {
            nombre: 'Andrea',
            rol: 'ADMINISTRADOR',
            debeCambiarPassword: false,
          },
          accessToken: 'token-1',
          accessTokenExpiraEn: VIGENTE,
        }),
      );

      const sesion = await repo.verificarInicioSesion({
        solicitudId: 'admin-1',
        codigo: '123456',
      });

      expect(fetchMock.mock.calls[0][1].body).toBe(
        JSON.stringify({ solicitudId: 'admin-1', codigo: '123456' }),
      );
      expect(sesion.usuario.id).toBe('admin-1');
      expect(sesionGuardada()).toMatchObject({
        accessToken: 'token-1',
        accessTokenExpiraEn: VIGENTE,
      });
    });

    it('con credenciales incorrectas muestra el mensaje del backend', async () => {
      fetchMock.mockResolvedValueOnce(
        errorApi(401, 'CREDENCIALES_INCORRECTAS', 'Credenciales incorrectas.'),
      );
      await expect(
        repo.solicitarInicioSesion({ correo: 'a@b.co', password: 'x' }),
      ).rejects.toThrow(
        new CredencialesIncorrectasError('Credenciales incorrectas.'),
      );
    });

    it.each([
      [
        errorApi(410, 'CODIGO_EXPIRADO', 'El código ya venció.'),
        CodigoPersonalExpiradoError,
      ],
      [
        errorApi(400, 'CODIGO_INCORRECTO', 'El código no es correcto.'),
        CodigoPersonalInvalidoError,
      ],
    ])('traduce %# el error del código', async (res, Tipo) => {
      fetchMock.mockResolvedValueOnce(res);
      await expect(
        repo.verificarInicioSesion({
          solicitudId: 'admin-1',
          codigo: '000000',
        }),
      ).rejects.toBeInstanceOf(Tipo);
      expect(sesionGuardada()).toBeNull();
    });
  });

  describe('nunca simula una respuesta', () => {
    it('sin conexión lanza SinConexionPersonalError y no abre sesión', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      await expect(
        repo.solicitarInicioSesion({
          correo: 'admin@clena.org',
          password: 'Admin1234',
        }),
      ).rejects.toBeInstanceOf(SinConexionPersonalError);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(sesionGuardada()).toBeNull();
    });

    it('un 500 llega a la pantalla con su mensaje, sin datos de ejemplo', async () => {
      guardarSesion('token-1', VIGENTE);
      fetchMock.mockResolvedValueOnce(
        errorApi(500, 'ERROR_INTERNO', 'Algo salió mal de nuestro lado.'),
      );
      const error = await repo.listarPersonal('token-1').catch((e) => e);
      expect(error).toBeInstanceOf(PersonalError);
      expect(error).toMatchObject({
        message: 'Algo salió mal de nuestro lado.',
        statusCode: 500,
        codigo: 'ERROR_INTERNO',
      });
    });
  });

  describe('gestión del personal (solo ADMINISTRADOR)', () => {
    beforeEach(() => guardarSesion('token-admin', VIGENTE));

    it('crea personal con Authorization Bearer', async () => {
      fetchMock.mockResolvedValueOnce(respuesta(201, PERSONAL));
      const creado = await repo.crearPersonal('token-admin', {
        nombre: 'Lucía Monitora',
        correo: 'lucia@clena.org',
        passwordTemporal: 'Temporal123',
        rol: 'PERSONAL',
      });
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/personal',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer token-admin',
          }),
        }),
      );
      expect(creado.id).toBe('personal-123');
    });

    it('lista con filtros y convierte las fechas', async () => {
      fetchMock.mockResolvedValueOnce(
        respuesta(200, {
          ...LISTADO,
          datos: [{ ...PERSONAL, ultimoAccesoEn: '2026-11-13T08:00:00.000Z' }],
        }),
      );
      const res = await repo.listarPersonal('token-admin', {
        q: 'lucia',
        activo: true,
      });
      expect(fetchMock.mock.calls[0][0]).toBe(
        '/api/v1/personal?q=lucia&activo=true',
      );
      expect(res.datos[0].ultimoAccesoEn).toBeInstanceOf(Date);
    });

    it('un correo en uso es CorreoEnUsoError; un monitor recibe AccesoDenegado', async () => {
      fetchMock
        .mockResolvedValueOnce(
          errorApi(409, 'CORREO_EN_USO', 'Ese correo ya está en uso.'),
        )
        .mockResolvedValueOnce(
          errorApi(403, 'SIN_PERMISO', 'No tienes permiso.'),
        );
      const datos = {
        nombre: 'X',
        correo: 'x@clena.org',
        passwordTemporal: 'Temporal123',
        rol: 'PERSONAL' as const,
      };
      await expect(
        repo.crearPersonal('token-admin', datos),
      ).rejects.toBeInstanceOf(CorreoEnUsoError);
      await expect(
        repo.crearPersonal('token-admin', datos),
      ).rejects.toBeInstanceOf(AccesoDenegadoPersonalError);
    });
  });

  it('cambia la contraseña temporal con {codigo, passwordNueva}', async () => {
    guardarSesion('token-1', VIGENTE);
    fetchMock.mockResolvedValueOnce(respuesta(204));
    await repo.cambiarPasswordInicial('token-1', {
      codigo: '123456',
      passwordNueva: 'NuevaClave2026',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/personal/yo/password',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          codigo: '123456',
          passwordNueva: 'NuevaClave2026',
        }),
      }),
    );
  });

  describe('renovación de la sesión (POST /auth/refresh con la cookie)', () => {
    const refrescado = (accessToken: string) =>
      respuesta(200, { accessToken, accessTokenExpiraEn: VIGENTE });

    it('si el token ya venció, lo renueva antes de la petición', async () => {
      guardarSesion('token-viejo', VENCIDO);
      fetchMock
        .mockResolvedValueOnce(refrescado('token-nuevo'))
        .mockResolvedValueOnce(respuesta(200, LISTADO));

      await repo.listarPersonal('token-viejo');

      expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/auth/refresh');
      expect(fetchMock.mock.calls[0][1]).toMatchObject({
        method: 'POST',
        credentials: 'include',
      });
      expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe(
        'Bearer token-nuevo',
      );
      expect(sesionGuardada().accessToken).toBe('token-nuevo');
    });

    it('usa el token guardado aunque la pantalla pase uno anterior', async () => {
      guardarSesion('token-nuevo', VIGENTE);
      fetchMock.mockResolvedValueOnce(respuesta(200, LISTADO));
      await repo.listarPersonal('token-de-cuando-abrio-la-pantalla');
      expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
        'Bearer token-nuevo',
      );
    });

    it('ante un 401 en una lectura renueva una vez y la reintenta', async () => {
      guardarSesion('token-1', VIGENTE);
      fetchMock
        .mockResolvedValueOnce(errorApi(401, 'SESION_INVALIDA', 'x'))
        .mockResolvedValueOnce(refrescado('token-2'))
        .mockResolvedValueOnce(respuesta(200, LISTADO));

      const res = await repo.listarPersonal('token-1');

      expect(res.total).toBe(1);
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe(
        'Bearer token-2',
      );
    });

    it('ante un 401 en una escritura renueva pero NO la repite', async () => {
      guardarSesion('token-1', VIGENTE);
      fetchMock
        .mockResolvedValueOnce(errorApi(401, 'SESION_INVALIDA', 'x'))
        .mockResolvedValueOnce(refrescado('token-2'));

      await expect(
        repo.desactivarPersonal('token-1', 'personal-123'),
      ).rejects.toMatchObject({ codigo: 'SESION_RENOVADA' });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(sesionGuardada().accessToken).toBe('token-2');
    });

    it('si la sesión no se puede renovar, la olvida y pide iniciar sesión', async () => {
      guardarSesion('token-1', VIGENTE);
      fetchMock
        .mockResolvedValueOnce(errorApi(401, 'SESION_INVALIDA', 'x'))
        .mockResolvedValueOnce(errorApi(401, 'NO_AUTENTICADO', 'x'));

      await expect(repo.listarPersonal('token-1')).rejects.toBeInstanceOf(
        SesionPersonalExpiradaError,
      );
      expect(sesionGuardada()).toBeNull();
    });
  });

  it('cerrar sesión llama a /auth/logout y olvida la sesión aunque no haya red', async () => {
    guardarSesion('token-1', VIGENTE);
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await repo.cerrarSesionPersonal();
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/auth/logout');
    expect(sesionGuardada()).toBeNull();
  });
});
