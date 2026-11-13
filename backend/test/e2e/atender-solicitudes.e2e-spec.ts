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

describe('HU-30 · Atender la cola de solicitudes (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let ana: { id: string; token: string };
  let luis: { id: string; token: string };

  beforeAll(async () => {
    ({ app, prisma } = await crearApp());
  });

  beforeEach(async () => {
    await limpiarBaseDatos(prisma);
    ana = await sesionPersonal(app, { rol: 'PERSONAL' });
    luis = await sesionPersonal(app, { rol: 'ADMINISTRADOR' });
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const como = (quien: { token: string }) => ({
    Authorization: `Bearer ${quien.token}`,
  });
  /** Un visitante pide ayuda desde ese equipo; devuelve el id de la solicitud. */
  const pedir = async (equipo: string): Promise<string> => {
    const { body } = await http()
      .post(RUTA)
      .send({ equipo, tema: 'CORREO' })
      .expect(201);
    return body.id as string;
  };
  const tomar = (id: string, quien = ana) =>
    http().post(`${RUTA}/${id}/tomar`).set(como(quien));
  const resolver = (id: string, quien = ana, comentario?: string) =>
    http().post(`${RUTA}/${id}/resolver`).set(como(quien)).send({ comentario });
  const cola = async (): Promise<string[]> => {
    const { body } = await http()
      .get(RUTA)
      .query({ estado: 'PENDIENTE' })
      .set(como(ana))
      .expect(200);
    return body.datos.map((s: { equipo: string }) => s.equipo);
  };

  it('la cola muestra las pendientes de la más antigua a la más reciente', async () => {
    await pedir('12');
    await pedir('7');
    await pedir('3');
    expect(await cola()).toEqual(['12', '7', '3']);
  });

  describe('POST /solicitudes-ayuda/:id/tomar', () => {
    it('pasa a «En atención» con el nombre del monitor y sale de la cola', async () => {
      const id = await pedir('12');
      await pedir('7');

      const { body } = await tomar(id).expect(200);
      expect(body).toEqual({
        id,
        equipo: '12',
        tema: 'CORREO',
        estado: 'EN_ATENCION',
        guia: null,
        paso: null,
        creadaEn: expect.any(String),
        atendidaPor: 'Persona personal',
        tomadaEn: expect.any(String),
        resueltaEn: null,
        comentarioResolucion: null,
      });
      expect(await cola()).toEqual(['7']);

      const guardada = await prisma.solicitudAyuda.findUniqueOrThrow({
        where: { id },
      });
      expect(guardada).toMatchObject({
        estado: 'EN_ATENCION',
        atendidaPorId: ana.id,
      });
      expect(guardada.tomadaEn).not.toBeNull();

      // Quien la pidió ve que ya la atienden.
      const { body: visitante } = await http().get(`${RUTA}/${id}`).expect(200);
      expect(visitante).toMatchObject({
        estado: 'EN_ATENCION',
        posicion: null,
      });
    });

    it('otro monitor no puede tomar la que ya está en atención', async () => {
      const id = await pedir('12');
      await tomar(id, ana).expect(200);
      const { body } = await tomar(id, luis).expect(409);
      expect(body.codigo).toBe('SOLICITUD_YA_TOMADA');
      const guardada = await prisma.solicitudAyuda.findUniqueOrThrow({
        where: { id },
      });
      expect(guardada.atendidaPorId).toBe(ana.id);
    });

    it('si dos monitores la toman a la vez, solo uno se la queda', async () => {
      const id = await pedir('12');
      const [a, b] = await Promise.all([tomar(id, ana), tomar(id, luis)]);
      expect([a.status, b.status].sort((x, y) => x - y)).toEqual([200, 409]);
      const ganador = a.status === 200 ? ana : luis;
      const guardada = await prisma.solicitudAyuda.findUniqueOrThrow({
        where: { id },
      });
      expect(guardada.atendidaPorId).toBe(ganador.id);
    });

    it('responde 409 si la persona ya la canceló y 404 si no existe', async () => {
      const id = await pedir('12');
      await http().delete(`${RUTA}/${id}`).expect(204);
      const { body } = await tomar(id).expect(409);
      expect(body.codigo).toBe('SOLICITUD_CERRADA');
      await tomar('00000000-0000-4000-8000-000000000000').expect(404);
    });
  });

  describe('POST /solicitudes-ayuda/:id/resolver', () => {
    it('quien la tomó la marca como resuelta con un comentario', async () => {
      const id = await pedir('12');
      await tomar(id).expect(200);

      const { body } = await resolver(
        id,
        ana,
        ' No encontraba el botón «Adjuntar». ',
      ).expect(200);
      expect(body).toMatchObject({
        estado: 'RESUELTA',
        atendidaPor: 'Persona personal',
        resueltaEn: expect.any(String),
        comentarioResolucion: 'No encontraba el botón «Adjuntar».',
      });

      const { body: resueltas } = await http()
        .get(RUTA)
        .query({ estado: 'RESUELTA' })
        .set(como(ana))
        .expect(200);
      expect(resueltas.datos).toHaveLength(1);
      expect(resueltas.datos[0].comentarioResolucion).toBe(
        'No encontraba el botón «Adjuntar».',
      );
    });

    it('el comentario es opcional, y después el equipo puede volver a pedir ayuda', async () => {
      const id = await pedir('12');
      await tomar(id).expect(200);
      const { body } = await resolver(id).expect(200);
      expect(body.comentarioResolucion).toBeNull();
      expect(await pedir('12')).not.toBe(id);
    });

    it('responde 409 si nadie la ha tomado', async () => {
      const id = await pedir('12');
      const { body } = await resolver(id).expect(409);
      expect(body.codigo).toBe('SOLICITUD_SIN_TOMAR');
    });

    it('responde 403 si la está atendiendo otro monitor', async () => {
      const id = await pedir('12');
      await tomar(id, ana).expect(200);
      const { body } = await resolver(id, luis).expect(403);
      expect(body.codigo).toBe('SOLICITUD_DE_OTRO_MONITOR');
    });

    it('responde 409 si ya estaba resuelta o cancelada', async () => {
      const id = await pedir('12');
      await tomar(id).expect(200);
      await resolver(id).expect(200);
      const { body } = await resolver(id).expect(409);
      expect(body.codigo).toBe('SOLICITUD_CERRADA');

      // Y quien la pidió ya no la puede cancelar.
      await http().delete(`${RUTA}/${id}`).expect(409);
    });

    it('la persona puede cancelar aunque ya la estén atendiendo', async () => {
      const id = await pedir('12');
      await tomar(id).expect(200);
      await http().delete(`${RUTA}/${id}`).expect(204);
      const { body } = await resolver(id).expect(409);
      expect(body.codigo).toBe('SOLICITUD_CERRADA');
    });

    it('rechaza un comentario de más de 500 letras', async () => {
      const id = await pedir('12');
      await tomar(id).expect(200);
      const { body } = await resolver(id, ana, 'x'.repeat(501)).expect(400);
      expect(body.codigo).toBe('DATOS_INVALIDOS');
    });
  });

  it('tomar y resolver son solo para el personal: 401 sin sesión y 403 a un usuario público', async () => {
    const id = await pedir('12');
    await http().post(`${RUTA}/${id}/tomar`).expect(401);
    await http().post(`${RUTA}/${id}/resolver`).expect(401);
    const token = await sesionUsuarioPublico(app);
    await tomar(id, { id: '', token }).expect(403);
    await resolver(id, { id: '', token }).expect(403);
    const guardada = await prisma.solicitudAyuda.findUniqueOrThrow({
      where: { id },
    });
    expect(guardada.estado).toBe('PENDIENTE');
  });
});
