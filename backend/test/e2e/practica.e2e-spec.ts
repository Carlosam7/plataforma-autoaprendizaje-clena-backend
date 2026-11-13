import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';
import {
  crearApp,
  limpiarBaseDatos,
  sesionPersonal,
  sesionUsuarioPublico,
} from './app.js';

const GUIAS = '/api/v1/guias';

describe('HU-21 · Resolver una pregunta con retroalimentación inmediata (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  /** Ids de las opciones por pregunta: `opciones[0].correcta` es la correcta de la pregunta 1. */
  let preguntas: { id: string; correcta: string; incorrecta: string }[];

  beforeAll(async () => {
    ({ app, prisma } = await crearApp());
  });

  beforeEach(async () => {
    await limpiarBaseDatos(prisma);
    const autor = await sesionPersonal(app, { rol: 'PERSONAL' });
    const comun = {
      categoriaId: 1,
      nivel: 'BASICO' as const,
      duracionEstimadaMin: 8,
      creadaPorId: autor.id,
      actualizadaPorId: autor.id,
    };
    const guia = await prisma.guia.create({
      data: {
        ...comun,
        slug: 'smishing',
        titulo: 'Smishing',
        objetivo: 'Al terminar sabrás reconocer un SMS falso.',
        estado: 'PUBLICADA',
      },
    });
    await prisma.guia.create({
      data: {
        ...comun,
        slug: 'vishing',
        titulo: 'Vishing',
        objetivo: 'x',
        estado: 'PUBLICADA',
      },
    });
    const actividad = await prisma.actividad.create({
      data: {
        guiaId: guia.id,
        titulo: 'Practica: smishing',
        creadaPorId: autor.id,
        actualizadaPorId: autor.id,
      },
    });
    preguntas = [];
    // Se crean en desorden: la actividad debe traerlas por `orden`.
    for (const orden of [2, 1]) {
      const pregunta = await prisma.pregunta.create({
        data: {
          actividadId: actividad.id,
          orden,
          enunciado: `Pregunta ${orden}`,
          explicacion: `Explicación ${orden}`,
          opciones: {
            create: [
              { orden: 1, texto: 'Incorrecta', esCorrecta: false },
              { orden: 2, texto: 'Correcta', esCorrecta: true },
            ],
          },
        },
        include: { opciones: true },
      });
      const id = (correcta: boolean) =>
        pregunta.opciones.find((o) => o.esCorrecta === correcta)!.id;
      preguntas[orden - 1] = {
        id: pregunta.id,
        correcta: id(true),
        incorrecta: id(false),
      };
    }
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  const iniciar = async (token?: string): Promise<string> => {
    const peticion = http().post(`${GUIAS}/smishing/actividad/intentos`);
    if (token) peticion.set('Authorization', `Bearer ${token}`);
    const { body } = await peticion.expect(201);
    expect(body.totalPreguntas).toBe(2);
    return body.id as string;
  };

  const responder = (
    intentoId: string,
    pregunta: number,
    acierta: boolean,
    token?: string,
  ) => {
    const p = preguntas[pregunta - 1];
    const peticion = http()
      .post(`/api/v1/intentos/${intentoId}/respuestas`)
      .send({
        preguntaId: p.id,
        opcionId: acierta ? p.correcta : p.incorrecta,
      });
    if (token) peticion.set('Authorization', `Bearer ${token}`);
    return peticion;
  };

  describe('GET /guias/:slug/actividad', () => {
    it('devuelve las preguntas en orden sin decir cuál es la correcta', async () => {
      const { body } = await http()
        .get(`${GUIAS}/smishing/actividad`)
        .expect(200);
      expect(body).toEqual({
        titulo: 'Practica: smishing',
        porcentajeAprobacion: 70,
        totalPreguntas: 2,
        preguntas: [1, 2].map((n) => ({
          id: preguntas[n - 1].id,
          enunciado: `Pregunta ${n}`,
          opciones: [
            { id: preguntas[n - 1].incorrecta, texto: 'Incorrecta' },
            { id: preguntas[n - 1].correcta, texto: 'Correcta' },
          ],
        })),
      });
    });

    it.each(['vishing', 'no-existe'])(
      'responde 404 si «%s» no tiene actividad',
      async (slug) => {
        const { body } = await http()
          .get(`${GUIAS}/${slug}/actividad`)
          .expect(404);
        expect(body.codigo).toBe('ACTIVIDAD_NO_ENCONTRADA');
      },
    );
  });

  describe('responder la actividad', () => {
    it('sin sesión: cada respuesta trae la retroalimentación y la última, el resultado', async () => {
      const intentoId = await iniciar();

      const { body: primera } = await responder(intentoId, 1, false).expect(
        201,
      );
      expect(primera).toEqual({
        esCorrecta: false,
        opcionCorrecta: { id: preguntas[0].correcta, texto: 'Correcta' },
        explicacion: 'Explicación 1',
        respondidas: 1,
        totalPreguntas: 2,
        resultado: null,
      });

      const { body: ultima } = await responder(intentoId, 2, true).expect(201);
      expect(ultima).toMatchObject({
        esCorrecta: true,
        respondidas: 2,
        resultado: {
          respuestasCorrectas: 1,
          totalPreguntas: 2,
          porcentaje: 50,
          aprobado: false,
          porcentajeAprobacion: 70,
        },
      });

      const intento = await prisma.intento.findUniqueOrThrow({
        where: { id: intentoId },
        include: { respuestas: true },
      });
      expect(intento).toMatchObject({
        usuarioId: null,
        respuestasCorrectas: 1,
        porcentaje: 50,
        aprobado: false,
      });
      expect(intento.finalizadoEn).not.toBeNull();
      expect(intento.respuestas).toHaveLength(2);
    });

    it('si no aprobó puede repetirla con otro intento', async () => {
      const primero = await iniciar();
      await responder(primero, 1, false).expect(201);
      await responder(primero, 2, false).expect(201);
      await responder(primero, 1, true).expect(409);

      const segundo = await iniciar();
      expect(segundo).not.toBe(primero);
      await responder(segundo, 1, true).expect(201);
      const { body } = await responder(segundo, 2, true).expect(201);
      expect(body.resultado).toMatchObject({ porcentaje: 100, aprobado: true });
    });

    it('no deja responder dos veces la misma pregunta, ni con doble clic', async () => {
      const intentoId = await iniciar();
      const [a, b] = await Promise.all([
        responder(intentoId, 1, true),
        responder(intentoId, 1, false),
      ]);
      expect([a.status, b.status].sort((x, y) => x - y)).toEqual([201, 409]);
      expect((a.status === 409 ? a : b).body.codigo).toBe(
        'PREGUNTA_YA_RESPONDIDA',
      );
      expect(await prisma.respuestaIntento.count()).toBe(1);
    });

    it('responde 409 si el intento ya terminó', async () => {
      const intentoId = await iniciar();
      await responder(intentoId, 1, true).expect(201);
      await responder(intentoId, 2, true).expect(201);
      const { body } = await responder(intentoId, 2, true).expect(409);
      expect(body.codigo).toBe('INTENTO_FINALIZADO');
    });

    it('responde 400 si la opción no es de esa pregunta', async () => {
      const intentoId = await iniciar();
      const { body } = await http()
        .post(`/api/v1/intentos/${intentoId}/respuestas`)
        .send({ preguntaId: preguntas[0].id, opcionId: preguntas[1].correcta })
        .expect(400);
      expect(body.codigo).toBe('RESPUESTA_INVALIDA');
    });

    it('responde 400 si los ids no tienen formato válido', async () => {
      const { body } = await http()
        .post('/api/v1/intentos/no-es-uuid/respuestas')
        .send({ preguntaId: 'x', opcionId: 'y' })
        .expect(400);
      expect(body.codigo).toBe('DATOS_INVALIDOS');
    });

    it('responde 404 si el intento no existe', async () => {
      const { body } = await responder(
        '00000000-0000-4000-8000-000000000000',
        1,
        true,
      ).expect(404);
      expect(body.codigo).toBe('INTENTO_NO_ENCONTRADO');
    });

    it('con sesión de usuario público el intento es suyo y nadie más lo responde', async () => {
      const token = await sesionUsuarioPublico(app);
      const intentoId = await iniciar(token);

      await responder(intentoId, 1, true).expect(404);
      await responder(intentoId, 1, true, 'token-falso').expect(404);
      await responder(intentoId, 1, true, token).expect(201);

      const intento = await prisma.intento.findUniqueOrThrow({
        where: { id: intentoId },
      });
      expect(intento.usuarioId).not.toBeNull();
    });
  });
});
