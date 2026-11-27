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
  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

  /** Usuario público con sesión. Espera 2 ms: su cédula sale de Date.now() y no debe repetirse. */
  const usuario = async (): Promise<string> => {
    await new Promise((r) => setTimeout(r, 2));
    return sesionUsuarioPublico(app);
  };

  const iniciar = async (token: string): Promise<string> => {
    const { body } = await http()
      .post(`${GUIAS}/smishing/actividad/intentos`)
      .set(bearer(token))
      .expect(201);
    expect(body.totalPreguntas).toBe(2);
    return body.id as string;
  };

  const opcion = (pregunta: number, acierta: boolean) => {
    const p = preguntas[pregunta - 1];
    return { preguntaId: p.id, opcionId: acierta ? p.correcta : p.incorrecta };
  };

  const responder = (
    intentoId: string,
    pregunta: number,
    acierta: boolean,
    token?: string,
  ) => {
    const peticion = http()
      .post(`/api/v1/intentos/${intentoId}/respuestas`)
      .send(opcion(pregunta, acierta));
    if (token) peticion.set(bearer(token));
    return peticion;
  };

  const evaluar = (cuerpo: object, slug = 'smishing') =>
    http().post(`${GUIAS}/${slug}/actividad/evaluar-respuesta`).send(cuerpo);

  /** Las tablas que un invitado nunca debe llenar (Regla D). */
  const filasDePractica = async () => ({
    intentos: await prisma.intento.count(),
    respuestas: await prisma.respuestaIntento.count(),
    progresos: await prisma.progresoGuia.count(),
    pasosLeidos: await prisma.pasoLeido.count(),
  });
  const NINGUNA = { intentos: 0, respuestas: 0, progresos: 0, pasosLeidos: 0 };

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

  describe('C-04 · POST /guias/:slug/actividad/evaluar-respuesta (sin cuenta)', () => {
    it('da la retroalimentación de cada pregunta y no guarda nada', async () => {
      const { body: fallo } = await evaluar(opcion(1, false)).expect(200);
      expect(fallo).toEqual({
        esCorrecta: false,
        opcionCorrecta: { id: preguntas[0].correcta, texto: 'Correcta' },
        explicacion: 'Explicación 1',
      });
      const { body: acierto } = await evaluar(opcion(2, true)).expect(200);
      expect(acierto).toEqual({
        esCorrecta: true,
        opcionCorrecta: { id: preguntas[1].correcta, texto: 'Correcta' },
        explicacion: 'Explicación 2',
      });

      expect(await filasDePractica()).toEqual(NINGUNA);
    });

    it('no lleva la cuenta: la misma pregunta se puede volver a responder', async () => {
      await evaluar(opcion(1, false)).expect(200);
      await evaluar(opcion(1, true)).expect(200);
    });

    it('con la sesión del personal también funciona y tampoco guarda nada', async () => {
      const ana = await sesionPersonal(app, { rol: 'PERSONAL' });
      await evaluar(opcion(1, true)).set(bearer(ana.token)).expect(200);
      expect(await filasDePractica()).toEqual(NINGUNA);
    });

    it('responde 404 si la pregunta no es de esta guía', async () => {
      const { body } = await evaluar({
        preguntaId: '00000000-0000-4000-8000-000000000000',
        opcionId: preguntas[0].correcta,
      }).expect(404);
      expect(body.codigo).toBe('PREGUNTA_NO_ENCONTRADA');
    });

    it.each(['vishing', 'no-existe'])(
      'responde 404 si «%s» no tiene actividad',
      async (slug) => {
        const { body } = await evaluar(opcion(1, true), slug).expect(404);
        expect(body.codigo).toBe('ACTIVIDAD_NO_ENCONTRADA');
      },
    );

    it('responde 400 si la opción no es de esa pregunta', async () => {
      const { body } = await evaluar({
        preguntaId: preguntas[0].id,
        opcionId: preguntas[1].correcta,
      }).expect(400);
      expect(body.codigo).toBe('RESPUESTA_INVALIDA');
    });

    it('responde 400 si los ids no tienen formato válido', async () => {
      const { body } = await evaluar({ preguntaId: 'x', opcionId: 'y' }).expect(
        400,
      );
      expect(body.codigo).toBe('DATOS_INVALIDOS');
    });
  });

  describe('intentos guardados (solo usuario público)', () => {
    it('sin sesión responde 401 y no crea nada', async () => {
      await http().post(`${GUIAS}/smishing/actividad/intentos`).expect(401);
      expect(await filasDePractica()).toEqual(NINGUNA);
    });

    it('el personal recibe 403: practica con evaluar-respuesta', async () => {
      const ana = await sesionPersonal(app, { rol: 'PERSONAL' });
      await http()
        .post(`${GUIAS}/smishing/actividad/intentos`)
        .set(bearer(ana.token))
        .expect(403);
      expect(await filasDePractica()).toEqual(NINGUNA);
    });

    it('cada respuesta trae la retroalimentación y la última, el resultado', async () => {
      const token = await usuario();
      const intentoId = await iniciar(token);

      const { body: primera } = await responder(
        intentoId,
        1,
        false,
        token,
      ).expect(201);
      expect(primera).toEqual({
        esCorrecta: false,
        opcionCorrecta: { id: preguntas[0].correcta, texto: 'Correcta' },
        explicacion: 'Explicación 1',
        respondidas: 1,
        totalPreguntas: 2,
        resultado: null,
      });

      const { body: ultima } = await responder(
        intentoId,
        2,
        true,
        token,
      ).expect(201);
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
        respuestasCorrectas: 1,
        porcentaje: 50,
        aprobado: false,
      });
      expect(intento.usuarioId).toMatch(/^9\d+$/);
      expect(intento.finalizadoEn).not.toBeNull();
      expect(intento.respuestas).toHaveLength(2);
    });

    it('si no aprobó puede repetirla con otro intento', async () => {
      const token = await usuario();
      const primero = await iniciar(token);
      await responder(primero, 1, false, token).expect(201);
      await responder(primero, 2, false, token).expect(201);
      await responder(primero, 1, true, token).expect(409);

      const segundo = await iniciar(token);
      expect(segundo).not.toBe(primero);
      await responder(segundo, 1, true, token).expect(201);
      const { body } = await responder(segundo, 2, true, token).expect(201);
      expect(body.resultado).toMatchObject({ porcentaje: 100, aprobado: true });
    });

    it('no deja responder dos veces la misma pregunta, ni con doble clic', async () => {
      const token = await usuario();
      const intentoId = await iniciar(token);
      const [a, b] = await Promise.all([
        responder(intentoId, 1, true, token),
        responder(intentoId, 1, false, token),
      ]);
      expect([a.status, b.status].sort((x, y) => x - y)).toEqual([201, 409]);
      expect((a.status === 409 ? a : b).body.codigo).toBe(
        'PREGUNTA_YA_RESPONDIDA',
      );
      expect(await prisma.respuestaIntento.count()).toBe(1);
    });

    it('responde 409 si el intento ya terminó', async () => {
      const token = await usuario();
      const intentoId = await iniciar(token);
      await responder(intentoId, 1, true, token).expect(201);
      await responder(intentoId, 2, true, token).expect(201);
      const { body } = await responder(intentoId, 2, true, token).expect(409);
      expect(body.codigo).toBe('INTENTO_FINALIZADO');
    });

    it('responde 400 si la opción no es de esa pregunta', async () => {
      const token = await usuario();
      const intentoId = await iniciar(token);
      const { body } = await http()
        .post(`/api/v1/intentos/${intentoId}/respuestas`)
        .set(bearer(token))
        .send({ preguntaId: preguntas[0].id, opcionId: preguntas[1].correcta })
        .expect(400);
      expect(body.codigo).toBe('RESPUESTA_INVALIDA');
    });

    it('responde 400 si los ids no tienen formato válido', async () => {
      const token = await usuario();
      const { body } = await http()
        .post('/api/v1/intentos/no-es-uuid/respuestas')
        .set(bearer(token))
        .send({ preguntaId: 'x', opcionId: 'y' })
        .expect(400);
      expect(body.codigo).toBe('DATOS_INVALIDOS');
    });

    it('responde 404 si el intento no existe', async () => {
      const token = await usuario();
      const { body } = await responder(
        '00000000-0000-4000-8000-000000000000',
        1,
        true,
        token,
      ).expect(404);
      expect(body.codigo).toBe('INTENTO_NO_ENCONTRADO');
    });

    it('nadie más responde el intento de otra cuenta', async () => {
      const token = await usuario();
      const otro = await usuario();
      const intentoId = await iniciar(token);

      await responder(intentoId, 1, true).expect(401);
      await responder(intentoId, 1, true, 'token-falso').expect(401);
      const { body } = await responder(intentoId, 1, true, otro).expect(404);
      expect(body.codigo).toBe('INTENTO_NO_ENCONTRADO');
      await responder(intentoId, 1, true, token).expect(201);
    });
  });
});
