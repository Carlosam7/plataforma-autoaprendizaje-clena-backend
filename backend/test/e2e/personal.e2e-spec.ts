import { INestApplication } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';
import {
  BuzonCodigos,
  crearApp,
  limpiarBaseDatos,
  sesionPersonal,
} from './app.js';

const RUTA = '/api/v1/personal';

const luis = {
  nombre: 'Luis Pérez',
  correo: 'Luis.Perez@CLENA.example',
  passwordTemporal: 'Temporal2026',
  rol: 'PERSONAL',
};

describe('HU-04 · Gestión de cuentas del personal (e2e)', () => {
  let app: INestApplication<App>;
  let buzon: BuzonCodigos;
  let prisma: PrismaService;
  let admin: { id: string; token: string };

  beforeAll(async () => {
    ({ app, buzon, prisma } = await crearApp());
  });

  beforeEach(async () => {
    await limpiarBaseDatos(prisma);
    buzon.mensajes = [];
    admin = await sesionPersonal(app, {
      rol: 'ADMINISTRADOR',
      correo: 'andrea@clena.example',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  const comoAdmin = () => ({ Authorization: `Bearer ${admin.token}` });

  async function crearLuis(): Promise<string> {
    const { body } = await request(app.getHttpServer())
      .post(RUTA)
      .set(comoAdmin())
      .send(luis)
      .expect(201);
    return (body as { id: string }).id;
  }

  describe('crear', () => {
    it('crea la cuenta activa con contraseña temporal (guardada con hash)', async () => {
      const { body } = await request(app.getHttpServer())
        .post(RUTA)
        .set(comoAdmin())
        .send(luis)
        .expect(201);

      expect(body).toMatchObject({
        nombre: 'Luis Pérez',
        correo: 'luis.perez@clena.example',
        rol: 'PERSONAL',
        activo: true,
        debeCambiarPassword: true,
      });
      expect(body).not.toHaveProperty('passwordHash');

      const fila = await prisma.personal.findUniqueOrThrow({
        where: { id: (body as { id: string }).id },
      });
      expect(fila.creadoPorId).toBe(admin.id);
      expect(fila.passwordHash).not.toContain('Temporal2026');
      expect(await bcrypt.compare('Temporal2026', fila.passwordHash)).toBe(
        true,
      );
    });

    it('rechaza un correo repetido con el mensaje del criterio', async () => {
      await crearLuis();
      const { body } = await request(app.getHttpServer())
        .post(RUTA)
        .set(comoAdmin())
        .send({ ...luis, correo: 'luis.perez@clena.example' })
        .expect(409);
      expect(body.mensaje).toBe('Ese correo ya está en uso, prueba con otro');
    });

    it('valida los datos de entrada', async () => {
      const { body } = await request(app.getHttpServer())
        .post(RUTA)
        .set(comoAdmin())
        .send({ ...luis, rol: 'USUARIO_PUBLICO', extra: 1 })
        .expect(400);
      expect(body.codigo).toBe('DATOS_INVALIDOS');

      const debil = await request(app.getHttpServer())
        .post(RUTA)
        .set(comoAdmin())
        .send({ ...luis, passwordTemporal: 'corta' })
        .expect(400);
      expect(debil.body.detalles).toEqual({ campo: 'passwordTemporal' });
    });
  });

  it('lista con paginación, filtros y orden', async () => {
    await crearLuis();
    const { body } = await request(app.getHttpServer())
      .get(RUTA)
      .query({
        rol: 'PERSONAL',
        activo: 'true',
        q: 'luis',
        ordenarPor: 'correo',
        limite: 5,
      })
      .set(comoAdmin())
      .expect(200);
    expect(body).toMatchObject({ total: 1, pagina: 1, limite: 5 });
    expect(body.datos[0].correo).toBe('luis.perez@clena.example');

    await request(app.getHttpServer())
      .get(RUTA)
      .query({ ordenarPor: 'passwordHash' })
      .set(comoAdmin())
      .expect(400);
  });

  it('obtiene y edita una cuenta', async () => {
    const id = await crearLuis();
    await request(app.getHttpServer())
      .get(`${RUTA}/${id}`)
      .set(comoAdmin())
      .expect(200);

    const { body } = await request(app.getHttpServer())
      .patch(`${RUTA}/${id}`)
      .set(comoAdmin())
      .send({ nombre: 'Luis A. Pérez', rol: 'ADMINISTRADOR' })
      .expect(200);
    expect(body).toMatchObject({
      nombre: 'Luis A. Pérez',
      rol: 'ADMINISTRADOR',
    });

    await request(app.getHttpServer())
      .get(`${RUTA}/7a1c3a43-1b3e-4e0e-9a39-2d3f0f6b9c11`)
      .set(comoAdmin())
      .expect(404);
    await request(app.getHttpServer())
      .get(`${RUTA}/no-es-uuid`)
      .set(comoAdmin())
      .expect(400);
  });

  it('un administrador no puede desactivarse ni quitarse el rol', async () => {
    await request(app.getHttpServer())
      .post(`${RUTA}/${admin.id}/desactivar`)
      .set(comoAdmin())
      .expect(403);
    await request(app.getHttpServer())
      .patch(`${RUTA}/${admin.id}`)
      .set(comoAdmin())
      .send({ rol: 'PERSONAL' })
      .expect(403);
  });

  it('desactivar saca al monitor de inmediato y conserva su cuenta', async () => {
    const monitor = await sesionPersonal(app, {
      rol: 'PERSONAL',
      debeCambiarPassword: true,
    });
    await request(app.getHttpServer())
      .post(`${RUTA}/yo/password/codigo`)
      .set('Authorization', `Bearer ${monitor.token}`)
      .expect(202);

    const { body } = await request(app.getHttpServer())
      .post(`${RUTA}/${monitor.id}/desactivar`)
      .set(comoAdmin())
      .expect(200);
    expect(body.activo).toBe(false);

    // Su token ya no sirve, pero la cuenta y sus registros siguen en la base de datos.
    await request(app.getHttpServer())
      .post(`${RUTA}/yo/password/codigo`)
      .set('Authorization', `Bearer ${monitor.token}`)
      .expect(401);
    expect(await prisma.personal.count({ where: { id: monitor.id } })).toBe(1);
    expect(
      await prisma.refreshToken.count({
        where: { personalId: monitor.id, revocadoEn: null },
      }),
    ).toBe(0);

    const reactivado = await request(app.getHttpServer())
      .post(`${RUTA}/${monitor.id}/reactivar`)
      .set(comoAdmin())
      .expect(200);
    expect(reactivado.body.activo).toBe(true);
  });

  describe('cambio obligatorio de la contraseña temporal', () => {
    it('verifica la identidad por correo y cambia la contraseña', async () => {
      const monitor = await sesionPersonal(app, {
        rol: 'PERSONAL',
        correo: 'luis@clena.example',
        debeCambiarPassword: true,
      });
      const comoMonitor = { Authorization: `Bearer ${monitor.token}` };

      const enviado = await request(app.getHttpServer())
        .post(`${RUTA}/yo/password/codigo`)
        .set(comoMonitor)
        .expect(202);
      expect(enviado.body.destino).toBe('l****@clena.example');
      const codigo = buzon.ultimoPara('luis@clena.example');

      const incorrecto = await request(app.getHttpServer())
        .post(`${RUTA}/yo/password`)
        .set(comoMonitor)
        .send({
          codigo: codigo === '000000' ? '111111' : '000000',
          passwordNueva: 'MiClave2026',
        })
        .expect(400);
      expect(incorrecto.body.codigo).toBe('CODIGO_INCORRECTO');

      await request(app.getHttpServer())
        .post(`${RUTA}/yo/password`)
        .set(comoMonitor)
        .send({ codigo, passwordNueva: 'MiClave2026' })
        .expect(204);

      const fila = await prisma.personal.findUniqueOrThrow({
        where: { id: monitor.id },
      });
      expect(fila.debeCambiarPassword).toBe(false);
      expect(await bcrypt.compare('MiClave2026', fila.passwordHash)).toBe(true);

      // Ya no hace falta un segundo cambio.
      await request(app.getHttpServer())
        .post(`${RUTA}/yo/password/codigo`)
        .set(comoMonitor)
        .expect(409);
    });

    it('un usuario público no puede usarlo', async () => {
      await request(app.getHttpServer())
        .post(`${RUTA}/yo/password/codigo`)
        .expect(401);
    });
  });
});
