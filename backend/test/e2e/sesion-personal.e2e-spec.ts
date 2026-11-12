import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';
import {
  BuzonCodigos,
  cookieRefresh,
  crearApp,
  limpiarBaseDatos,
  sesionPersonal,
} from './app.js';

const API = '/api/v1/auth/personal';

describe('HU-06 · Iniciar sesión como personal del CLENA (e2e)', () => {
  let app: INestApplication<App>;
  let buzon: BuzonCodigos;
  let prisma: PrismaService;
  let andrea: { id: string };

  beforeAll(async () => {
    ({ app, buzon, prisma } = await crearApp());
  });

  beforeEach(async () => {
    await limpiarBaseDatos(prisma);
    buzon.mensajes = [];
    andrea = await sesionPersonal(app, {
      rol: 'ADMINISTRADOR',
      correo: 'andrea@clena.example',
      password: 'MiClave2026',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  it('con correo y contraseña correctos envía un código al correo y con él entra como administradora', async () => {
    const solicitud = await http()
      .post(`${API}/login`)
      .send({ correo: 'Andrea@CLENA.example', password: 'MiClave2026' })
      .expect(202);

    expect(solicitud.body).toMatchObject({
      solicitudId: andrea.id,
      canal: 'CORREO',
      destino: 'a****@clena.example',
      mensaje: expect.stringContaining('a****@clena.example'),
    });
    expect(buzon.mensajes.at(-1)).toMatchObject({
      destino: 'andrea@clena.example',
      proposito: 'INICIO_SESION',
    });

    const verificacion = await http()
      .post(`${API}/login/verificar`)
      .send({
        solicitudId: solicitud.body.solicitudId,
        codigo: buzon.ultimoPara('andrea@clena.example'),
      })
      .expect(200);

    expect(verificacion.body).toMatchObject({
      usuario: {
        nombre: 'Persona administrador',
        rol: 'ADMINISTRADOR',
        debeCambiarPassword: false,
      },
      accessToken: expect.any(String),
    });
    expect(verificacion.body).not.toHaveProperty('refreshToken');
    const cookie = cookieRefresh(verificacion);

    // El token da acceso a las rutas de administrador (HU-04).
    await http()
      .get('/api/v1/personal')
      .set('Authorization', `Bearer ${verificacion.body.accessToken}`)
      .expect(200);

    const fila = await prisma.personal.findUniqueOrThrow({
      where: { id: andrea.id },
    });
    expect(fila.ultimoAccesoEn).not.toBeNull();

    // La sesión se renueva con la misma ruta del usuario público (HU-02).
    await http().post('/api/v1/auth/refresh').set('Cookie', cookie).expect(200);
  });

  it.each([
    ['la contraseña es incorrecta', { password: 'Otra2026' }],
    ['el correo no tiene cuenta', { correo: 'nadie@clena.example' }],
  ])('responde 401 «Credenciales incorrectas» si %s', async (_caso, cambio) => {
    const { body } = await http()
      .post(`${API}/login`)
      .send({
        correo: 'andrea@clena.example',
        password: 'MiClave2026',
        ...cambio,
      })
      .expect(401);

    expect(body).toMatchObject({
      codigo: 'CREDENCIALES_INCORRECTAS',
      mensaje: 'Credenciales incorrectas',
    });
    expect(buzon.mensajes).toEqual([]);
  });

  it('una cuenta desactivada recibe el mismo «Credenciales incorrectas»', async () => {
    await prisma.personal.update({
      where: { id: andrea.id },
      data: { activo: false },
    });
    const { body } = await http()
      .post(`${API}/login`)
      .send({ correo: 'andrea@clena.example', password: 'MiClave2026' })
      .expect(401);
    expect(body.mensaje).toBe('Credenciales incorrectas');
  });

  it('rechaza un código incorrecto', async () => {
    const solicitud = await http()
      .post(`${API}/login`)
      .send({ correo: 'andrea@clena.example', password: 'MiClave2026' })
      .expect(202);
    await http()
      .post(`${API}/login/verificar`)
      .send({ solicitudId: solicitud.body.solicitudId, codigo: '000000' })
      .expect(400);
  });

  it('responde 400 si faltan datos', async () => {
    const { body } = await http()
      .post(`${API}/login`)
      .send({ correo: 'andrea@clena.example' })
      .expect(400);
    expect(body.codigo).toBe('DATOS_INVALIDOS');
    expect(body.detalles.campos).toHaveProperty('password');
  });
});
