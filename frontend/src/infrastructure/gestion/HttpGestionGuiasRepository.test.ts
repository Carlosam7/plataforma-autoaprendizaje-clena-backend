import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpGestionGuiasRepository } from './HttpGestionGuiasRepository';
import { PersonalError } from '@/domain/personal/errors';

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

const DETALLE = {
  slug: 'smishing',
  categoria: 'seguridad-digital',
  titulo: 'Smishing',
  objetivo: 'Reconocer.',
  nivel: 'BASICO',
  duracionEstimadaMin: 8,
  estado: 'BORRADOR',
  totalPasos: 1,
  publicadaEn: null,
  creadaPor: 'Ana',
  actualizadaPor: 'Ana',
  creadoEn: '2026-11-27T15:00:00.000Z',
  actualizadoEn: '2026-11-27T15:00:00.000Z',
  descripcion: null,
  palabrasClave: [],
  pasos: [
    {
      id: 'p-1',
      orden: 1,
      titulo: null,
      bloques: [{ tipo: 'texto', texto: 'Hola.' }],
    },
  ],
};
const COMANDO = {
  titulo: 'Smishing',
  objetivo: 'Reconocer.',
  descripcion: null,
  categoria: 'seguridad-digital',
  nivel: 'BASICO' as const,
  duracionEstimadaMin: 8,
  palabrasClave: [],
  pasos: [
    {
      id: 'p-1',
      titulo: null,
      bloques: [{ tipo: 'texto' as const, texto: 'Hola.' }],
    },
  ],
};

describe('FE-05 · HttpGestionGuiasRepository (C-07)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let repo: HttpGestionGuiasRepository;

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
    repo = new HttpGestionGuiasRepository();
  });

  it('lista con filtros y convierte las fechas', async () => {
    fetchMock.mockResolvedValueOnce(
      respuesta(200, { datos: [DETALLE], total: 1, pagina: 1, limite: 100 }),
    );
    const res = await repo.listar({
      estado: 'BORRADOR',
      categoria: undefined,
      limite: 100,
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      '/api/v1/gestion/guias?estado=BORRADOR&limite=100',
    );
    expect(res.datos[0].actualizadoEn).toBeInstanceOf(Date);
    expect(res.datos[0].publicadaEn).toBeNull();
  });

  it('crear es POST y editar es PUT con el slug, ambos con el cuerpo de C-07', async () => {
    fetchMock
      .mockResolvedValueOnce(respuesta(201, DETALLE))
      .mockResolvedValueOnce(respuesta(200, DETALLE));
    await repo.crear(COMANDO);
    await repo.editar('smishing', COMANDO);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/gestion/guias');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify(COMANDO),
    });
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/gestion/guias/smishing');
    expect(fetchMock.mock.calls[1][1].method).toBe('PUT');
  });

  it('publicar y ocultar son POST a su ruta', async () => {
    fetchMock
      .mockResolvedValueOnce(
        respuesta(200, { ...DETALLE, estado: 'PUBLICADA' }),
      )
      .mockResolvedValueOnce(respuesta(200, { ...DETALLE, estado: 'OCULTA' }));
    expect((await repo.publicar('smishing')).estado).toBe('PUBLICADA');
    expect((await repo.ocultar('smishing')).estado).toBe('OCULTA');
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([
      '/api/v1/gestion/guias/smishing/publicar',
      '/api/v1/gestion/guias/smishing/ocultar',
    ]);
  });

  it('un error de validación trae su campo y su codigo', async () => {
    fetchMock.mockResolvedValueOnce(
      respuesta(400, {
        statusCode: 400,
        codigo: 'DATOS_INVALIDOS',
        mensaje: 'El título puede tener máximo 150 letras.',
        detalles: {
          campos: { titulo: ['El título puede tener máximo 150 letras.'] },
        },
      }),
    );
    const error = await repo.crear(COMANDO).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(PersonalError);
    expect(error).toMatchObject({ codigo: 'DATOS_INVALIDOS', campo: 'titulo' });
  });

  it('publicar sin pasos llega como 409 GUIA_SIN_PASOS', async () => {
    fetchMock.mockResolvedValueOnce(
      respuesta(409, {
        statusCode: 409,
        codigo: 'GUIA_SIN_PASOS',
        mensaje: 'Agrega al menos un paso antes de publicar la guía.',
      }),
    );
    await expect(repo.publicar('smishing')).rejects.toMatchObject({
      statusCode: 409,
      codigo: 'GUIA_SIN_PASOS',
    });
  });
});
