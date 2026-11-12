import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';
import { BuzonCodigos, crearApp, limpiarBaseDatos } from './app.js';

const API = '/api/v1/auth';

describe('HU-02 · Inicio de sesión con sesión persistente (e2e)', () => {
  let app: INestApplication<App>;
  let buzon: BuzonCodigos;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, buzon, prisma } = await crearApp());
  });

  beforeEach(async () => {
    await limpiarBaseDatos(prisma);
    buzon.mensajes = [];
    // Carmen ya tiene cuenta: verificó el correo al registrarse; el celular no.
    await prisma.usuarioPublico.create({
      data: {
        numeroIdentificacion: '41234567',
        nombre: 'Carmen Rodríguez',
        fechaNacimiento: new Date('1955-08-21'),
        metodosInicio: {
          create: [
            {
              tipo: 'CORREO',
              valor: 'carmen@correo.com',
              verificadoEn: new Date(),
            },
            { tipo: 'TELEFONO', valor: '+573001234567' },
          ],
        },
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  async function iniciarSesion(contacto = 'carmen@correo.com') {
    const solicitud = await http()
      .post(`${API}/login`)
      .send({ numeroIdentificacion: '41.234.567', contacto })
      .expect(202);
    const destino = buzon.mensajes.at(-1)!.destino;
    const verificacion = await http()
      .post(`${API}/login/verificar`)
      .send({
        solicitudId: solicitud.body.solicitudId,
        codigo: buzon.ultimoPara(destino),
      })
      .expect(200);
    return verificacion.body as {
      accessToken: string;
      refreshToken: string;
      usuario: { nombre: string; rol: string };
    };
  }

  /** Ruta protegida cualquiera: sirve para saber si el access token sigue valiendo. */
  function rutaProtegida(token: string) {
    return http()
      .get('/api/v1/personal')
      .set('Authorization', `Bearer ${token}`);
  }

  it('envía un código al correo y con él entrega access token y refresh token', async () => {
    const solicitud = await http()
      .post(`${API}/login`)
      .send({ numeroIdentificacion: '41234567', contacto: 'Carmen@Correo.com' })
      .expect(202);

    expect(solicitud.body).toMatchObject({
      solicitudId: expect.any(String),
      canal: 'CORREO',
      destino: 'c****@correo.com',
      mensaje: expect.stringContaining('c****@correo.com'),
    });
    expect(buzon.mensajes.at(-1)).toMatchObject({
      canal: 'CORREO',
      destino: 'carmen@correo.com',
      proposito: 'INICIO_SESION',
    });

    const sesion = await http()
      .post(`${API}/login/verificar`)
      .send({
        solicitudId: solicitud.body.solicitudId,
        codigo: buzon.ultimoPara('carmen@correo.com'),
      })
      .expect(200);

    expect(sesion.body).toMatchObject({
      usuario: { nombre: 'Carmen Rodríguez', rol: 'USUARIO_PUBLICO' },
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
    // La cédula no viaja en la respuesta ni en el JWT.
    expect(JSON.stringify(sesion.body)).not.toContain('41234567');
    // El refresh token se guarda con hash, nunca en claro.
    const [, secreto] = sesion.body.refreshToken.split('.');
    const guardados = await prisma.refreshToken.findMany();
    expect(guardados).toHaveLength(1);
    expect(guardados[0].tokenHash).not.toContain(secreto);
  });

  it('puede entrar con el celular: el código llega por SMS y el celular queda verificado', async () => {
    await iniciarSesion('300 123 4567');

    expect(buzon.mensajes.at(-1)).toMatchObject({
      canal: 'TELEFONO',
      destino: '+573001234567',
    });
    const celular = await prisma.metodoInicio.findFirst({
      where: { tipo: 'TELEFONO' },
    });
    expect(celular?.verificadoEn).not.toBeNull();
  });

  it('con datos incorrectos responde «Credenciales inválidas» sin decir cuál falló', async () => {
    const casos = [
      { numeroIdentificacion: '99999999', contacto: 'carmen@correo.com' },
      { numeroIdentificacion: '41234567', contacto: 'otra@correo.com' },
    ];
    const respuestas = await Promise.all(
      casos.map((datos) => http().post(`${API}/login`).send(datos)),
    );

    for (const respuesta of respuestas) {
      expect(respuesta.status).toBe(401);
      expect(respuesta.body).toMatchObject({
        codigo: 'CREDENCIALES_INVALIDAS',
        mensaje: 'Credenciales inválidas',
      });
    }
    expect(buzon.mensajes).toHaveLength(0);
  });

  it('un registro sin terminar no puede iniciar sesión', async () => {
    await prisma.usuarioPublico.create({
      data: {
        numeroIdentificacion: '1000000',
        nombre: 'Pedro Pérez',
        fechaNacimiento: new Date('1960-01-01'),
        metodosInicio: {
          create: [{ tipo: 'CORREO', valor: 'pedro@correo.com' }],
        },
      },
    });

    await http()
      .post(`${API}/login`)
      .send({ numeroIdentificacion: '1000000', contacto: 'pedro@correo.com' })
      .expect(401);
  });

  it('con un código incorrecto informa los intentos restantes', async () => {
    const solicitud = await http()
      .post(`${API}/login`)
      .send({ numeroIdentificacion: '41234567', contacto: 'carmen@correo.com' })
      .expect(202);
    const correcto = buzon.ultimoPara('carmen@correo.com');

    const respuesta = await http()
      .post(`${API}/login/verificar`)
      .send({
        solicitudId: solicitud.body.solicitudId,
        codigo: correcto === '000000' ? '111111' : '000000',
      })
      .expect(400);

    expect(respuesta.body).toMatchObject({
      codigo: 'CODIGO_INCORRECTO',
      detalles: { intentosRestantes: 4 },
    });
  });

  it('con intentos en paralelo solo prueba tantos códigos como intentos permitidos', async () => {
    const solicitud = await http()
      .post(`${API}/login`)
      .send({ numeroIdentificacion: '41234567', contacto: 'carmen@correo.com' })
      .expect(202);
    const correcto = buzon.ultimoPara('carmen@correo.com');

    const respuestas = await Promise.all(
      Array.from({ length: 10 }, () =>
        http()
          .post(`${API}/login/verificar`)
          .send({
            solicitudId: solicitud.body.solicitudId,
            codigo: correcto === '000000' ? '111111' : '000000',
          }),
      ),
    );

    const estados = respuestas.map((r) => r.status);
    expect(estados.filter((s) => s === 400)).toHaveLength(5);
    expect(estados.filter((s) => s === 429)).toHaveLength(5);
  });

  it('renueva la sesión con el refresh token y el anterior deja de servir', async () => {
    const inicial = await iniciarSesion();

    const renovada = await http()
      .post(`${API}/refresh`)
      .send({ refreshToken: inicial.refreshToken })
      .expect(200);

    expect(renovada.body.refreshToken).not.toBe(inicial.refreshToken);
    // El access token nuevo funciona (403: válido pero sin rol para esa ruta) y el viejo no (401).
    await rutaProtegida(renovada.body.accessToken).expect(403);
    await rutaProtegida(inicial.accessToken).expect(401);
  });

  it('si se reutiliza un refresh token ya usado, cierra todas las sesiones', async () => {
    const inicial = await iniciarSesion();
    const renovada = await http()
      .post(`${API}/refresh`)
      .send({ refreshToken: inicial.refreshToken })
      .expect(200);

    const reutilizado = await http()
      .post(`${API}/refresh`)
      .send({ refreshToken: inicial.refreshToken })
      .expect(401);
    expect(reutilizado.body.codigo).toBe('SESION_INVALIDA');

    await http()
      .post(`${API}/refresh`)
      .send({ refreshToken: renovada.body.refreshToken })
      .expect(401);
    expect(
      await prisma.refreshToken.count({ where: { revocadoEn: null } }),
    ).toBe(0);
  });

  it('cerrar sesión invalida el refresh token y el access token', async () => {
    const sesion = await iniciarSesion();

    await http()
      .post(`${API}/logout`)
      .send({ refreshToken: sesion.refreshToken })
      .expect(204);

    await http()
      .post(`${API}/refresh`)
      .send({ refreshToken: sesion.refreshToken })
      .expect(401);
    await rutaProtegida(sesion.accessToken).expect(401);
  });

  it('rechaza refresh tokens inventados o mal formados sin error interno', async () => {
    for (const refreshToken of [
      'inventado',
      '00000000-0000-0000-0000-000000000000.secreto',
      'a.b.c',
    ]) {
      await http().post(`${API}/refresh`).send({ refreshToken }).expect(401);
    }
    await http().post(`${API}/refresh`).send({}).expect(400);
  });

  it('valida la entrada con el formato uniforme de errores', async () => {
    const respuesta = await http()
      .post(`${API}/login/verificar`)
      .send({ solicitudId: 'no-es-uuid', codigo: '12' })
      .expect(400);

    expect(respuesta.body).toMatchObject({
      codigo: 'DATOS_INVALIDOS',
      detalles: { campos: expect.any(Object) },
    });
  });
});
