import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpPersonalRepository } from './HttpPersonalRepository';
import {
  CredencialesIncorrectasError,
  ServicioNoDisponiblePersonalError,
} from '@/domain/personal/errors';

describe('HttpPersonalRepository', () => {
  let repo: HttpPersonalRepository;

  beforeEach(() => {
    repo = new HttpPersonalRepository('/api/v1');
    vi.restoreAllMocks();
  });

  it('solicita inicio de sesión enviando correo y password al backend', async () => {
    const mockResponse = {
      destino: 'ad****@clena.org',
      expiraEn: '2026-11-13T10:00:00.000Z',
      reenviarEnSegundos: 60,
      mensaje: 'Te enviamos un código a ad****@clena.org.',
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    const res = await repo.solicitarInicioSesion({
      correo: 'admin@clena.org',
      password: 'MiClaveSegura',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/auth/personal/login',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          correo: 'admin@clena.org',
          password: 'MiClaveSegura',
        }),
      }),
    );
    expect(res.destino).toBe('ad****@clena.org');
  });

  it('lanza CredencialesIncorrectasError si el backend responde 401', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ mensaje: 'Credenciales incorrectas' }),
    } as unknown as Response);

    await expect(
      repo.solicitarInicioSesion({
        correo: 'admin@clena.org',
        password: 'ClaveEquivocada',
      }),
    ).rejects.toThrow(CredencialesIncorrectasError);
  });

  it('crea personal enviando Authorization Bearer y datos al backend', async () => {
    const mockPersonal = {
      id: 'personal-123',
      nombre: 'Lucía Monitora',
      correo: 'lucia@clena.org',
      rol: 'PERSONAL',
      activo: true,
      debeCambiarPassword: true,
      ultimoAccesoEn: null,
      creadoEn: '2026-11-13T09:00:00.000Z',
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockPersonal,
    } as unknown as Response);

    const creado = await repo.crearPersonal('token-admin', {
      nombre: 'Lucía Monitora',
      correo: 'lucia@clena.org',
      passwordTemporal: 'Temporal123',
      rol: 'PERSONAL',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/personal',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-admin',
        }),
      }),
    );
    expect(creado.id).toBe('personal-123');
    expect(creado.nombre).toBe('Lucía Monitora');
  });

  it('lista personal con filtros y mapea fechas correctamente', async () => {
    const mockListado = {
      datos: [
        {
          id: 'admin-1',
          nombre: 'Admin General',
          correo: 'admin@clena.org',
          rol: 'ADMINISTRADOR',
          activo: true,
          debeCambiarPassword: false,
          ultimoAccesoEn: '2026-11-13T08:00:00.000Z',
          creadoEn: '2026-11-01T00:00:00.000Z',
        },
      ],
      total: 1,
      pagina: 1,
      limite: 20,
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockListado,
    } as unknown as Response);

    const res = await repo.listarPersonal('token-admin', {
      q: 'admin',
      activo: true,
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/personal?q=admin&activo=true',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token-admin',
        }),
      }),
    );
    expect(res.datos[0].ultimoAccesoEn).toBeInstanceOf(Date);
  });

  describe('sin éxitos simulados ante fallos de API', () => {
    const operaciones: [string, () => Promise<unknown>][] = [
      [
        'login',
        () => repo.solicitarInicioSesion({ correo: 'a@b.c', password: 'x' }),
      ],
      [
        'verificar',
        () =>
          repo.verificarInicioSesion({ destino: 'a@b.c', codigo: '123456' }),
      ],
      ['listar', () => repo.listarPersonal('t')],
      [
        'crear',
        () =>
          repo.crearPersonal('t', {
            nombre: 'N',
            correo: 'a@b.c',
            rol: 'PERSONAL',
            passwordTemporal: 'Temporal2026',
          }),
      ],
      ['editar', () => repo.editarPersonal('t', 'id', { nombre: 'X' })],
      ['desactivar', () => repo.desactivarPersonal('t', 'id')],
      ['reactivar', () => repo.reactivarPersonal('t', 'id')],
    ];

    it.each(operaciones)(
      '%s: fallo de red lanza error explícito',
      async (_n, op) => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fail'));
        await expect(op()).rejects.toThrow(ServicioNoDisponiblePersonalError);
      },
    );

    it.each(operaciones)(
      '%s: HTTP 503 lanza error explícito',
      async (_n, op) => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
          ok: false,
          status: 503,
          json: async () => ({}),
        } as unknown as Response);
        await expect(op()).rejects.toThrow(ServicioNoDisponiblePersonalError);
      },
    );

    it('timeout lanza error explícito', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(
        new DOMException('t', 'TimeoutError'),
      );
      await expect(repo.listarPersonal('t')).rejects.toThrow(/tardó demasiado/);
    });

    it('JSON inválido en 200 lanza error explícito', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('x');
        },
      } as unknown as Response);
      await expect(
        repo.crearPersonal('t', {
          nombre: 'N',
          correo: 'a@b.c',
          rol: 'PERSONAL',
          passwordTemporal: 'Temporal2026',
        }),
      ).rejects.toThrow(ServicioNoDisponiblePersonalError);
    });

    it('no abre sesión local si la verificación falla', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fail'));
      await expect(
        repo.verificarInicioSesion({ destino: 'a@b.c', codigo: '123456' }),
      ).rejects.toThrow();
      await expect(repo.obtenerSesionPersonal()).resolves.toBeNull();
    });

    it('reintento tras reconexión funciona', async () => {
      const f = vi.spyOn(globalThis, 'fetch');
      f.mockRejectedValueOnce(new TypeError('fail'));
      await expect(repo.listarPersonal('t')).rejects.toThrow();
      f.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ datos: [], total: 0, pagina: 1, limite: 20 }),
      } as unknown as Response);
      await expect(repo.listarPersonal('t')).resolves.toMatchObject({
        total: 0,
      });
    });
  });
});
