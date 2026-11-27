import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpAuthRepository } from './HttpAuthRepository';
import {
  AuthConflictError,
  AuthExpiredError,
  AuthRateLimitError,
  AuthSessionExpiredError,
  AuthValidationError,
} from '@/domain/auth/errors';

const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storageMap.set(key, value);
  },
  removeItem: (key: string) => {
    storageMap.delete(key);
  },
  clear: () => {
    storageMap.clear();
  },
};
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('HttpAuthRepository', () => {
  let repository: HttpAuthRepository;

  beforeEach(() => {
    repository = new HttpAuthRepository('/api/v1');
    vi.restoreAllMocks();
    storageMap.clear();
  });

  it('obtenerAvisoPrivacidad realiza GET y devuelve datos formateados', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        version: '1.0',
        contenido: 'Términos de prueba',
        vigenteDesde: '2026-01-01T00:00:00.000Z',
      }),
    } as Response);

    const resultado = await repository.obtenerAvisoPrivacidad();
    expect(resultado.version).toBe('1.0');
    expect(resultado.contenido).toBe('Términos de prueba');
    expect(resultado.vigenteDesde).toBeInstanceOf(Date);
  });

  it('solicitarRegistro realiza POST y mapea respuesta de éxito', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        registroId: 'abc-123',
        canal: 'CORREO',
        destino: 'c****@correo.com',
        mensaje: 'Código enviado',
        expiraEn: '2026-01-01T00:10:00.000Z',
        puedeReenviarEn: '2026-01-01T00:01:00.000Z',
      }),
    } as Response);

    const resultado = await repository.solicitarRegistro({
      nombre: 'Carmen Rodríguez',
      numeroIdentificacion: '12345678',
      fechaNacimiento: '1955-08-21',
      correo: 'carmen@correo.com',
      aceptaAvisoPrivacidad: true,
    });

    expect(resultado.registroId).toBe('abc-123');
    expect(resultado.destino).toBe('c****@correo.com');
  });

  it('lanza AuthConflictError cuando el servidor responde 409', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({
        statusCode: 409,
        error: 'Conflict',
        message: 'Identificación ya registrada',
      }),
    } as Response);

    await expect(
      repository.solicitarRegistro({
        nombre: 'Carmen Rodríguez',
        numeroIdentificacion: '12345678',
        fechaNacimiento: '1955-08-21',
        correo: 'carmen@correo.com',
        aceptaAvisoPrivacidad: true,
      }),
    ).rejects.toThrow(AuthConflictError);
  });

  it('lanza AuthExpiredError cuando el servidor responde 410', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 410,
      json: async () => ({
        statusCode: 410,
        message: 'El código venció',
      }),
    } as Response);

    await expect(
      repository.verificarRegistro({
        registroId: 'abc-123',
        codigo: '123456',
      }),
    ).rejects.toThrow(AuthExpiredError);
  });

  it('lanza AuthRateLimitError cuando el servidor responde 429', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({
        statusCode: 429,
        message: 'Se agotaron los intentos',
      }),
    } as Response);

    await expect(repository.reenviarCodigo('abc-123')).rejects.toThrow(
      AuthRateLimitError,
    );
  });

  it('lanza AuthValidationError cuando el servidor responde 400', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        statusCode: 400,
        message: 'Código incorrecto',
      }),
    } as Response);

    await expect(
      repository.verificarRegistro({
        registroId: 'abc-123',
        codigo: '000000',
      }),
    ).rejects.toThrow(AuthValidationError);
  });

  it('guarda, recupera y cierra la sesión llamando a /auth/logout con credentials', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 204,
    } as Response);

    const sesion = {
      usuario: { nombre: 'Carmen', rol: 'USUARIO_PUBLICO' },
      accessToken: 'token-abc',
    };

    await repository.guardarSesion(sesion);
    const obtenida = await repository.obtenerSesion();
    expect(obtenida).toEqual(sesion);

    await repository.cerrarSesion();
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/auth/logout',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    );
    const despuesDeCerrar = await repository.obtenerSesion();
    expect(despuesDeCerrar).toBeNull();
  });

  it('renovarSesion llama a /auth/refresh con credentials y rota el token', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        accessToken: 'nuevo-access-token',
        accessTokenExpiraEn: '2026-01-01T01:00:00.000Z',
        refreshTokenExpiraEn: '2026-01-08T00:00:00.000Z',
      }),
    } as Response);

    await repository.guardarSesion({
      usuario: { nombre: 'Carmen', rol: 'USUARIO_PUBLICO' },
      accessToken: 'token-viejo',
    });

    const sesionRenovada = await repository.renovarSesion();

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/auth/refresh',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    );
    expect(sesionRenovada.accessToken).toBe('nuevo-access-token');
    expect(sesionRenovada.usuario.nombre).toBe('Carmen');
  });

  it('solicitarInicioSesion realiza POST a /auth/login con identificación y contacto', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 202,
      json: async () => ({
        solicitudId: 'sol-login-456',
        canal: 'CORREO',
        destino: 'a****@correo.com',
        mensaje: 'Código enviado a tu correo',
        expiraEn: '2026-01-01T00:10:00.000Z',
        puedeReenviarEn: '2026-01-01T00:01:00.000Z',
      }),
    } as Response);

    const resultado = await repository.solicitarInicioSesion({
      numeroIdentificacion: '41234567',
      contacto: 'ana@correo.com',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          numeroIdentificacion: '41234567',
          contacto: 'ana@correo.com',
        }),
      }),
    );
    expect(resultado.solicitudId).toBe('sol-login-456');
    expect(resultado.registroId).toBe('sol-login-456');
    expect(resultado.canal).toBe('CORREO');
  });

  it('verificarInicioSesion realiza POST a /auth/login/verificar y devuelve la sesión', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        usuario: { nombre: 'Carmen Rodríguez', rol: 'USUARIO_PUBLICO' },
        accessToken: 'access-jwt-123',
        accessTokenExpiraEn: '2026-01-01T01:00:00.000Z',
        refreshTokenExpiraEn: '2026-01-08T00:00:00.000Z',
      }),
    } as Response);

    const sesion = await repository.verificarInicioSesion({
      solicitudId: 'sol-login-456',
      codigo: '483920',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/auth/login/verificar',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          solicitudId: 'sol-login-456',
          codigo: '483920',
        }),
      }),
    );
    expect(sesion.usuario.nombre).toBe('Carmen Rodríguez');
    expect(sesion.accessToken).toBe('access-jwt-123');
  });

  describe('BE-05 · errores uniformes del backend (C-00)', () => {
    it('lleva el codigo y el campo de detalles.campos a la pantalla', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          statusCode: 400,
          codigo: 'DATOS_INVALIDOS',
          mensaje: 'Escribe tu número de documento.',
          detalles: {
            campos: {
              numeroIdentificacion: ['Escribe tu número de documento.'],
            },
          },
        }),
      } as unknown as Response);
      await expect(
        repository.solicitarInicioSesion({
          numeroIdentificacion: '',
          contacto: 'a@b.co',
        }),
      ).rejects.toMatchObject({
        message: 'Escribe tu número de documento.',
        codigo: 'DATOS_INVALIDOS',
        campo: 'numeroIdentificacion',
      });
    });

    it('un código vencido es AuthExpiredError con CODIGO_EXPIRADO', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 410,
        json: async () => ({
          statusCode: 410,
          codigo: 'CODIGO_EXPIRADO',
          mensaje: 'El código ya venció. Pide uno nuevo.',
        }),
      } as unknown as Response);
      const error = await repository
        .verificarInicioSesion({ solicitudId: 's-1', codigo: '123456' })
        .catch((e) => e);
      expect(error).toBeInstanceOf(AuthExpiredError);
      expect(error).toMatchObject({
        codigo: 'CODIGO_EXPIRADO',
        message: 'El código ya venció. Pide uno nuevo.',
      });
    });

    it('sin conexión muestra un mensaje sencillo', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
        new TypeError('Failed to fetch'),
      );
      await expect(repository.obtenerAvisoPrivacidad()).rejects.toThrow(
        /No se pudo conectar con el servidor/,
      );
    });
  });

  describe('HU-05 · eliminar la cuenta (C-08)', () => {
    const VIGENTE = new Date(Date.now() + 15 * 60_000).toISOString();
    const VENCIDO = new Date(Date.now() - 1000).toISOString();
    const guardar = (accessToken: string, accessTokenExpiraEn = VIGENTE) =>
      repository.guardarSesion({
        usuario: { nombre: 'Carmen', rol: 'USUARIO_PUBLICO' },
        accessToken,
        accessTokenExpiraEn,
      });
    const solicitudEnviada = {
      ok: true,
      status: 202,
      json: async () => ({
        solicitudId: 'elim-1',
        canal: 'CORREO',
        destino: 'c****@correo.com',
        mensaje: 'Te enviamos un código a c****@correo.com.',
        expiraEn: '2026-11-27T10:10:00.000Z',
        puedeReenviarEn: '2026-11-27T10:01:00.000Z',
      }),
    } as unknown as Response;
    const refrescado = (accessToken: string) =>
      ({
        ok: true,
        status: 200,
        json: async () => ({ accessToken, accessTokenExpiraEn: VIGENTE }),
      }) as unknown as Response;
    const noAutenticado = {
      ok: false,
      status: 401,
      json: async () => ({
        statusCode: 401,
        codigo: 'SESION_INVALIDA',
        mensaje: 'x',
      }),
    } as unknown as Response;

    it('pide el código con el Bearer de la sesión', async () => {
      await guardar('token-1');
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(solicitudEnviada);

      const res = await repository.solicitarEliminacionCuenta();

      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/v1/auth/cuenta/eliminacion',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: '{}',
          headers: expect.objectContaining({ Authorization: 'Bearer token-1' }),
        }),
      );
      expect(res).toMatchObject({ solicitudId: 'elim-1', canal: 'CORREO' });
      expect(res.expiraEn).toBeInstanceOf(Date);
    });

    it('confirma con {solicitudId, codigo}, no lee cuerpo del 204 y olvida la sesión', async () => {
      await guardar('token-1');
      const json = vi.fn();
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 204,
        json,
      } as unknown as Response);

      await repository.confirmarEliminacionCuenta({
        solicitudId: 'elim-1',
        codigo: '123456',
      });

      expect(fetchSpy.mock.calls[0][0]).toBe(
        '/api/v1/auth/cuenta/eliminacion/confirmar',
      );
      expect(fetchSpy.mock.calls[0][1]?.body).toBe(
        JSON.stringify({ solicitudId: 'elim-1', codigo: '123456' }),
      );
      expect(json).not.toHaveBeenCalled();
      expect(await repository.obtenerSesion()).toBeNull();
    });

    it('con un código incorrecto no olvida la sesión', async () => {
      await guardar('token-1');
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          statusCode: 400,
          codigo: 'CODIGO_INCORRECTO',
          mensaje: 'El código no es correcto. Te quedan 4 intentos.',
        }),
      } as unknown as Response);
      await expect(
        repository.confirmarEliminacionCuenta({
          solicitudId: 'elim-1',
          codigo: '000000',
        }),
      ).rejects.toMatchObject({ codigo: 'CODIGO_INCORRECTO' });
      expect(await repository.obtenerSesion()).not.toBeNull();
    });

    it('si el token venció, lo renueva con la cookie antes de pedir el código', async () => {
      await guardar('token-viejo', VENCIDO);
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(refrescado('token-nuevo'))
        .mockResolvedValueOnce(solicitudEnviada);

      await repository.solicitarEliminacionCuenta();

      expect(fetchSpy.mock.calls[0][0]).toBe('/api/v1/auth/refresh');
      expect(fetchSpy.mock.calls[1][1]?.headers).toMatchObject({
        Authorization: 'Bearer token-nuevo',
      });
      expect((await repository.obtenerSesion())?.accessToken).toBe(
        'token-nuevo',
      );
    });

    it('ante un 401 renueva una vez, pero no repite el POST', async () => {
      await guardar('token-1');
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(noAutenticado)
        .mockResolvedValueOnce(refrescado('token-2'));

      await expect(
        repository.confirmarEliminacionCuenta({
          solicitudId: 'elim-1',
          codigo: '123456',
        }),
      ).rejects.toMatchObject({ codigo: 'SESION_RENOVADA' });
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('si la sesión ya no se puede renovar, la olvida', async () => {
      await guardar('token-1');
      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(noAutenticado)
        .mockResolvedValueOnce(noAutenticado);

      await expect(
        repository.solicitarEliminacionCuenta(),
      ).rejects.toBeInstanceOf(AuthSessionExpiredError);
      expect(await repository.obtenerSesion()).toBeNull();
    });

    it('sin sesión guardada no llama al servidor', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      await expect(
        repository.solicitarEliminacionCuenta(),
      ).rejects.toBeInstanceOf(AuthSessionExpiredError);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});
