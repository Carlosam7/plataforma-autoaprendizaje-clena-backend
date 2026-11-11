import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../../src/app.module.js';
import { configurarApp } from '../../src/app.setup.js';
import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';

// Necesita PostgreSQL con las migraciones aplicadas (DATABASE_URL).
// Usa filas propias con slug "e2e-..." para no depender de los datos semilla.
const FILAS = [
  { id: 901, slug: 'e2e-alfa', nombre: 'E2E Alfa', icono: 'a', orden: 91 },
  { id: 902, slug: 'e2e-beta', nombre: 'E2E Beta', icono: 'b', orden: 92 },
  { id: 903, slug: 'e2e-gama', nombre: 'E2E Gama', icono: 'c', orden: 93 },
];

describe('API categorías (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = modulo.createNestApplication();
    await configurarApp(app);

    prisma = app.get(PrismaService);
    await prisma.categoria.deleteMany({
      where: { slug: { startsWith: 'e2e-' } },
    });
    await prisma.categoria.createMany({ data: FILAS });
  });

  afterAll(async () => {
    await prisma.categoria.deleteMany({
      where: { slug: { startsWith: 'e2e-' } },
    });
    await app.close();
  });

  it('GET /api/v1/health responde ok', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('lista con filtro, orden y paginación, sin exponer id ni orden', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/categorias')
      .query({ q: 'e2e', ordenarPor: 'nombre', direccion: 'desc', limite: 2 })
      .expect(200);

    expect(res.body).toEqual({
      datos: [
        { slug: 'e2e-gama', nombre: 'E2E Gama', icono: 'c' },
        { slug: 'e2e-beta', nombre: 'E2E Beta', icono: 'b' },
      ],
      total: 3,
      pagina: 1,
      limite: 2,
    });
  });

  it('la segunda página trae el resto', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/categorias')
      .query({ q: 'e2e', limite: 2, pagina: 2 })
      .expect(200);

    expect(res.body.datos).toEqual([
      { slug: 'e2e-gama', nombre: 'E2E Gama', icono: 'c' },
    ]);
  });

  it('rechaza un límite fuera de rango con el formato de error uniforme', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/categorias')
      .query({ limite: 500 })
      .expect(400);

    expect(res.body).toMatchObject({
      statusCode: 400,
      codigo: 'DATOS_INVALIDOS',
      ruta: '/api/v1/categorias?limite=500',
    });
  });

  it('rechaza ordenar por un campo no permitido', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/categorias')
      .query({ ordenarPor: 'id' })
      .expect(400);
  });

  it('rechaza parámetros desconocidos', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/categorias')
      .query({ campoRaro: 1 })
      .expect(400);
  });

  it('una ruta inexistente responde 404 en JSON', async () => {
    const res = await request(app.getHttpServer())
      .get('/no-existe')
      .expect(404);
    expect(res.body.codigo).toBe('NO_ENCONTRADO');
  });
});
