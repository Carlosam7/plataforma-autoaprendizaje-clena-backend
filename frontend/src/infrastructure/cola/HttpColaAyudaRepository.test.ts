import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpColaAyudaRepository } from './HttpColaAyudaRepository';
import {
  AccesoDenegadoPersonalError,
  PersonalError,
} from '@/domain/personal/errors';

const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => storage.set(k, v),
    removeItem: (k: string) => storage.delete(k),
  },
  writable: true,
});

const respuesta = (status: number, cuerpo?: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => cuerpo,
  }) as unknown as Response;

const BACKEND = {
  id: 's-1',
  equipo: '12',
  tema: 'CORREO',
  estado: 'EN_ATENCION',
  guia: { slug: 'smishing', titulo: 'Smishing' },
  paso: 2,
  creadaEn: '2026-11-27T15:00:00.000Z',
  atendidaPor: 'Ana',
  tomadaEn: '2026-11-27T15:02:00.000Z',
  resueltaEn: null,
  comentarioResolucion: null,
};

describe('FE-06 · HttpColaAyudaRepository (C-06)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let repo: HttpColaAyudaRepository;

  beforeEach(() => {
    storage.clear();
    storage.set(
      'kama_personal_session',
      JSON.stringify({
        usuario: {
          id: 'a',
          nombre: 'Ana',
          rol: 'PERSONAL',
          debeCambiarPassword: false,
        },
        accessToken: 'token-1',
        accessTokenExpiraEn: new Date(Date.now() + 900_000).toISOString(),
      }),
    );
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    repo = new HttpColaAyudaRepository();
  });

  it('lista por estado, de la más antigua a la más reciente, con el Bearer del personal', async () => {
    fetchMock.mockResolvedValueOnce(
      respuesta(200, { datos: [BACKEND], total: 1 }),
    );
    const res = await repo.listar({ estado: 'EN_ATENCION', limite: 50 });
    expect(fetchMock.mock.calls[0][0]).toBe(
      '/api/v1/solicitudes-ayuda?estado=EN_ATENCION&pagina=1&limite=50&ordenarPor=creadaEn&direccion=asc',
    );
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
      'Bearer token-1',
    );
    expect(res.total).toBe(1);
    expect(res.datos[0]).toMatchObject({
      equipo: '12',
      guia: { slug: 'smishing', titulo: 'Smishing' },
      paso: 2,
      atendidaPor: 'Ana',
      resueltaEn: null,
    });
    expect(res.datos[0].creadaEn).toBeInstanceOf(Date);
    expect(res.datos[0].tomadaEn).toBeInstanceOf(Date);
  });

  it('tomar es un POST; si otro monitor ya la tomó llega el 409 con su mensaje', async () => {
    fetchMock.mockResolvedValueOnce(
      respuesta(409, {
        statusCode: 409,
        codigo: 'SOLICITUD_MODIFICADA',
        mensaje: 'Otro monitor la acaba de tomar.',
      }),
    );
    const error = await repo.tomar('s-1').catch((e: unknown) => e);
    expect(fetchMock.mock.calls[0][0]).toBe(
      '/api/v1/solicitudes-ayuda/s-1/tomar',
    );
    expect(fetchMock.mock.calls[0][1].method).toBe('POST');
    expect(error).toBeInstanceOf(PersonalError);
    expect(error).toMatchObject({
      statusCode: 409,
      codigo: 'SOLICITUD_MODIFICADA',
      message: 'Otro monitor la acaba de tomar.',
    });
  });

  it('resolver envía {comentario}; si la atiende otro monitor es AccesoDenegado', async () => {
    fetchMock
      .mockResolvedValueOnce(respuesta(200, { ...BACKEND, estado: 'RESUELTA' }))
      .mockResolvedValueOnce(
        respuesta(403, {
          statusCode: 403,
          codigo: 'X',
          mensaje: 'La atiende otro monitor.',
        }),
      );
    const resuelta = await repo.resolver('s-1', 'Se explicó.');
    expect(fetchMock.mock.calls[0][1].body).toBe(
      JSON.stringify({ comentario: 'Se explicó.' }),
    );
    expect(resuelta.estado).toBe('RESUELTA');
    await expect(repo.resolver('s-1', null)).rejects.toBeInstanceOf(
      AccesoDenegadoPersonalError,
    );
  });

  it('ante un 401 al tomar, renueva la sesión pero no repite la toma', async () => {
    fetchMock
      .mockResolvedValueOnce(
        respuesta(401, {
          statusCode: 401,
          codigo: 'SESION_INVALIDA',
          mensaje: 'x',
        }),
      )
      .mockResolvedValueOnce(respuesta(200, { accessToken: 'token-2' }));
    await expect(repo.tomar('s-1')).rejects.toMatchObject({
      codigo: 'SESION_RENOVADA',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/auth/refresh');
  });
});
