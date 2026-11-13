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

const RUTA = '/api/v1/solicitudes-ayuda';

describe('HU-29 · Solicitar ayuda presencial (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let monitor: { id: string; token: string };
  let guiaId: string;
  let pasoId: string;

  beforeAll(async () => {
    ({ app, prisma } = await crearApp());
  });

  beforeEach(async () => {
    await limpiarBaseDatos(prisma);
    monitor = await sesionPersonal(app, { rol: 'PERSONAL' });
    const guia = await prisma.guia.create({
      data: {
        slug: 'smishing',
        categoriaId: 1,
        titulo: 'Smishing',
        objetivo: 'Al terminar sabrás reconocer un SMS falso.',
        nivel: 'BASICO',
        duracionEstimadaMin: 8,
        estado: 'PUBLICADA',
        creadaPorId: monitor.id,
        actualizadaPorId: monitor.id,
        pasos: {
          create: [1, 2].map((orden) => ({
            orden,
            contenido: { version: 1, bloques: [] },
          })),
        },
      },
      include: { pasos: true },
    });
    guiaId = guia.id;
    pasoId = guia.pasos.find((p) => p.orden === 2)!.id;
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const pedir = (cuerpo: Record<string, unknown>) =>
    http()
      .post(RUTA)
      .send({ tema: 'CORREO', ...cuerpo });

  describe('POST /solicitudes-ayuda', () => {
    it('sin sesión crea la solicitud y devuelve el puesto en la cola', async () => {
      const { body } = await pedir({ equipo: '12' }).expect(201);
      expect(body).toEqual({
        id: expect.any(String),
        equipo: '12',
        tema: 'CORREO',
        estado: 'PENDIENTE',
        posicion: 1,
        creadaEn: expect.any(String),
        yaExistia: false,
      });

      const [guardada] = await prisma.solicitudAyuda.findMany();
      expect(guardada).toMatchObject({
        id: body.id,
        estado: 'PENDIENTE',
        usuarioId: null,
        guiaId: null,
        pasoId: null,
      });
    });

    it('incluye la guía y el paso donde estaba la persona', async () => {
      await pedir({ equipo: '12', guiaSlug: 'smishing', pasoOrden: 2 }).expect(
        201,
      );
      const [guardada] = await prisma.solicitudAyuda.findMany();
      expect(guardada).toMatchObject({ guiaId, pasoId });
    });

    it.each([
      ['la guía no existe', { guiaSlug: 'no-existe', pasoOrden: 2 }, false],
      [
        'la guía no tiene ese paso',
        { guiaSlug: 'smishing', pasoOrden: 9 },
        true,
      ],
    ])('si %s, igual crea la solicitud', async (_, contexto, conGuia) => {
      await pedir({ equipo: '12', ...contexto }).expect(201);
      const [guardada] = await prisma.solicitudAyuda.findMany();
      expect(guardada.guiaId).toBe(conGuia ? guiaId : null);
      expect(guardada.pasoId).toBeNull();
    });

    it('el puesto cuenta las solicitudes que llegaron antes', async () => {
      await pedir({ equipo: '12' }).expect(201);
      const { body } = await pedir({ equipo: '7' }).expect(201);
      expect(body.posicion).toBe(2);
    });

    it('el mismo equipo no crea una duplicada: responde 200 con la existente', async () => {
      const { body: primera } = await pedir({ equipo: 'Equipo 12' }).expect(
        201,
      );
      const { body: repetida } = await pedir({
        equipo: '  equipo   12 ',
        tema: 'IMPRESION',
      }).expect(200);

      expect(repetida).toMatchObject({
        id: primera.id,
        tema: 'CORREO',
        yaExistia: true,
      });
      expect(await prisma.solicitudAyuda.count()).toBe(1);
    });

    it('dos envíos a la vez desde el mismo equipo crean una sola solicitud', async () => {
      const [a, b] = await Promise.all([
        pedir({ equipo: '12' }),
        pedir({ equipo: '12' }),
      ]);
      expect([a.status, b.status].sort((x, y) => x - y)).toEqual([200, 201]);
      expect(a.body.id).toBe(b.body.id);
      expect(await prisma.solicitudAyuda.count()).toBe(1);
    });

    it('con sesión de usuario público queda asociada a su cuenta', async () => {
      const token = await sesionUsuarioPublico(app);
      await pedir({ equipo: '12' })
        .set('Authorization', `Bearer ${token}`)
        .expect(201);
      const [guardada] = await prisma.solicitudAyuda.findMany();
      expect(guardada.usuarioId).not.toBeNull();
    });

    it.each([
      ['del personal', () => monitor.token],
      ['inválido', () => 'token-falso'],
    ])('con un token %s queda anónima, sin error', async (_, token) => {
      await pedir({ equipo: '12' })
        .set('Authorization', `Bearer ${token()}`)
        .expect(201);
      const [guardada] = await prisma.solicitudAyuda.findMany();
      expect(guardada.usuarioId).toBeNull();
    });

    it.each([
      ['falta el equipo', {}, 'DATOS_INVALIDOS'],
      ['el equipo son solo espacios', { equipo: '   ' }, 'DATO_INVALIDO'],
      [
        'el equipo es muy largo',
        { equipo: 'x'.repeat(101) },
        'DATOS_INVALIDOS',
      ],
      [
        'el tema no es de la lista',
        { equipo: '12', tema: 'COCINA' },
        'DATOS_INVALIDOS',
      ],
      [
        'el paso no es un número válido',
        { equipo: '12', guiaSlug: 'smishing', pasoOrden: 0 },
        'DATOS_INVALIDOS',
      ],
    ])('responde 400 si %s', async (_, cuerpo, codigo) => {
      const { body } = await pedir(cuerpo).expect(400);
      expect(body.codigo).toBe(codigo);
      expect(await prisma.solicitudAyuda.count()).toBe(0);
    });
  });

  describe('GET /solicitudes-ayuda/:id', () => {
    it('devuelve el estado y el puesto actual sin exigir sesión', async () => {
      const { body: creada } = await pedir({ equipo: '12' }).expect(201);
      const { body } = await http().get(`${RUTA}/${creada.id}`).expect(200);
      expect(body).toEqual({
        id: creada.id,
        equipo: '12',
        tema: 'CORREO',
        estado: 'PENDIENTE',
        posicion: 1,
        creadaEn: creada.creadaEn,
      });
    });

    it('cuando un monitor ya la atiende no tiene puesto en la cola', async () => {
      const { body: creada } = await pedir({ equipo: '12' }).expect(201);
      await prisma.solicitudAyuda.update({
        where: { id: creada.id },
        data: { estado: 'EN_ATENCION', atendidaPorId: monitor.id },
      });
      const { body } = await http().get(`${RUTA}/${creada.id}`).expect(200);
      expect(body).toMatchObject({ estado: 'EN_ATENCION', posicion: null });
    });

    it('responde 404 si no existe y 400 si el id no es válido', async () => {
      const { body } = await http()
        .get(`${RUTA}/00000000-0000-4000-8000-000000000000`)
        .expect(404);
      expect(body.codigo).toBe('SOLICITUD_NO_ENCONTRADA');
      await http().get(`${RUTA}/no-es-uuid`).expect(400);
    });
  });

  describe('DELETE /solicitudes-ayuda/:id', () => {
    it('la cancela sin borrarla, y las que esperaban detrás avanzan', async () => {
      const { body: primera } = await pedir({ equipo: '12' }).expect(201);
      const { body: segunda } = await pedir({ equipo: '7' }).expect(201);

      await http().delete(`${RUTA}/${primera.id}`).expect(204);

      const guardada = await prisma.solicitudAyuda.findUniqueOrThrow({
        where: { id: primera.id },
      });
      expect(guardada.estado).toBe('CANCELADA');
      expect(guardada.canceladaEn).not.toBeNull();
      const { body } = await http().get(`${RUTA}/${segunda.id}`).expect(200);
      expect(body.posicion).toBe(1);
    });

    it('después de cancelar, el equipo puede volver a pedir ayuda', async () => {
      const { body: primera } = await pedir({ equipo: '12' }).expect(201);
      await http().delete(`${RUTA}/${primera.id}`).expect(204);
      const { body: nueva } = await pedir({ equipo: '12' }).expect(201);
      expect(nueva.id).not.toBe(primera.id);
    });

    it('responde 409 si ya estaba cancelada y 404 si no existe', async () => {
      const { body: creada } = await pedir({ equipo: '12' }).expect(201);
      await http().delete(`${RUTA}/${creada.id}`).expect(204);
      const { body } = await http().delete(`${RUTA}/${creada.id}`).expect(409);
      expect(body.codigo).toBe('SOLICITUD_CERRADA');
      await http()
        .delete(`${RUTA}/00000000-0000-4000-8000-000000000000`)
        .expect(404);
    });
  });

  describe('GET /solicitudes-ayuda (personal)', () => {
    const listar = (consulta: Record<string, string | number> = {}) =>
      http()
        .get(RUTA)
        .query(consulta)
        .set('Authorization', `Bearer ${monitor.token}`);

    it('lista de la más antigua a la más reciente, con la guía y el paso', async () => {
      const { body: primera } = await pedir({
        equipo: '12',
        guiaSlug: 'smishing',
        pasoOrden: 2,
      }).expect(201);
      await pedir({ equipo: '7', tema: 'IMPRESION' }).expect(201);

      const { body } = await listar().expect(200);
      expect(body).toEqual({
        datos: [
          {
            id: primera.id,
            equipo: '12',
            tema: 'CORREO',
            estado: 'PENDIENTE',
            guia: { slug: 'smishing', titulo: 'Smishing' },
            paso: 2,
            creadaEn: primera.creadaEn,
            atendidaPor: null,
            tomadaEn: null,
            resueltaEn: null,
            comentarioResolucion: null,
          },
          {
            id: expect.any(String),
            equipo: '7',
            tema: 'IMPRESION',
            estado: 'PENDIENTE',
            guia: null,
            paso: null,
            creadaEn: expect.any(String),
            atendidaPor: null,
            tomadaEn: null,
            resueltaEn: null,
            comentarioResolucion: null,
          },
        ],
        total: 2,
        pagina: 1,
        limite: 20,
      });
    });

    it('filtra por estado y por tema, y pagina', async () => {
      const { body: cancelada } = await pedir({ equipo: '12' }).expect(201);
      await http().delete(`${RUTA}/${cancelada.id}`).expect(204);
      await pedir({ equipo: '7', tema: 'IMPRESION' }).expect(201);
      await pedir({ equipo: '3' }).expect(201);

      const equipos = async (consulta: Record<string, string | number>) => {
        const { body } = await listar(consulta).expect(200);
        return {
          equipos: body.datos.map((s: { equipo: string }) => s.equipo),
          total: body.total,
        };
      };
      expect(await equipos({ estado: 'PENDIENTE' })).toEqual({
        equipos: ['7', '3'],
        total: 2,
      });
      expect(await equipos({ tema: 'IMPRESION' })).toEqual({
        equipos: ['7'],
        total: 1,
      });
      expect(await equipos({ direccion: 'desc', limite: 1 })).toEqual({
        equipos: ['3'],
        total: 3,
      });
    });

    it('responde 401 sin sesión y 403 a un usuario público', async () => {
      await http().get(RUTA).expect(401);
      const token = await sesionUsuarioPublico(app);
      await http()
        .get(RUTA)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('rechaza un estado que no existe', async () => {
      const { body } = await listar({ estado: 'PERDIDA' }).expect(400);
      expect(body.codigo).toBe('DATOS_INVALIDOS');
    });
  });
});
