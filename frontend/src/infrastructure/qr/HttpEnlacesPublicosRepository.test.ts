import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpEnlacesPublicosRepository } from './HttpEnlacesPublicosRepository';

const respuesta = (status: number, cuerpo: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => cuerpo,
  }) as unknown as Response;

describe('FE-11 · HttpEnlacesPublicosRepository', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('recorre todas las páginas de guías de la categoría', async () => {
    const guia = (n: number) => ({ slug: `guia-${n}`, titulo: `Guía ${n}` });
    fetchMock
      .mockResolvedValueOnce(
        respuesta(200, {
          datos: Array.from({ length: 100 }, (_, i) => guia(i)),
          total: 101,
        }),
      )
      .mockResolvedValueOnce(
        respuesta(200, { datos: [guia(100)], total: 101 }),
      );

    const guias = await new HttpEnlacesPublicosRepository().listarGuias(
      'seguridad-digital',
    );

    expect(guias).toHaveLength(101);
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([
      '/api/v1/guias?categoria=seguridad-digital&pagina=1&limite=100',
      '/api/v1/guias?categoria=seguridad-digital&pagina=2&limite=100',
    ]);
  });

  it('lee las categorías en su orden', async () => {
    fetchMock.mockResolvedValueOnce(
      respuesta(200, {
        datos: [
          {
            slug: 'seguridad-digital',
            nombre: 'Seguridad digital',
            icono: 'x',
          },
        ],
        total: 1,
      }),
    );
    expect(
      await new HttpEnlacesPublicosRepository().listarCategorias(),
    ).toEqual([{ slug: 'seguridad-digital', nombre: 'Seguridad digital' }]);
    expect(fetchMock.mock.calls[0][0]).toBe(
      '/api/v1/categorias?ordenarPor=orden&direccion=asc&pagina=1&limite=100',
    );
  });

  it('ante un error del backend no inventa guías: muestra su mensaje', async () => {
    fetchMock.mockResolvedValueOnce(
      respuesta(500, { statusCode: 500, mensaje: 'Algo salió mal.' }),
    );
    await expect(
      new HttpEnlacesPublicosRepository().listarCategorias(),
    ).rejects.toThrow('Algo salió mal.');
  });

  it('sin conexión lanza un error, sin datos de ejemplo', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(
      new HttpEnlacesPublicosRepository().listarGuias('correo-electronico'),
    ).rejects.toThrow(/No se pudo conectar con el servidor/);
  });
});
