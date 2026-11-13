import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';
import { crearApp, limpiarBaseDatos, sesionPersonal } from './app.js';

const RUTA = '/api/v1/guias';

describe('HU-11 · Buscar guías por palabra (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await crearApp());
  });

  beforeEach(async () => {
    await limpiarBaseDatos(prisma);
    const autor = await sesionPersonal(app, { rol: 'PERSONAL' });
    const comun = {
      objetivo: 'Al terminar sabrás hacerlo.',
      nivel: 'BASICO' as const,
      duracionEstimadaMin: 5,
      estado: 'PUBLICADA' as const,
      creadaPorId: autor.id,
      actualizadaPorId: autor.id,
    };
    // Categorías semilla: 2 = correo-electronico, 3 = busqueda-internet, 5 = redes-sociales.
    await prisma.guia.createMany({
      data: [
        {
          ...comun,
          slug: 'enviar-foto-whatsapp',
          categoriaId: 5,
          titulo: 'Enviar una foto por WhatsApp',
          descripcion: 'Comparte imágenes con tus contactos.',
          palabrasClave: ['mandar', 'imagen'],
        },
        {
          ...comun,
          slug: 'crear-correo',
          categoriaId: 2,
          titulo: 'Crear un correo electrónico',
          palabrasClave: ['email', 'gmail'],
        },
        {
          ...comun,
          slug: 'adjuntar-foto-correo',
          categoriaId: 2,
          titulo: 'Adjuntar una foto a un correo',
        },
        {
          ...comun,
          slug: 'buscar-direccion',
          categoriaId: 3,
          titulo: 'Buscar una dirección',
          descripcion: 'Encuentra cómo llegar a un lugar con el mapa.',
        },
        {
          ...comun,
          slug: 'foto-en-borrador',
          categoriaId: 5,
          titulo: 'Foto en borrador',
          estado: 'BORRADOR',
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  /** Slugs que devuelve la búsqueda, en el orden por defecto (título). */
  const buscar = async (
    q: string,
    otros: Record<string, string | number> = {},
  ): Promise<string[]> => {
    const { body } = await request(app.getHttpServer())
      .get(RUTA)
      .query({ q, ...otros })
      .expect(200);
    expect(body.total).toBeGreaterThanOrEqual(body.datos.length);
    return body.datos.map((g: { slug: string }) => g.slug);
  };

  it.each([
    ['el título', 'whatsapp', 'enviar-foto-whatsapp'],
    ['la descripción', 'mapa', 'buscar-direccion'],
    ['las palabras clave', 'gmail', 'crear-correo'],
  ])('encuentra la palabra en %s', async (_, q, slug) => {
    expect(await buscar(q)).toEqual([slug]);
  });

  it('«mandar foto» exige las dos palabras, aunque estén en campos distintos', async () => {
    // «mandar» está en las palabras clave y «foto» en el título.
    expect(await buscar('mandar foto')).toEqual(['enviar-foto-whatsapp']);
  });

  it.each(['correo electronico', 'CORREO ELECTRÓNICO', 'Córreo Electronico'])(
    'no distingue tildes ni mayúsculas: «%s»',
    async (q) => {
      expect(await buscar(q)).toEqual(['crear-correo']);
    },
  );

  it('encuentra una palabra con tilde aunque se escriba sin ella, y al revés', async () => {
    expect(await buscar('direccion')).toEqual(['buscar-direccion']);
    expect(await buscar('fóto mándar')).toEqual(['enviar-foto-whatsapp']);
  });

  it('también encuentra con el comienzo de una palabra o con el plural', async () => {
    expect(await buscar('what')).toEqual(['enviar-foto-whatsapp']);
    expect(await buscar('correos')).toEqual([
      'adjuntar-foto-correo',
      'crear-correo',
    ]);
  });

  it('solo trae guías publicadas', async () => {
    expect(await buscar('foto')).toEqual([
      'adjuntar-foto-correo',
      'enviar-foto-whatsapp',
    ]);
  });

  it('se combina con la categoría, el orden y la paginación', async () => {
    expect(await buscar('foto', { categoria: 'correo-electronico' })).toEqual([
      'adjuntar-foto-correo',
    ]);

    const { body } = await request(app.getHttpServer())
      .get(RUTA)
      .query({ q: 'foto', direccion: 'desc', limite: 1 })
      .expect(200);
    expect(body).toMatchObject({ total: 2, pagina: 1, limite: 1 });
    expect(body.datos[0].slug).toBe('enviar-foto-whatsapp');
  });

  it('sin resultados devuelve la lista vacía', async () => {
    const { body } = await request(app.getHttpServer())
      .get(RUTA)
      .query({ q: 'impresora' })
      .expect(200);
    expect(body).toEqual({ datos: [], total: 0, pagina: 1, limite: 20 });
  });

  it('los símbolos no rompen la búsqueda', async () => {
    expect(await buscar("foto & | ! :* ('")).toEqual([
      'adjuntar-foto-correo',
      'enviar-foto-whatsapp',
    ]);
    expect(await buscar('???')).toEqual([]);
  });

  it('una búsqueda vacía no filtra', async () => {
    expect(await buscar('  ')).toHaveLength(4);
  });

  it('rechaza una búsqueda de más de 60 letras', async () => {
    const { body } = await request(app.getHttpServer())
      .get(RUTA)
      .query({ q: 'a'.repeat(61) })
      .expect(400);
    expect(body.codigo).toBe('DATOS_INVALIDOS');
  });
});
