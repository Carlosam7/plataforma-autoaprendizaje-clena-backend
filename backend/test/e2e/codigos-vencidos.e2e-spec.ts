import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { EmisorSesion } from '../../src/application/auth/emisor-sesion.port.js';
import { PrismaService } from '../../src/infrastructure/database/prisma.service.js';
import {
  BuzonCodigos,
  crearApp,
  limpiarBaseDatos,
  sesionPersonal,
} from './app.js';

/**
 * BE-05 (C-08, C-09): con un código vencido cada flujo responde 410 CODIGO_EXPIRADO, sin
 * crear la cuenta, abrir la sesión ni cambiar nada, y con un código nuevo vuelve a funcionar.
 */
describe('BE-05 · Códigos de verificación vencidos (e2e)', () => {
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

  const http = () => request(app.getHttpServer());

  /** Hace vencer todos los códigos pendientes, como si hubiera pasado su tiempo. */
  const vencerCodigos = () =>
    prisma.codigoVerificacion.updateMany({
      where: { usadoEn: null },
      data: { expiraEn: new Date(Date.now() - 1000) },
    });

  const esperarVencido = (body: Record<string, unknown>) =>
    expect(body).toMatchObject({
      statusCode: 410,
      codigo: 'CODIGO_EXPIRADO',
      mensaje: 'El código ya venció. Pide uno nuevo.',
    });

  async function usuarioConCorreo(): Promise<string> {
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
          ],
        },
      },
    });
    const sesion = await app
      .get(EmisorSesion)
      .iniciar({ id: '41234567', rol: 'USUARIO_PUBLICO' });
    return sesion.accessToken;
  }

  it('registro: no crea la cuenta', async () => {
    const { body: registro } = await http()
      .post('/api/v1/auth/registro')
      .send({
        nombre: 'Rafael Gómez',
        numeroIdentificacion: '52345678',
        fechaNacimiento: '1968-03-10',
        correo: 'rafael@correo.com',
        aceptaAvisoPrivacidad: true,
        canalVerificacion: 'CORREO',
      })
      .expect(202);
    await vencerCodigos();

    const { body } = await http()
      .post('/api/v1/auth/registro/verificar')
      .send({
        registroId: registro.registroId,
        codigo: buzon.ultimoPara('rafael@correo.com'),
      })
      .expect(410);
    esperarVencido(body);
    const usuario = await prisma.usuarioPublico.findUnique({
      where: { numeroIdentificacion: '52345678' },
      include: { metodosInicio: true },
    });
    expect(usuario?.metodosInicio.every((m) => m.verificadoEn === null)).toBe(
      true,
    );
    expect(await prisma.refreshToken.count()).toBe(0);
  });

  it('inicio de sesión público: no abre sesión ni pone la cookie, y un código nuevo sí funciona', async () => {
    await usuarioConCorreo();
    const pedir = () =>
      http()
        .post('/api/v1/auth/login')
        .send({
          numeroIdentificacion: '41234567',
          contacto: 'carmen@correo.com',
        })
        .expect(202);
    const verificar = (solicitudId: string) =>
      http()
        .post('/api/v1/auth/login/verificar')
        .send({ solicitudId, codigo: buzon.ultimoPara('carmen@correo.com') });

    const { body: primera } = await pedir();
    await vencerCodigos();
    const vencida = await verificar(primera.solicitudId).expect(410);
    esperarVencido(vencida.body);
    expect(vencida.headers['set-cookie']).toBeUndefined();
    const sesionesAntes = await prisma.refreshToken.count();

    // Los códigos se piden con un minuto de espera entre uno y otro.
    await prisma.codigoVerificacion.updateMany({
      data: { creadoEn: new Date(Date.now() - 120_000) },
    });
    const { body: segunda } = await pedir();
    await verificar(segunda.solicitudId).expect(200);
    expect(await prisma.refreshToken.count()).toBe(sesionesAntes + 1);
  });

  it('inicio de sesión del personal: no abre sesión', async () => {
    const andrea = await sesionPersonal(app, {
      rol: 'ADMINISTRADOR',
      correo: 'andrea@clena.example',
      password: 'MiClave2026',
    });
    const sesionesAntes = await prisma.refreshToken.count();
    await http()
      .post('/api/v1/auth/personal/login')
      .send({ correo: 'andrea@clena.example', password: 'MiClave2026' })
      .expect(202);
    await vencerCodigos();

    const { body } = await http()
      .post('/api/v1/auth/personal/login/verificar')
      .send({
        solicitudId: andrea.id,
        codigo: buzon.ultimoPara('andrea@clena.example'),
      })
      .expect(410);
    esperarVencido(body);
    expect(await prisma.refreshToken.count()).toBe(sesionesAntes);
  });

  it('cambio de la contraseña temporal: no la cambia', async () => {
    const luis = await sesionPersonal(app, {
      rol: 'PERSONAL',
      correo: 'luis@clena.example',
      password: 'Temporal2026',
      debeCambiarPassword: true,
    });
    const antes = await prisma.personal.findUniqueOrThrow({
      where: { id: luis.id },
    });
    await http()
      .post('/api/v1/personal/yo/password/codigo')
      .set('Authorization', `Bearer ${luis.token}`)
      .expect(202);
    await vencerCodigos();

    const { body } = await http()
      .post('/api/v1/personal/yo/password')
      .set('Authorization', `Bearer ${luis.token}`)
      .send({
        codigo: buzon.ultimoPara('luis@clena.example'),
        passwordNueva: 'NuevaClave2026',
      })
      .expect(410);
    esperarVencido(body);
    expect(
      await prisma.personal.findUniqueOrThrow({ where: { id: luis.id } }),
    ).toMatchObject({
      passwordHash: antes.passwordHash,
      debeCambiarPassword: true,
    });
  });

  it('eliminación de la cuenta: no borra nada', async () => {
    const carmen = await usuarioConCorreo();
    const { body: solicitud } = await http()
      .post('/api/v1/auth/cuenta/eliminacion')
      .set('Authorization', `Bearer ${carmen}`)
      .send({})
      .expect(202);
    await vencerCodigos();

    const { body } = await http()
      .post('/api/v1/auth/cuenta/eliminacion/confirmar')
      .set('Authorization', `Bearer ${carmen}`)
      .send({
        solicitudId: solicitud.solicitudId,
        codigo: buzon.ultimoPara('carmen@correo.com'),
      })
      .expect(410);
    esperarVencido(body);
    expect(
      await prisma.usuarioPublico.count({
        where: { numeroIdentificacion: '41234567' },
      }),
    ).toBe(1);
  });
});
