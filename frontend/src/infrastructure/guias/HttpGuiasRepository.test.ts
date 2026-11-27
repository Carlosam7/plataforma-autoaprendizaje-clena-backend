import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpGuiasRepository } from './HttpGuiasRepository';

describe('HttpGuiasRepository', () => {
  let repository: HttpGuiasRepository;

  beforeEach(() => {
    repository = new HttpGuiasRepository('/api/v1');
    vi.restoreAllMocks();
  });

  it('listarGuiasPublicadas realiza GET y mapea los datos del backend', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        datos: [
          {
            slug: 'smishing',
            categoria: 'seguridad-digital',
            titulo: 'Smishing',
            objetivo: 'Al terminar sabrás reconocer un SMS falso.',
            nivel: 'BASICO',
            duracionEstimadaMin: 8,
          },
        ],
        total: 1,
        pagina: 1,
        limite: 20,
      }),
    } as Response);

    const guias = await repository.listarGuiasPublicadas('seguridad-digital');
    expect(guias).toHaveLength(1);
    expect(guias[0].slug).toBe('smishing');
    expect(guias[0].titulo).toBe('Smishing');
    expect(guias[0].nivel).toBe('Básico');
    expect(guias[0].duracionEstimadaMinutos).toBe(8);
  });

  it('obtenerDetalleGuia realiza GET y mapea pasos y bloques del backend', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        slug: 'smishing',
        categoria: 'seguridad-digital',
        titulo: 'Smishing',
        objetivo: 'Al terminar sabrás reconocer un SMS falso.',
        nivel: 'BASICO',
        duracionEstimadaMin: 8,
        totalPasos: 2,
        tieneActividad: true,
        pasos: [
          {
            orden: 1,
            titulo: 'Haz una pausa',
            bloques: [
              { tipo: 'texto', texto: 'Respira y lee con calma.' },
              { tipo: 'aviso', nivel: 'alerta', texto: 'No abras el enlace.' },
            ],
          },
        ],
      }),
    } as Response);

    const detalle = await repository.obtenerDetalleGuia('smishing');
    expect(detalle).not.toBeNull();
    expect(detalle?.guia.slug).toBe('smishing');
    expect(detalle?.totalPasos).toBe(2);
    expect(detalle?.tieneActividad).toBe(true);
    expect(detalle?.pasos).toHaveLength(1);
    expect(detalle?.pasos[0].titulo).toBe('Haz una pausa');
    expect(detalle?.pasos[0].contenido).toBe('Respira y lee con calma.');
    expect(detalle?.pasos[0].recordatorio?.consejo).toBe('No abras el enlace.');
  });

  it('obtenerDetalleGuia devuelve null si el backend responde 404', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    const detalle = await repository.obtenerDetalleGuia('no-existe');
    expect(detalle).toBeNull();
  });

  it('registrarAperturaGuia invoca POST /guias/:slug/consultas', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 204,
    } as Response);

    await repository.registrarAperturaGuia('smishing');
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/guias/smishing/consultas',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    );
  });

  it('listarCategorias realiza GET a /categorias y mapea con metadatos educativos', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        datos: [
          {
            slug: 'seguridad-digital',
            nombre: 'Seguridad digital',
            icono: 'shield-alert',
          },
          {
            slug: 'correo-electronico',
            nombre: 'Correo electrónico',
            icono: 'mail',
          },
        ],
        total: 2,
        pagina: 1,
        limite: 50,
      }),
    } as Response);

    const categorias = await repository.listarCategorias();
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/categorias?limite=50&ordenarPor=orden&direccion=asc',
      expect.objectContaining({
        headers: { Accept: 'application/json' },
      }),
    );
    expect(categorias).toHaveLength(2);
    expect(categorias[0].slug).toBe('seguridad-digital');
    expect(categorias[0].nombre).toBe('Seguridad digital');
    expect(categorias[0].numero).toBe('01 / CATEGORÍA');
    expect(categorias[1].slug).toBe('correo-electronico');
    expect(categorias[1].numero).toBe('02 / CATEGORÍA');
  });

  it('obtenerCategoria devuelve la categoría correspondiente por slug', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        datos: [
          {
            slug: 'seguridad-digital',
            nombre: 'Seguridad digital',
            icono: 'shield-alert',
          },
          {
            slug: 'correo-electronico',
            nombre: 'Correo electrónico',
            icono: 'mail',
          },
        ],
        total: 2,
      }),
    } as Response);

    const cat = await repository.obtenerCategoria('correo-electronico');
    expect(cat).not.toBeNull();
    expect(cat?.nombre).toBe('Correo electrónico');
    expect(cat?.numero).toBe('02 / CATEGORÍA');
  });

  describe('sin fallback silencioso', () => {
    const respuesta = (status: number, cuerpo?: unknown) =>
      ({
        ok: status >= 200 && status < 300,
        status,
        json: async () => {
          if (cuerpo === undefined) throw new SyntaxError('JSON inválido');
          return cuerpo;
        },
      }) as Response;

    it('HTTP 200 con colección vacía devuelve [] real', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        respuesta(200, { datos: [], total: 0, pagina: 1, limite: 20 }),
      );
      await expect(repository.listarGuiasPublicadas('x')).resolves.toEqual([]);
      await expect(repository.listarCategorias()).resolves.toEqual([]);
    });

    it.each([500, 502, 503])(
      'HTTP %i lanza CatalogoError SERVIDOR en todas las lecturas',
      async (status) => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(respuesta(status, {}));
        for (const op of [
          () => repository.listarCategorias(),
          () => repository.obtenerCategoria('seguridad-digital'),
          () => repository.listarGuiasPublicadas(),
          () => repository.obtenerDetalleGuia('smishing'),
        ]) {
          await expect(op()).rejects.toMatchObject({
            name: 'CatalogoError',
            tipo: 'SERVIDOR',
            statusCode: status,
          });
        }
      },
    );

    it('fallo de red lanza CONEXION', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fail'));
      await expect(repository.obtenerDetalleGuia('s')).rejects.toMatchObject({
        tipo: 'CONEXION',
      });
    });

    it('timeout lanza TIMEOUT', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(
        new DOMException('t', 'TimeoutError'),
      );
      await expect(repository.listarCategorias()).rejects.toMatchObject({
        tipo: 'TIMEOUT',
      });
    });

    it('JSON inválido o con forma inesperada lanza RESPUESTA_INVALIDA', async () => {
      const f = vi.spyOn(globalThis, 'fetch');
      f.mockResolvedValueOnce(respuesta(200));
      await expect(repository.listarGuiasPublicadas()).rejects.toMatchObject({
        tipo: 'RESPUESTA_INVALIDA',
      });
      f.mockResolvedValueOnce(respuesta(200, { foo: 1 }));
      await expect(repository.listarCategorias()).rejects.toMatchObject({
        tipo: 'RESPUESTA_INVALIDA',
      });
      f.mockResolvedValueOnce(respuesta(200, { slug: 's', pasos: 'x' }));
      await expect(repository.obtenerDetalleGuia('s')).rejects.toMatchObject({
        tipo: 'RESPUESTA_INVALIDA',
      });
    });

    it('categoría inexistente en un catálogo real devuelve null', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        respuesta(200, { datos: [], total: 0 }),
      );
      await expect(repository.obtenerCategoria('nada')).resolves.toBeNull();
    });

    it('el detalle no mezcla contenido simulado: sin bloques de texto queda vacío y sin práctica', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        respuesta(200, {
          slug: 'smishing',
          categoria: 'seguridad-digital',
          titulo: 'T',
          objetivo: 'O',
          nivel: 'BASICO',
          duracionEstimadaMin: 5,
          totalPasos: 1,
          tieneActividad: false,
          pasos: [{ orden: 1, titulo: null, bloques: [] }],
        }),
      );
      const d = await repository.obtenerDetalleGuia('smishing');
      expect(d?.pasos[0].contenido).toBe('');
      expect(d?.pasos[0].recordatorio).toBeUndefined();
      expect(d?.pasos[0].ejemplo).toBeUndefined();
      expect(d?.preguntas).toEqual([]);
    });

    it('un fallo de telemetría no lanza', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fail'));
      await expect(
        repository.registrarAperturaGuia('smishing'),
      ).resolves.toBeUndefined();
    });
  });
});
