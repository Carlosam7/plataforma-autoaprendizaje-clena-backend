import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpPersonalRepository } from './HttpPersonalRepository';
import { CredencialesIncorrectasError } from '@/domain/personal/errors';

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
});
