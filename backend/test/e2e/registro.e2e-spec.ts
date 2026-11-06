import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { PrismaService } from '../../src/shared/infrastructure/prisma/prisma.service.js';
import { BuzonCodigos, crearApp, limpiarBaseDatos } from './app.js';

const RUTA = '/api/v1/auth/registro';

const carmen = {
  nombre: 'Carmen Rodríguez',
  numeroIdentificacion: '41.234.567',
  fechaNacimiento: '1955-08-21',
  telefono: '300 123 4567',
  correo: 'Carmen@Correo.com',
  aceptaAvisoPrivacidad: true,
};

describe('HU-01 · Registro con consentimiento (e2e)', () => {
  let app: INestApplication<App>;
  let buzon: BuzonCodigos;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, buzon, prisma } = await crearApp());
  });

  beforeEach(async () => {
    await limpiarBaseDatos(prisma);
    buzon.mensajes = [];
  });

  afterAll(async () => {
    await app.close();
  });

  async function registrarYVerificar(datos: Record<string, unknown>) {
    const solicitud = await request(app.getHttpServer())
      .post(RUTA)
      .send(datos)
      .expect(202);
    const destino = buzon.mensajes.at(-1)!.destino;
    return request(app.getHttpServer())
      .post(`${RUTA}/verificar`)
      .send({
        registroId: solicitud.body.registroId,
        codigo: buzon.ultimoPara(destino),
      });
  }

  it('crea la cuenta con rol de usuario público y deja la sesión iniciada', async () => {
    const solicitud = await request(app.getHttpServer())
      .post(RUTA)
      .send(carmen)
      .expect(202);

    expect(solicitud.body).toMatchObject({
      registroId: expect.any(String),
      canal: 'CORREO',
      destino: 'c****@correo.com',
      mensaje: expect.stringContaining('c****@correo.com'),
    });
    expect(await prisma.usuario.count()).toBe(0);

    const verificacion = await request(app.getHttpServer())
      .post(`${RUTA}/verificar`)
      .send({
        registroId: solicitud.body.registroId,
        codigo: buzon.ultimoPara('carmen@correo.com'),
      })
      .expect(201);

    expect(verificacion.body).toMatchObject({
      usuario: {
        id: expect.any(String),
        nombre: 'Carmen Rodríguez',
        rol: 'USUARIO_PUBLICO',
      },
      accessToken: expect.any(String),
      refreshToken: expect.stringContaining('.'),
    });

    const usuario = await prisma.usuario.findUniqueOrThrow({
      where: { id: verificacion.body.usuario.id },
    });
    expect(usuario).toMatchObject({
      numeroIdentificacion: '41234567',
      telefono: '+573001234567',
      correo: 'carmen@correo.com',
      rol: 'USUARIO_PUBLICO',
      consentimientoVersion: 'v-e2e',
    });
    expect(usuario.consentimientoAceptadoEn).toBeInstanceOf(Date);

    // El refresh token nunca se guarda en claro.
    const sesion = await prisma.sesion.findFirstOrThrow({
      where: { usuarioId: usuario.id },
    });
    expect(sesion.refreshTokenHash).not.toContain(
      verificacion.body.refreshToken.split('.')[1],
    );
    expect(await prisma.registroPendiente.count()).toBe(0);
  });

  it('envía el código por SMS si solo hay celular', async () => {
    const { correo: _correo, ...sinCorreo } = carmen;
    const respuesta = await request(app.getHttpServer())
      .post(RUTA)
      .send(sinCorreo)
      .expect(202);

    expect(respuesta.body).toMatchObject({
      canal: 'TELEFONO',
      destino: '+57 *** *** 4567',
    });
    expect(buzon.mensajes[0]).toMatchObject({
      canal: 'TELEFONO',
      destino: '+573001234567',
    });
  });

  it('sin la casilla de consentimiento no crea la cuenta y explica que debe aceptar el aviso', async () => {
    const respuesta = await request(app.getHttpServer())
      .post(RUTA)
      .send({ ...carmen, aceptaAvisoPrivacidad: false })
      .expect(400);

    expect(respuesta.body).toMatchObject({
      statusCode: 400,
      codigo: 'CONSENTIMIENTO_REQUERIDO',
      mensaje: expect.stringContaining('aceptar el aviso de privacidad'),
      ruta: RUTA,
    });
    expect(buzon.mensajes).toHaveLength(0);
    expect(await prisma.registroPendiente.count()).toBe(0);
  });

  it.each([
    [
      'teléfono',
      {
        numeroIdentificacion: '999999',
        correo: 'otra@correo.com',
        telefono: '+57 300-123-4567',
      },
      'TELEFONO_EN_USO',
      'Ese teléfono ya está en uso, prueba con otro',
    ],
    [
      'correo',
      {
        numeroIdentificacion: '999999',
        telefono: '3109998877',
        correo: 'CARMEN@correo.com',
      },
      'CORREO_EN_USO',
      'Ese correo ya está en uso, prueba con otro',
    ],
    [
      'número de identificación',
      {
        numeroIdentificacion: '41234567',
        telefono: '3109998877',
        correo: 'otra@correo.com',
      },
      'IDENTIFICACION_YA_REGISTRADA',
      'Este usuario ya tiene una cuenta',
    ],
  ])(
    'rechaza un %s ya registrado con el mensaje del criterio',
    async (_campo, cambios, codigo, mensaje) => {
      await registrarYVerificar(carmen).then((r) => expect(r.status).toBe(201));

      const respuesta = await request(app.getHttpServer())
        .post(RUTA)
        .send({ ...carmen, nombre: 'Otra Persona', ...cambios })
        .expect(409);

      expect(respuesta.body).toMatchObject({ codigo, mensaje });
    },
  );

  it('si dos solicitudes pendientes usan el mismo celular, solo la primera en verificar crea la cuenta', async () => {
    const primera = await request(app.getHttpServer())
      .post(RUTA)
      .send(carmen)
      .expect(202);
    const segunda = await request(app.getHttpServer())
      .post(RUTA)
      .send({
        ...carmen,
        numeroIdentificacion: '999999',
        correo: 'otra@correo.com',
      })
      .expect(202);

    await request(app.getHttpServer())
      .post(`${RUTA}/verificar`)
      .send({
        registroId: primera.body.registroId,
        codigo: buzon.ultimoPara('carmen@correo.com'),
      })
      .expect(201);

    const respuesta = await request(app.getHttpServer())
      .post(`${RUTA}/verificar`)
      .send({
        registroId: segunda.body.registroId,
        codigo: buzon.ultimoPara('otra@correo.com'),
      })
      .expect(409);
    expect(respuesta.body.codigo).toBe('TELEFONO_EN_USO');
  });

  it('con un código incorrecto informa los intentos restantes', async () => {
    const solicitud = await request(app.getHttpServer())
      .post(RUTA)
      .send(carmen)
      .expect(202);
    const codigoCorrecto = buzon.ultimoPara('carmen@correo.com');
    const codigoIncorrecto = codigoCorrecto === '000000' ? '111111' : '000000';

    const respuesta = await request(app.getHttpServer())
      .post(`${RUTA}/verificar`)
      .send({ registroId: solicitud.body.registroId, codigo: codigoIncorrecto })
      .expect(400);

    expect(respuesta.body).toMatchObject({
      codigo: 'CODIGO_INCORRECTO',
      detalles: { intentosRestantes: 4 },
    });
    expect(await prisma.usuario.count()).toBe(0);
  });

  it('no permite pedir otro código enseguida', async () => {
    const solicitud = await request(app.getHttpServer())
      .post(RUTA)
      .send(carmen)
      .expect(202);

    const respuesta = await request(app.getHttpServer())
      .post(`${RUTA}/reenviar-codigo`)
      .send({ registroId: solicitud.body.registroId })
      .expect(429);
    expect(respuesta.body.codigo).toBe('REENVIO_MUY_PRONTO');
  });

  it('valida la entrada y rechaza campos no permitidos con el formato uniforme', async () => {
    const respuesta = await request(app.getHttpServer())
      .post(RUTA)
      .send({ ...carmen, fechaNacimiento: '21/08/1955', rol: 'ADMINISTRADOR' })
      .expect(400);

    expect(respuesta.body).toMatchObject({
      statusCode: 400,
      codigo: 'DATOS_INVALIDOS',
      detalles: {
        campos: {
          rol: ['El campo «rol» no está permitido.'],
          fechaNacimiento: [expect.stringContaining('año-mes-día')],
        },
      },
    });
  });

  it('exige teléfono o correo', async () => {
    const { correo: _c, telefono: _t, ...sinContacto } = carmen;
    const respuesta = await request(app.getHttpServer())
      .post(RUTA)
      .send(sinContacto)
      .expect(400);
    expect(respuesta.body.codigo).toBe('CONTACTO_REQUERIDO');
  });
});
