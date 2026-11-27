import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { EmisorSesion } from '../../src/application/auth/emisor-sesion.port.js';
import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';
import { crearApp, limpiarBaseDatos, sesionPersonal } from './app.js';

const CARMEN = '41234567';
const RAFAEL = '52345678';

describe('HU-23 · Ver mi progreso (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let carmen: string;
  let rafael: string;
  let monitor: { id: string; token: string };
  /** Preguntas de la actividad de «smishing», con el id de su opción correcta y de la incorrecta. */
  let preguntas: { id: string; correcta: string; incorrecta: string }[];

  beforeAll(async () => {
    ({ app, prisma } = await crearApp());
  });

  async function crearUsuario(id: string): Promise<string> {
    await prisma.usuarioPublico.create({
      data: {
        numeroIdentificacion: id,
        nombre: 'Carmen Ruiz',
        fechaNacimiento: new Date('1958-06-20'),
      },
    });
    const sesion = await app
      .get(EmisorSesion)
      .iniciar({ id, rol: 'USUARIO_PUBLICO' });
    return sesion.accessToken;
  }

  beforeEach(async () => {
    await limpiarBaseDatos(prisma);
    monitor = await sesionPersonal(app, { rol: 'PERSONAL' });
    carmen = await crearUsuario(CARMEN);
    rafael = await crearUsuario(RAFAEL);

    const guia = (
      slug: string,
      titulo: string,
      categoriaId: number,
      pasos: number,
      estado: 'PUBLICADA' | 'BORRADOR' = 'PUBLICADA',
    ) =>
      prisma.guia.create({
        data: {
          slug,
          titulo,
          categoriaId,
          objetivo: 'Al terminar sabrás hacerlo.',
          nivel: 'BASICO',
          duracionEstimadaMin: 8,
          estado,
          creadaPorId: monitor.id,
          actualizadaPorId: monitor.id,
          pasos: {
            create: Array.from({ length: pasos }, (_, i) => ({
              orden: i + 1,
              contenido: { version: 1, bloques: [] },
            })),
          },
        },
      });
    // Categorías semilla: 1 = seguridad-digital, 2 = correo-electronico.
    const smishing = await guia('smishing', 'Smishing', 1, 3);
    await guia('enviar-un-correo', 'Enviar un correo', 2, 2);
    await guia('en-borrador', 'Borrador', 1, 1, 'BORRADOR');

    const actividad = await prisma.actividad.create({
      data: {
        guiaId: smishing.id,
        titulo: 'Practica',
        creadaPorId: monitor.id,
        actualizadaPorId: monitor.id,
        preguntas: {
          create: [1, 2].map((orden) => ({
            orden,
            enunciado: `Pregunta ${orden}`,
            explicacion: 'Porque sí.',
            opciones: {
              create: [
                { orden: 1, texto: 'Correcta', esCorrecta: true },
                { orden: 2, texto: 'Incorrecta', esCorrecta: false },
              ],
            },
          })),
        },
      },
      include: {
        preguntas: { orderBy: { orden: 'asc' }, include: { opciones: true } },
      },
    });
    preguntas = actividad.preguntas.map((p) => ({
      id: p.id,
      correcta: p.opciones.find((o) => o.esCorrecta)!.id,
      incorrecta: p.opciones.find((o) => !o.esCorrecta)!.id,
    }));
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const con = (token: string) => ({ Authorization: `Bearer ${token}` });
  const leer = (slug: string, orden: number | string, token = carmen) =>
    http().post(`/api/v1/guias/${slug}/pasos/${orden}/lectura`).set(con(token));
  const leerTodos = async (slug: string, pasos: number, token = carmen) => {
    for (let orden = 1; orden <= pasos; orden++) {
      await leer(slug, orden, token).expect(200);
    }
  };
  /** Progreso del usuario por guía: { smishing: {...}, 'enviar-un-correo': {...} }. */
  const miProgreso = async (
    token = carmen,
  ): Promise<Record<string, Record<string, unknown>>> => {
    const { body } = await http()
      .get('/api/v1/progreso')
      .set(con(token))
      .expect(200);
    return Object.fromEntries(
      body.datos.map((g: { slug: string }) => [g.slug, g]),
    );
  };
  /** Hace la actividad de «smishing» completa con esa sesión. */
  const practicar = async (aciertos: [boolean, boolean], token = carmen) => {
    const { body } = await http()
      .post('/api/v1/guias/smishing/actividad/intentos')
      .set(con(token))
      .expect(201);
    for (const [i, acierta] of aciertos.entries()) {
      await http()
        .post(`/api/v1/intentos/${body.id}/respuestas`)
        .set(con(token))
        .send({
          preguntaId: preguntas[i].id,
          opcionId: acierta ? preguntas[i].correcta : preguntas[i].incorrecta,
        })
        .expect(201);
    }
  };

  describe('GET /progreso', () => {
    it('trae todas las guías publicadas, en 0 % las que no ha empezado', async () => {
      const { body } = await http()
        .get('/api/v1/progreso')
        .set(con(carmen))
        .expect(200);
      expect(body).toEqual({
        datos: [
          {
            slug: 'enviar-un-correo',
            categoria: 'correo-electronico',
            titulo: 'Enviar un correo',
            nivel: 'BASICO',
            totalPasos: 2,
            pasosLeidos: 0,
            porcentaje: 0,
            estado: 'SIN_EMPEZAR',
            completada: false,
            tieneActividad: false,
            actividadAprobada: false,
            ultimoPaso: null,
            completadaEn: null,
          },
          {
            slug: 'smishing',
            categoria: 'seguridad-digital',
            titulo: 'Smishing',
            nivel: 'BASICO',
            totalPasos: 3,
            pasosLeidos: 0,
            porcentaje: 0,
            estado: 'SIN_EMPEZAR',
            completada: false,
            tieneActividad: true,
            actividadAprobada: false,
            ultimoPaso: null,
            completadaEn: null,
          },
        ],
        total: 2,
        pagina: 1,
        limite: 20,
      });
    });

    it('filtra por categoría y pagina', async () => {
      const slugs = async (consulta: Record<string, string | number>) => {
        const { body } = await http()
          .get('/api/v1/progreso')
          .query(consulta)
          .set(con(carmen))
          .expect(200);
        return [body.datos.map((g: { slug: string }) => g.slug), body.total];
      };
      expect(await slugs({ categoria: 'seguridad-digital' })).toEqual([
        ['smishing'],
        1,
      ]);
      expect(await slugs({ direccion: 'desc', limite: 1 })).toEqual([
        ['smishing'],
        2,
      ]);
      await http()
        .get('/api/v1/progreso')
        .query({ ordenarPor: 'estado' })
        .set(con(carmen))
        .expect(400);
    });

    it('responde 401 sin sesión y 403 al personal', async () => {
      await http().get('/api/v1/progreso').expect(401);
      await http().get('/api/v1/progreso').set(con(monitor.token)).expect(403);
    });
  });

  describe('POST /guias/:slug/pasos/:orden/lectura', () => {
    it('anota el paso leído y devuelve el progreso de la guía', async () => {
      const { body } = await leer('smishing', 2).expect(200);
      expect(body).toMatchObject({
        slug: 'smishing',
        totalPasos: 3,
        pasosLeidos: 1,
        porcentaje: 25,
        estado: 'EN_CURSO',
        ultimoPaso: 2,
        completada: false,
      });

      const leidos = await prisma.pasoLeido.findMany({
        include: { paso: true },
      });
      expect(leidos.map((l) => [l.usuarioId, l.paso.orden])).toEqual([
        [CARMEN, 2],
      ]);
      const progreso = await prisma.progresoGuia.findFirstOrThrow({
        include: { ultimoPaso: true },
      });
      expect(progreso).toMatchObject({ usuarioId: CARMEN, completada: false });
      expect(progreso.ultimoPaso?.orden).toBe(2);
    });

    it('leer el mismo paso otra vez no lo cuenta dos veces', async () => {
      await leer('smishing', 1).expect(200);
      const { body } = await leer('smishing', 1).expect(200);
      expect(body.pasosLeidos).toBe(1);
      expect(await prisma.pasoLeido.count()).toBe(1);
    });

    it('una guía sin actividad se completa al leer hasta el último paso', async () => {
      await leer('enviar-un-correo', 1).expect(200);
      const { body } = await leer('enviar-un-correo', 2).expect(200);
      expect(body).toMatchObject({
        porcentaje: 100,
        estado: 'COMPLETADA',
        completada: true,
        completadaEn: expect.any(String),
      });
      const progreso = await prisma.progresoGuia.findFirstOrThrow();
      expect(progreso.completada).toBe(true);
      expect(progreso.completadaEn).not.toBeNull();
    });

    it('el progreso es de cada usuario', async () => {
      await leerTodos('enviar-un-correo', 2, carmen);
      expect((await miProgreso(rafael))['enviar-un-correo']).toMatchObject({
        porcentaje: 0,
        estado: 'SIN_EMPEZAR',
      });
    });

    it.each([
      ['el paso no existe', 'smishing', 9, 404],
      ['la guía no existe', 'no-existe', 1, 404],
      ['la guía es un borrador', 'en-borrador', 1, 404],
      ['el número de paso no es válido', 'smishing', 0, 400],
      ['el paso no es un número', 'smishing', 'dos', 400],
    ])('responde error si %s', async (_, slug, orden, estado) => {
      await leer(slug, orden).expect(estado);
      expect(await prisma.pasoLeido.count()).toBe(0);
    });

    it('responde 401 sin sesión y 403 al personal', async () => {
      await http().post('/api/v1/guias/smishing/pasos/1/lectura').expect(401);
      await leer('smishing', 1, monitor.token).expect(403);
    });
  });

  describe('guía con actividad', () => {
    it('leer todos los pasos no la completa: falta aprobar la actividad', async () => {
      await leerTodos('smishing', 3);
      expect((await miProgreso()).smishing).toMatchObject({
        pasosLeidos: 3,
        porcentaje: 75,
        estado: 'EN_CURSO',
        completada: false,
        actividadAprobada: false,
      });
    });

    it('queda completada al leer todos los pasos y aprobar la actividad', async () => {
      await leerTodos('smishing', 3);
      await practicar([true, true]);

      expect((await miProgreso()).smishing).toMatchObject({
        porcentaje: 100,
        estado: 'COMPLETADA',
        completada: true,
        actividadAprobada: true,
        completadaEn: expect.any(String),
      });
      const progreso = await prisma.progresoGuia.findFirstOrThrow({
        where: { usuarioId: CARMEN },
      });
      expect(progreso.completada).toBe(true);
    });

    it('también si primero aprueba la actividad y después termina de leer', async () => {
      await practicar([true, true]);
      expect((await miProgreso()).smishing).toMatchObject({
        porcentaje: 25,
        estado: 'EN_CURSO',
        completada: false,
      });
      await leerTodos('smishing', 3);
      expect((await miProgreso()).smishing).toMatchObject({
        porcentaje: 100,
        completada: true,
      });
    });

    it('un intento que no aprueba no la completa', async () => {
      await leerTodos('smishing', 3);
      await practicar([true, false]);
      expect((await miProgreso()).smishing).toMatchObject({
        porcentaje: 75,
        completada: false,
        actividadAprobada: false,
      });
    });

    it('la actividad que aprueba otra persona no cuenta para mí', async () => {
      await leerTodos('smishing', 3);
      await practicar([true, true], rafael);
      expect((await miProgreso()).smishing).toMatchObject({
        completada: false,
        actividadAprobada: false,
      });
    });
  });

  describe('BE-03 · casos del contrato C-10', () => {
    const GESTION = '/api/v1/gestion/guias';
    const comoMonitor = () => con(monitor.token);

    /** Reemplaza los pasos de una guía desde la gestión (HU-13), en el orden de `ids`. */
    const guardarPasos = async (slug: string, ids: (string | undefined)[]) => {
      const { body: g } = await http()
        .get(`${GESTION}/${slug}`)
        .set(comoMonitor())
        .expect(200);
      await http()
        .put(`${GESTION}/${slug}`)
        .set(comoMonitor())
        .send({
          titulo: g.titulo,
          objetivo: g.objetivo,
          categoria: g.categoria,
          nivel: g.nivel,
          duracionEstimadaMin: g.duracionEstimadaMin,
          palabrasClave: g.palabrasClave,
          // Cada paso necesita al menos un bloque (regla de la gestión de guías).
          pasos: ids.map((id) => ({
            ...(id ? { id } : {}),
            bloques: [{ tipo: 'texto', texto: 'Lee con calma.' }],
          })),
        })
        .expect(200);
    };
    const idsDePasos = async (slug: string): Promise<string[]> =>
      (
        await prisma.paso.findMany({
          where: { guia: { slug } },
          orderBy: { orden: 'asc' },
          select: { id: true },
        })
      ).map((p) => p.id);

    it('un invitado recibe 401 y no se guarda nada', async () => {
      await http().post('/api/v1/guias/smishing/pasos/1/lectura').expect(401);
      await http().get('/api/v1/progreso').expect(401);
      expect(await prisma.pasoLeido.count()).toBe(0);
      expect(await prisma.progresoGuia.count()).toBe(0);
    });

    it('el progreso sigue ahí en una sesión nueva (cerrar e iniciar sesión)', async () => {
      await leer('enviar-un-correo', 1).expect(200);
      const nueva = await app
        .get(EmisorSesion)
        .iniciar({ id: CARMEN, rol: 'USUARIO_PUBLICO' });
      expect(
        (await miProgreso(nueva.accessToken))['enviar-un-correo'],
      ).toMatchObject({ pasosLeidos: 1, ultimoPaso: 1 });
    });

    it('si el personal reordena los pasos, lo leído se conserva y ultimoPaso trae el número nuevo', async () => {
      const [primero, segundo] = await idsDePasos('enviar-un-correo');
      await leer('enviar-un-correo', 1).expect(200);

      await guardarPasos('enviar-un-correo', [segundo, primero]);

      expect((await miProgreso())['enviar-un-correo']).toMatchObject({
        pasosLeidos: 1,
        // El paso que leyó ahora es el número 2.
        ultimoPaso: 2,
      });
      // «Paso 1» ahora es el otro: leerlo cuenta como un paso distinto.
      const { body } = await leer('enviar-un-correo', 1).expect(200);
      expect(body).toMatchObject({ pasosLeidos: 2, completada: true });
    });

    it('si el personal quita un paso leído, deja de contar', async () => {
      const [primero, segundo] = await idsDePasos('enviar-un-correo');
      await leer('enviar-un-correo', 1).expect(200);

      await guardarPasos('enviar-un-correo', [segundo]);

      expect((await miProgreso())['enviar-un-correo']).toMatchObject({
        totalPasos: 1,
        pasosLeidos: 0,
        ultimoPaso: null,
      });
      expect(await prisma.pasoLeido.count({ where: { pasoId: primero } })).toBe(
        0,
      );
    });

    it('D-03: si a una guía completada le agregan un paso, vuelve a EN_CURSO y conserva completadaEn', async () => {
      await leerTodos('enviar-un-correo', 2);
      const antes = (await miProgreso())['enviar-un-correo'];
      expect(antes).toMatchObject({ completada: true, estado: 'COMPLETADA' });

      await guardarPasos('enviar-un-correo', [
        ...(await idsDePasos('enviar-un-correo')),
        undefined,
      ]);

      expect((await miProgreso())['enviar-un-correo']).toMatchObject({
        totalPasos: 3,
        pasosLeidos: 2,
        porcentaje: 66,
        completada: false,
        estado: 'EN_CURSO',
        // Fecha de la primera vez que la completó.
        completadaEn: antes.completadaEn,
      });
    });

    it('una guía oculta no sale en «Mi progreso» ni deja leer pasos, y al volver a publicarla el progreso sigue', async () => {
      await leer('enviar-un-correo', 1).expect(200);

      await http()
        .post(`${GESTION}/enviar-un-correo/ocultar`)
        .set(comoMonitor())
        .expect(200);
      expect(await miProgreso()).not.toHaveProperty('enviar-un-correo');
      const { body } = await leer('enviar-un-correo', 2).expect(404);
      expect(body.codigo).toBe('PASO_NO_ENCONTRADO');

      await http()
        .post(`${GESTION}/enviar-un-correo/publicar`)
        .set(comoMonitor())
        .expect(200);
      expect((await miProgreso())['enviar-un-correo']).toMatchObject({
        pasosLeidos: 1,
        ultimoPaso: 1,
      });
    });
  });
});
