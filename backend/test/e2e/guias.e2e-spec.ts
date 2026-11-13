import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';
import { crearApp, limpiarBaseDatos, sesionPersonal } from './app.js';

const RUTA = '/api/v1/guias';

describe('HU-09 · Explorar guías por categoría (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await crearApp());
  });

  beforeEach(async () => {
    await limpiarBaseDatos(prisma);
    const autor = await sesionPersonal(app, { rol: 'PERSONAL' });
    const comun = {
      nivel: 'BASICO' as const,
      creadaPorId: autor.id,
      actualizadaPorId: autor.id,
    };
    // Categorías semilla: 1 = phishing, 2 = correo-electronico, 3 = busqueda-internet.
    await prisma.guia.createMany({
      data: [
        {
          ...comun,
          slug: 'smishing',
          categoriaId: 1,
          titulo: 'Smishing',
          objetivo: 'Al terminar sabrás reconocer un SMS falso.',
          duracionEstimadaMin: 8,
          estado: 'PUBLICADA',
        },
        {
          ...comun,
          slug: 'vishing',
          categoriaId: 1,
          titulo: 'Vishing',
          objetivo: 'Al terminar sabrás qué hacer ante una llamada falsa.',
          nivel: 'INTERMEDIO',
          duracionEstimadaMin: 5,
          estado: 'PUBLICADA',
        },
        {
          ...comun,
          slug: 'borrador-phishing',
          categoriaId: 1,
          titulo: 'Aún en borrador',
          objetivo: 'No se debe ver.',
          duracionEstimadaMin: 3,
        },
        {
          ...comun,
          slug: 'oculta-phishing',
          categoriaId: 1,
          titulo: 'Oculta',
          objetivo: 'Tampoco se debe ver.',
          duracionEstimadaMin: 3,
          estado: 'OCULTA',
        },
        {
          ...comun,
          slug: 'enviar-un-correo',
          categoriaId: 2,
          titulo: 'Enviar un correo',
          objetivo: 'Al terminar sabrás enviar un correo.',
          duracionEstimadaMin: 10,
          estado: 'PUBLICADA',
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  it('sin iniciar sesión, lista las guías publicadas de la categoría con título, nivel y duración', async () => {
    const { body } = await http()
      .get(RUTA)
      .query({ categoria: 'phishing' })
      .expect(200);

    expect(body).toEqual({
      datos: [
        {
          slug: 'smishing',
          categoria: 'phishing',
          titulo: 'Smishing',
          objetivo: 'Al terminar sabrás reconocer un SMS falso.',
          nivel: 'BASICO',
          duracionEstimadaMin: 8,
        },
        {
          slug: 'vishing',
          categoria: 'phishing',
          titulo: 'Vishing',
          objetivo: 'Al terminar sabrás qué hacer ante una llamada falsa.',
          nivel: 'INTERMEDIO',
          duracionEstimadaMin: 5,
        },
      ],
      total: 2,
      pagina: 1,
      limite: 20,
    });
  });

  it('una categoría sin guías publicadas devuelve la lista vacía', async () => {
    const { body } = await http()
      .get(RUTA)
      .query({ categoria: 'busqueda-internet' })
      .expect(200);
    expect(body).toEqual({ datos: [], total: 0, pagina: 1, limite: 20 });
  });

  it('sin categoría lista todas las publicadas, con orden y paginación', async () => {
    const { body } = await http()
      .get(RUTA)
      .query({
        ordenarPor: 'duracionEstimadaMin',
        direccion: 'desc',
        limite: 2,
      })
      .expect(200);
    expect(body.total).toBe(3);
    expect(body.datos.map((g: { slug: string }) => g.slug)).toEqual([
      'enviar-un-correo',
      'smishing',
    ]);
  });

  it('rechaza ordenar por un campo no permitido', async () => {
    const { body } = await http()
      .get(RUTA)
      .query({ ordenarPor: 'estado' })
      .expect(400);
    expect(body.codigo).toBe('DATOS_INVALIDOS');
  });
});
