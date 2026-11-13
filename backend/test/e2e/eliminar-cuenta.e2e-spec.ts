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

const RUTA = '/api/v1/auth/cuenta/eliminacion';
const CARMEN = '41234567';
const RAFAEL = '52345678';

describe('HU-05 · Eliminar mi cuenta (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let buzon: BuzonCodigos;
  let carmen: string;
  let rafael: string;

  beforeAll(async () => {
    ({ app, prisma, buzon } = await crearApp());
  });

  /** Usuario público con correo verificado (y celular, si se indica) y una sesión abierta. */
  async function crearUsuario(
    id: string,
    correo: string,
    telefono?: string,
  ): Promise<string> {
    await prisma.usuarioPublico.create({
      data: {
        numeroIdentificacion: id,
        nombre: 'Carmen Ruiz',
        fechaNacimiento: new Date('1958-06-20'),
        metodosInicio: {
          create: [
            { tipo: 'CORREO', valor: correo, verificadoEn: new Date() },
            ...(telefono
              ? [
                  {
                    tipo: 'TELEFONO' as const,
                    valor: telefono,
                    verificadoEn: new Date(),
                  },
                ]
              : []),
          ],
        },
      },
    });
    const sesion = await app
      .get(EmisorSesion)
      .iniciar({ id, rol: 'USUARIO_PUBLICO' });
    return sesion.accessToken;
  }

  beforeEach(async () => {
    await limpiarBaseDatos(prisma);
    buzon.mensajes = [];
    carmen = await crearUsuario(CARMEN, 'carmen@correo.com', '+573001234567');
    rafael = await crearUsuario(RAFAEL, 'rafael@correo.com');
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const pedir = (token: string, cuerpo: Record<string, unknown> = {}) =>
    http().post(RUTA).set('Authorization', `Bearer ${token}`).send(cuerpo);
  const confirmar = (
    token: string,
    cuerpo: { solicitudId: string; codigo: string },
  ) =>
    http()
      .post(`${RUTA}/confirmar`)
      .set('Authorization', `Bearer ${token}`)
      .send(cuerpo);

  describe('POST /auth/cuenta/eliminacion', () => {
    it('envía un código al correo de la cuenta y todavía no borra nada', async () => {
      const { body } = await pedir(carmen).expect(202);
      expect(body).toEqual({
        solicitudId: expect.any(String),
        canal: 'CORREO',
        destino: 'c****@correo.com',
        mensaje:
          'Te enviamos un código a c****@correo.com. Escríbelo para confirmar que quieres eliminar tu cuenta.',
        expiraEn: expect.any(String),
        puedeReenviarEn: expect.any(String),
      });
      expect(buzon.mensajes).toHaveLength(1);
      expect(buzon.mensajes[0]).toMatchObject({
        canal: 'CORREO',
        destino: 'carmen@correo.com',
        proposito: 'ELIMINAR_CUENTA',
      });
      expect(await prisma.usuarioPublico.count()).toBe(2);
    });

    it('lo envía por mensaje de texto si el usuario lo elige', async () => {
      const { body } = await pedir(carmen, { canal: 'TELEFONO' }).expect(202);
      expect(body).toMatchObject({
        canal: 'TELEFONO',
        destino: '+57 *** *** 4567',
      });
      expect(buzon.mensajes[0].destino).toBe('+573001234567');
    });

    it('responde 400 si la cuenta no tiene confirmado ese contacto', async () => {
      const { body } = await pedir(rafael, { canal: 'TELEFONO' }).expect(400);
      expect(body.codigo).toBe('CONTACTO_NO_VERIFICADO');
      expect(buzon.mensajes).toHaveLength(0);
    });

    it('no reenvía el código enseguida', async () => {
      await pedir(carmen).expect(202);
      const { body } = await pedir(carmen).expect(429);
      expect(body.codigo).toBe('REENVIO_MUY_PRONTO');
    });

    it('responde 401 sin sesión y 403 al personal', async () => {
      await http().post(RUTA).expect(401);
      const monitor = await sesionPersonal(app, { rol: 'PERSONAL' });
      await pedir(monitor.token).expect(403);
    });
  });

  describe('POST /auth/cuenta/eliminacion/confirmar', () => {
    /** Pide el código y devuelve lo necesario para confirmar. */
    async function solicitud(token: string, correo: string) {
      const { body } = await pedir(token).expect(202);
      return {
        solicitudId: body.solicitudId as string,
        codigo: buzon.ultimoPara(correo),
      };
    }

    /** Todo lo que una cuenta puede dejar en la base de datos. */
    async function sembrarActividad(usuarioId: string): Promise<void> {
      const autor = await sesionPersonal(app, { rol: 'PERSONAL' });
      const aviso = await prisma.avisoPrivacidad.findFirstOrThrow();
      const guia = await prisma.guia.create({
        data: {
          slug: `guia-${usuarioId}`,
          categoriaId: 1,
          titulo: 'Smishing',
          objetivo: 'Al terminar sabrás reconocer un SMS falso.',
          nivel: 'BASICO',
          duracionEstimadaMin: 8,
          estado: 'PUBLICADA',
          creadaPorId: autor.id,
          actualizadaPorId: autor.id,
          pasos: {
            create: { orden: 1, contenido: { version: 1, bloques: [] } },
          },
          actividad: {
            create: {
              titulo: 'Practica',
              creadaPorId: autor.id,
              actualizadaPorId: autor.id,
              preguntas: {
                create: {
                  orden: 1,
                  enunciado: '¿Abres el enlace?',
                  explicacion: 'No.',
                  opciones: {
                    create: { orden: 1, texto: 'No', esCorrecta: true },
                  },
                },
              },
            },
          },
        },
        include: {
          pasos: true,
          actividad: {
            include: { preguntas: { include: { opciones: true } } },
          },
        },
      });
      const [pregunta] = guia.actividad!.preguntas;
      await prisma.consentimiento.create({
        data: { usuarioId, avisoPrivacidadId: aviso.id },
      });
      await prisma.progresoGuia.create({
        data: { usuarioId, guiaId: guia.id },
      });
      await prisma.pasoLeido.create({
        data: { usuarioId, pasoId: guia.pasos[0].id },
      });
      await prisma.intento.create({
        data: {
          usuarioId,
          actividadId: guia.actividad!.id,
          totalPreguntas: 1,
          respuestas: {
            create: {
              preguntaId: pregunta.id,
              opcionId: pregunta.opciones[0].id,
              esCorrecta: true,
            },
          },
        },
      });
      await prisma.consultaGuia.create({
        data: { usuarioId, guiaId: guia.id },
      });
      await prisma.solicitudAyuda.create({
        data: { usuarioId, equipo: `Equipo ${usuarioId}`, tema: 'CORREO' },
      });
      await prisma.calificacion.create({
        data: {
          usuarioId,
          valor: 'ME_AYUDO',
          origen: 'FIN_GUIA',
          guiaId: guia.id,
        },
      });
    }

    /** Cuántas filas quedan de un usuario en cada tabla. */
    async function rastro(usuarioId: string) {
      const de = { where: { usuarioId } };
      return {
        cuenta: await prisma.usuarioPublico.count({
          where: { numeroIdentificacion: usuarioId },
        }),
        metodosInicio: await prisma.metodoInicio.count(de),
        codigos: await prisma.codigoVerificacion.count({
          where: { metodoInicio: { usuarioId } },
        }),
        consentimientos: await prisma.consentimiento.count(de),
        sesiones: await prisma.refreshToken.count({
          where: { usuarioPublicoId: usuarioId },
        }),
        progresos: await prisma.progresoGuia.count(de),
        pasosLeidos: await prisma.pasoLeido.count(de),
        intentos: await prisma.intento.count(de),
        consultas: await prisma.consultaGuia.count(de),
        solicitudes: await prisma.solicitudAyuda.count(de),
        calificaciones: await prisma.calificacion.count(de),
      };
    }

    it('con el código correcto borra los datos personales y el progreso, y conserva las estadísticas sin dueño', async () => {
      await sembrarActividad(CARMEN);
      await sembrarActividad(RAFAEL);
      const antesRafael = await rastro(RAFAEL);

      const respuesta = await confirmar(
        carmen,
        await solicitud(carmen, 'carmen@correo.com'),
      ).expect(204);

      expect(await rastro(CARMEN)).toEqual({
        cuenta: 0,
        metodosInicio: 0,
        codigos: 0,
        consentimientos: 0,
        sesiones: 0,
        progresos: 0,
        pasosLeidos: 0,
        intentos: 0,
        consultas: 0,
        solicitudes: 0,
        calificaciones: 0,
      });
      // Sus intentos se van con sus respuestas: solo quedan los de Rafael.
      expect(await prisma.respuestaIntento.count()).toBe(1);
      // Las estadísticas siguen ahí, ya sin referencia a la persona.
      expect(
        await prisma.consultaGuia.count({ where: { usuarioId: null } }),
      ).toBe(1);
      expect(
        await prisma.solicitudAyuda.count({ where: { usuarioId: null } }),
      ).toBe(1);
      expect(
        await prisma.calificacion.count({ where: { usuarioId: null } }),
      ).toBe(1);
      // La cuenta de otra persona no se toca.
      expect(await rastro(RAFAEL)).toEqual(antesRafael);

      // La sesión queda cerrada: se borra la cookie y el access token ya no sirve.
      const cookies = respuesta.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c) => c.startsWith('refresh_token=;'))).toBe(true);
      await pedir(carmen).expect(401);
    });

    it('con un código incorrecto no borra nada y dice cuántos intentos quedan', async () => {
      const { solicitudId } = await solicitud(carmen, 'carmen@correo.com');
      const { body } = await confirmar(carmen, {
        solicitudId,
        codigo: '000000',
      }).expect(400);
      expect(body.codigo).toBe('CODIGO_INCORRECTO');
      expect(await prisma.usuarioPublico.count()).toBe(2);
    });

    it('nadie elimina la cuenta de otra persona con el código de ella', async () => {
      const deCarmen = await solicitud(carmen, 'carmen@correo.com');
      const { body } = await confirmar(rafael, deCarmen).expect(404);
      expect(body.codigo).toBe('SOLICITUD_ELIMINACION_NO_ENCONTRADA');
      expect(await prisma.usuarioPublico.count()).toBe(2);
    });

    it('un código de inicio de sesión no sirve para eliminar la cuenta', async () => {
      const { body: login } = await http()
        .post('/api/v1/auth/login')
        .send({ numeroIdentificacion: CARMEN, contacto: 'carmen@correo.com' })
        .expect(202);
      await confirmar(carmen, {
        solicitudId: login.solicitudId,
        codigo: buzon.ultimoPara('carmen@correo.com'),
      }).expect(404);
      expect(await prisma.usuarioPublico.count()).toBe(2);
    });

    it('responde 404 si no se pidió un código y 400 si el cuerpo no es válido', async () => {
      const metodo = await prisma.metodoInicio.findFirstOrThrow({
        where: { usuarioId: CARMEN },
      });
      await confirmar(carmen, {
        solicitudId: metodo.id,
        codigo: '483920',
      }).expect(404);
      const { body } = await confirmar(carmen, {
        solicitudId: 'no-es-uuid',
        codigo: 'abc',
      }).expect(400);
      expect(body.codigo).toBe('DATOS_INVALIDOS');
    });

    it('después de eliminar la cuenta, esa identificación ya no puede iniciar sesión', async () => {
      await confirmar(
        carmen,
        await solicitud(carmen, 'carmen@correo.com'),
      ).expect(204);
      await http()
        .post('/api/v1/auth/login')
        .send({ numeroIdentificacion: CARMEN, contacto: 'carmen@correo.com' })
        .expect(401);
    });

    it('responde 401 sin sesión', async () => {
      await http()
        .post(`${RUTA}/confirmar`)
        .send({
          solicitudId: '00000000-0000-4000-8000-000000000000',
          codigo: '483920',
        })
        .expect(401);
    });
  });
});
