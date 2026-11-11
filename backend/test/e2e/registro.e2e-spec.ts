import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';
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

  /** Cuentas activas: usuarios con al menos un correo o celular verificado. */
  function cuentasVerificadas(): Promise<number> {
    return prisma.metodoInicio.count({
      where: { verificadoEn: { not: null } },
    });
  }

  it('muestra el aviso de privacidad vigente antes del registro', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/v1/aviso-privacidad/vigente')
      .expect(200);

    expect(respuesta.body).toMatchObject({
      version: '1.0',
      contenido: expect.stringContaining('Ley 1581'),
    });
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
    expect(await cuentasVerificadas()).toBe(0);

    const verificacion = await request(app.getHttpServer())
      .post(`${RUTA}/verificar`)
      .send({
        registroId: solicitud.body.registroId,
        codigo: buzon.ultimoPara('carmen@correo.com'),
      })
      .expect(201);

    expect(verificacion.body).toMatchObject({
      usuario: { nombre: 'Carmen Rodríguez', rol: 'USUARIO_PUBLICO' },
      accessToken: expect.any(String),
      refreshToken: expect.stringContaining('.'),
    });
    // La cédula no viaja en la respuesta ni dentro del JWT (que se puede decodificar).
    expect(JSON.stringify(verificacion.body)).not.toContain('41234567');
    const [, cargaJwt] = verificacion.body.accessToken.split('.');
    const carga = JSON.parse(Buffer.from(cargaJwt, 'base64url').toString());
    expect(Object.keys(carga).sort()).toEqual(['exp', 'iat', 'rol', 'sid']);
    expect(carga.rol).toBe('USUARIO_PUBLICO');

    const usuario = await prisma.usuarioPublico.findUniqueOrThrow({
      where: { numeroIdentificacion: '41234567' },
      include: {
        metodosInicio: { orderBy: { tipo: 'asc' } },
        consentimientos: { include: { avisoPrivacidad: true } },
      },
    });
    expect(usuario.nombre).toBe('Carmen Rodríguez');
    // Se verificó el correo (el canal del código); el celular queda guardado sin verificar.
    expect(usuario.metodosInicio).toMatchObject([
      {
        tipo: 'CORREO',
        valor: 'carmen@correo.com',
        verificadoEn: expect.any(Date),
      },
      { tipo: 'TELEFONO', valor: '+573001234567', verificadoEn: null },
    ]);
    // Ley 1581: queda la versión del aviso aceptado y la fecha.
    expect(usuario.consentimientos).toMatchObject([
      { avisoPrivacidad: { version: '1.0' }, aceptadoEn: expect.any(Date) },
    ]);

    // El sid del JWT es la sesión guardada en refresh_token, que sí apunta al usuario.
    const token = await prisma.refreshToken.findUniqueOrThrow({
      where: { id: carga.sid },
    });
    expect(token.usuarioPublicoId).toBe('41234567');
    // El refresh token nunca se guarda en claro.
    expect(token.tokenHash).not.toContain(
      verificacion.body.refreshToken.split('.')[1],
    );
    // El código usado ya no sirve.
    expect(
      await prisma.codigoVerificacion.count({ where: { usadoEn: null } }),
    ).toBe(0);
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
    expect(await prisma.usuarioPublico.count()).toBe(0);
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

  describe('celular reservado por el registro sin terminar de otra persona', () => {
    const luis = {
      ...carmen,
      nombre: 'Luis Rodríguez',
      numeroIdentificacion: '1001234567',
      correo: 'luis@correo.com',
    };

    it('mientras el código del otro sigue vigente, el celular está en uso', async () => {
      await request(app.getHttpServer()).post(RUTA).send(carmen).expect(202);

      const respuesta = await request(app.getHttpServer())
        .post(RUTA)
        .send(luis)
        .expect(409);
      expect(respuesta.body.codigo).toBe('TELEFONO_EN_USO');
    });

    it('si el código del otro venció, se libera el celular y se borra ese registro', async () => {
      await request(app.getHttpServer()).post(RUTA).send(carmen).expect(202);
      // Simula que pasaron más de 10 minutos sin que Carmen escribiera el código.
      await prisma.codigoVerificacion.updateMany({
        data: { expiraEn: new Date(Date.now() - 1000) },
      });

      await request(app.getHttpServer()).post(RUTA).send(luis).expect(202);

      const usuarios = await prisma.usuarioPublico.findMany({
        select: { numeroIdentificacion: true },
      });
      expect(usuarios).toEqual([{ numeroIdentificacion: '1001234567' }]);
    });
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
    expect(await cuentasVerificadas()).toBe(0);
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
