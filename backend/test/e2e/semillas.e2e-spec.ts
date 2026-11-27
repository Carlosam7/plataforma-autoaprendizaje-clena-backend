import { INestApplication } from '@nestjs/common';
import { execSync } from 'node:child_process';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';
import { crearApp, limpiarBaseDatos, sesionPersonal } from './app.js';

const GESTION = '/api/v1/gestion/guias';
// Una guía semilla sin imágenes, para que el PUT solo lleve bloques de texto.
const SLUG = 'vishing';

/** Ejecuta las semillas como lo hace el contenedor al arrancar (DATABASE_URL ya es clena_e2e). */
function sembrar(): void {
  execSync('pnpm prisma db seed', { stdio: 'pipe', env: process.env });
}

describe('BE-07 · Las semillas no pisan lo que editó el personal (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let ana: { id: string; token: string };

  beforeAll(async () => {
    ({ app, prisma } = await crearApp());
  });

  beforeEach(async () => {
    await limpiarBaseDatos(prisma);
    sembrar();
    ana = await sesionPersonal(app, { rol: 'PERSONAL' });
  }, 60_000);

  afterAll(async () => {
    // Deja las semillas completas para los archivos que corren después.
    await limpiarBaseDatos(prisma);
    sembrar();
    await app.close();
  }, 60_000);

  const http = () => request(app.getHttpServer());
  const como = () => ({ Authorization: `Bearer ${ana.token}` });

  const contar = async () => ({
    guias: await prisma.guia.count(),
    pasos: await prisma.paso.count(),
    preguntas: await prisma.pregunta.count(),
    opciones: await prisma.opcion.count(),
  });

  it('volver a sembrar no duplica guías, pasos ni preguntas', async () => {
    const antes = await contar();
    expect(antes.guias).toBeGreaterThan(0);

    sembrar();

    expect(await contar()).toEqual(antes);
  }, 60_000);

  it('conserva la guía y los pasos que el personal editó', async () => {
    const { body: original } = await http()
      .get(`${GESTION}/${SLUG}`)
      .set(como())
      .expect(200);
    const [primero, segundo] = original.pasos;

    await http()
      .put(`${GESTION}/${SLUG}`)
      .set(como())
      .send({
        titulo: 'Llamadas falsas (editada)',
        objetivo: original.objetivo,
        descripcion: original.descripcion,
        categoria: original.categoria,
        nivel: original.nivel,
        duracionEstimadaMin: original.duracionEstimadaMin,
        palabrasClave: original.palabrasClave,
        // Se invierte el orden de dos pasos y se cambia el texto del primero; el resto se quita.
        pasos: [
          { id: segundo.id, titulo: segundo.titulo, bloques: segundo.bloques },
          {
            id: primero.id,
            titulo: 'Paso editado',
            bloques: [
              { tipo: 'texto', texto: 'Texto escrito por el personal.' },
            ],
          },
        ],
      })
      .expect(200);

    sembrar();

    const { body: despues } = await http()
      .get(`${GESTION}/${SLUG}`)
      .set(como())
      .expect(200);
    expect(despues.titulo).toBe('Llamadas falsas (editada)');
    expect(despues.actualizadaPor).toBe('Persona personal');
    expect(despues.pasos).toEqual([
      { ...segundo, orden: 1 },
      {
        id: primero.id,
        orden: 2,
        titulo: 'Paso editado',
        bloques: [{ tipo: 'texto', texto: 'Texto escrito por el personal.' }],
      },
    ]);
  }, 60_000);

  it('una guía que el personal ocultó sigue oculta', async () => {
    await http().post(`${GESTION}/${SLUG}/ocultar`).set(como()).expect(200);

    sembrar();

    const guia = await prisma.guia.findUniqueOrThrow({ where: { slug: SLUG } });
    expect(guia.estado).toBe('OCULTA');
  }, 60_000);

  it('una guía que nadie editó se pone al día con el contenido de la semilla', async () => {
    // Simula una base sembrada con una versión anterior del archivo: el autor sigue siendo
    // la semilla, así que la guía y sus pasos se pueden actualizar.
    const guia = await prisma.guia.update({
      where: { slug: SLUG },
      data: { titulo: 'Título de una semilla vieja' },
      include: { pasos: { orderBy: { orden: 'asc' }, take: 1 } },
    });
    await prisma.paso.update({
      where: { id: guia.pasos[0].id },
      data: { titulo: 'Paso de una semilla vieja' },
    });

    sembrar();

    const actualizada = await prisma.guia.findUniqueOrThrow({
      where: { slug: SLUG },
      include: { pasos: { orderBy: { orden: 'asc' }, take: 1 } },
    });
    expect(actualizada.titulo).not.toBe('Título de una semilla vieja');
    expect(actualizada.pasos[0].id).toBe(guia.pasos[0].id);
    expect(actualizada.pasos[0].titulo).not.toBe('Paso de una semilla vieja');
  }, 60_000);

  it('vuelve a crear una guía semilla que falta, sin tocar las demás', async () => {
    await prisma.guia.delete({ where: { slug: SLUG } });
    const otras = await prisma.guia.findMany({
      select: { id: true },
      orderBy: { slug: 'asc' },
    });

    sembrar();

    expect(await prisma.guia.count({ where: { slug: SLUG } })).toBe(1);
    expect(
      await prisma.guia.findMany({
        where: { slug: { not: SLUG } },
        select: { id: true },
        orderBy: { slug: 'asc' },
      }),
    ).toEqual(otras);
  }, 60_000);
});
