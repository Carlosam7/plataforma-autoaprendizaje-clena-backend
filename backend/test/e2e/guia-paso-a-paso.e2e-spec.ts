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

const RUTA = '/api/v1/guias';

describe('HU-10 · Seguir una guía paso a paso (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let autor: { id: string; token: string };
  let guiaId: string;

  beforeAll(async () => {
    ({ app, prisma } = await crearApp());
  });

  beforeEach(async () => {
    await limpiarBaseDatos(prisma);
    autor = await sesionPersonal(app, { rol: 'PERSONAL' });
    const comun = {
      categoriaId: 1,
      nivel: 'BASICO' as const,
      duracionEstimadaMin: 8,
      creadaPorId: autor.id,
      actualizadaPorId: autor.id,
    };
    const imagen = await prisma.imagen.create({
      data: {
        claveAlmacenamiento: 'e2e/sms.png',
        url: '/api/v1/archivos/e2e/sms.png',
        tipoMime: 'image/png',
        tamanoBytes: 100,
        textoAlternativo: 'Un SMS falso',
        subidaPorId: autor.id,
      },
    });
    const guia = await prisma.guia.create({
      data: {
        ...comun,
        slug: 'smishing',
        titulo: 'Smishing',
        objetivo: 'Al terminar sabrás reconocer un SMS falso.',
        estado: 'PUBLICADA',
        // Se crean en desorden: la respuesta debe traerlos por `orden`.
        pasos: {
          create: [
            {
              orden: 2,
              titulo: null,
              contenido: {
                version: 1,
                bloques: [
                  {
                    tipo: 'aviso',
                    nivel: 'alerta',
                    texto: 'No abras el enlace.',
                  },
                ],
              },
            },
            {
              orden: 1,
              titulo: 'Haz una pausa',
              contenido: {
                version: 1,
                bloques: [
                  { tipo: 'texto', texto: 'Respira y lee con calma.' },
                  {
                    tipo: 'imagen',
                    imagenId: imagen.id,
                    textoAlternativo:
                      'SMS que dice que tu cuenta será bloqueada',
                  },
                ],
              },
            },
          ],
        },
      },
    });
    guiaId = guia.id;
    await prisma.guia.create({
      data: {
        ...comun,
        slug: 'en-borrador',
        titulo: 'Borrador',
        objetivo: 'No se debe ver.',
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  describe('GET /guias/:slug', () => {
    it('sin sesión devuelve el objetivo, el total de pasos y los pasos en orden con la URL de la imagen', async () => {
      const { body } = await http().get(`${RUTA}/smishing`).expect(200);

      expect(body).toEqual({
        slug: 'smishing',
        categoria: 'seguridad-digital',
        titulo: 'Smishing',
        objetivo: 'Al terminar sabrás reconocer un SMS falso.',
        nivel: 'BASICO',
        duracionEstimadaMin: 8,
        totalPasos: 2,
        tieneActividad: false,
        pasos: [
          {
            orden: 1,
            titulo: 'Haz una pausa',
            bloques: [
              { tipo: 'texto', texto: 'Respira y lee con calma.' },
              {
                tipo: 'imagen',
                url: '/api/v1/archivos/e2e/sms.png',
                textoAlternativo: 'SMS que dice que tu cuenta será bloqueada',
              },
            ],
          },
          {
            orden: 2,
            titulo: null,
            bloques: [
              { tipo: 'aviso', nivel: 'alerta', texto: 'No abras el enlace.' },
            ],
          },
        ],
      });
    });

    it('indica si la guía tiene actividad para invitar a practicar al final', async () => {
      const actividad = await prisma.actividad.create({
        data: {
          guiaId,
          titulo: 'Practica',
          creadaPorId: autor.id,
          actualizadaPorId: autor.id,
        },
      });
      // Sin preguntas todavía no se puede hacer (HU-21).
      let { body } = await http().get(`${RUTA}/smishing`).expect(200);
      expect(body.tieneActividad).toBe(false);

      await prisma.pregunta.create({
        data: {
          actividadId: actividad.id,
          orden: 1,
          enunciado: '¿Abres el enlace?',
          explicacion: 'No.',
        },
      });
      ({ body } = await http().get(`${RUTA}/smishing`).expect(200));
      expect(body.tieneActividad).toBe(true);
    });

    it.each(['en-borrador', 'no-existe'])(
      'responde 404 si la guía «%s» no está publicada o no existe',
      async (slug) => {
        const { body } = await http().get(`${RUTA}/${slug}`).expect(404);
        expect(body).toMatchObject({
          codigo: 'GUIA_NO_ENCONTRADA',
          mensaje: 'No encontramos esa guía.',
        });
      },
    );

    it('responde 400 si el slug tiene un formato inválido', async () => {
      const { body } = await http().get(`${RUTA}/Mal_Slug`).expect(400);
      expect(body.codigo).toBe('DATOS_INVALIDOS');
    });

    it('leer el detalle no registra una apertura', async () => {
      await http().get(`${RUTA}/smishing`).expect(200);
      expect(await prisma.consultaGuia.count()).toBe(0);
    });
  });

  describe('POST /guias/:slug/consultas', () => {
    const consultas = () =>
      prisma.consultaGuia.findMany({
        select: { guiaId: true, usuarioId: true },
      });

    it('sin sesión registra la apertura sin datos personales', async () => {
      await http().post(`${RUTA}/smishing/consultas`).expect(204);
      expect(await consultas()).toEqual([{ guiaId, usuarioId: null }]);
    });

    it('con sesión de usuario público la asocia a su cuenta', async () => {
      const token = await sesionUsuarioPublico(app);
      await http()
        .post(`${RUTA}/smishing/consultas`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);
      const [consulta] = await consultas();
      expect(consulta.usuarioId).not.toBeNull();
    });

    it('con sesión del personal queda anónima', async () => {
      await http()
        .post(`${RUTA}/smishing/consultas`)
        .set('Authorization', `Bearer ${autor.token}`)
        .expect(204);
      expect(await consultas()).toEqual([{ guiaId, usuarioId: null }]);
    });

    it('un token inválido no da error: se registra como anónima', async () => {
      await http()
        .post(`${RUTA}/smishing/consultas`)
        .set('Authorization', 'Bearer token-vencido-o-falso')
        .expect(204);
      expect(await consultas()).toEqual([{ guiaId, usuarioId: null }]);
    });

    it('responde 404 y no registra nada si la guía no está publicada', async () => {
      await http().post(`${RUTA}/en-borrador/consultas`).expect(404);
      expect(await consultas()).toEqual([]);
    });
  });
});
