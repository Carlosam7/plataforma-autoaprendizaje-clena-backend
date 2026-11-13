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

const GESTION = '/api/v1/gestion/guias';
const PUBLICO = '/api/v1/guias';

const DATOS = {
  titulo: 'Enviar un correo electrónico',
  objetivo: 'Al terminar sabrás enviar un correo.',
  categoria: 'correo-electronico',
  nivel: 'BASICO',
  duracionEstimadaMin: 10,
  palabrasClave: ['email', 'gmail'],
};
const SLUG = 'enviar-un-correo-electronico';
const paso = (texto: string, id?: string) => ({
  ...(id ? { id } : {}),
  bloques: [{ tipo: 'texto', texto }],
});

describe('HU-13, HU-15 · Gestión de guías por el personal (e2e)', () => {
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
  const crear = (cuerpo: Record<string, unknown> = {}) =>
    http()
      .post(GESTION)
      .set(como(ana))
      .send({ ...DATOS, ...cuerpo });
  const editar = (cuerpo: Record<string, unknown>, quien = ana) =>
    http()
      .put(`${GESTION}/${SLUG}`)
      .set(como(quien))
      .send({ ...DATOS, ...cuerpo });
  const publicar = () =>
    http().post(`${GESTION}/${SLUG}/publicar`).set(como(ana));
  const ocultar = () =>
    http().post(`${GESTION}/${SLUG}/ocultar`).set(como(ana));
  const textosPublicos = async (): Promise<string[]> => {
    const { body } = await http().get(`${PUBLICO}/${SLUG}`).expect(200);
    return body.pasos.map(
      (p: { bloques: { texto: string }[] }) => p.bloques[0].texto,
    );
  };

  describe('acceso', () => {
    it('responde 401 sin sesión y 403 a un usuario público', async () => {
      await http().get(GESTION).expect(401);
      await http().post(GESTION).send(DATOS).expect(401);
      const token = await sesionUsuarioPublico(app);
      await http().get(GESTION).set(como({ token })).expect(403);
      await http().post(GESTION).set(como({ token })).send(DATOS).expect(403);
      expect(await prisma.guia.count()).toBe(0);
    });
  });

  describe('POST /gestion/guias', () => {
    it('crea la guía en borrador, con su slug y quién la creó; el público no la ve', async () => {
      const { body } = await crear().expect(201);
      expect(body).toEqual({
        slug: SLUG,
        categoria: 'correo-electronico',
        titulo: 'Enviar un correo electrónico',
        objetivo: 'Al terminar sabrás enviar un correo.',
        descripcion: null,
        nivel: 'BASICO',
        duracionEstimadaMin: 10,
        palabrasClave: ['email', 'gmail'],
        estado: 'BORRADOR',
        totalPasos: 0,
        pasos: [],
        publicadaEn: null,
        creadaPor: 'Persona personal',
        actualizadaPor: 'Persona personal',
        creadoEn: expect.any(String),
        actualizadoEn: expect.any(String),
      });

      const guardada = await prisma.guia.findUniqueOrThrow({
        where: { slug: SLUG },
      });
      expect(guardada).toMatchObject({
        estado: 'BORRADOR',
        creadaPorId: ana.id,
        actualizadaPorId: ana.id,
      });
      await http().get(`${PUBLICO}/${SLUG}`).expect(404);
      const { body: catalogo } = await http().get(PUBLICO).expect(200);
      expect(catalogo.total).toBe(0);
    });

    it('si el título se repite, el slug lleva un número', async () => {
      await crear().expect(201);
      const { body } = await crear().expect(201);
      expect(body.slug).toBe(`${SLUG}-2`);
    });

    it('puede crearse con pasos, uno de ellos con una imagen que ya existe', async () => {
      const imagen = await prisma.imagen.create({
        data: {
          claveAlmacenamiento: 'e2e/redactar.png',
          url: '/api/v1/archivos/e2e/redactar.png',
          tipoMime: 'image/png',
          tamanoBytes: 100,
          textoAlternativo: 'Botón Redactar',
          subidaPorId: ana.id,
        },
      });
      const { body } = await crear({
        pasos: [
          {
            titulo: 'Abre el correo',
            bloques: [
              { tipo: 'texto', texto: 'Toca «Redactar».' },
              {
                tipo: 'imagen',
                imagenId: imagen.id,
                textoAlternativo: 'Botón Redactar',
              },
              { tipo: 'aviso', nivel: 'consejo', texto: 'Tómate tu tiempo.' },
            ],
          },
        ],
      }).expect(201);

      expect(body.totalPasos).toBe(1);
      expect(body.pasos[0]).toEqual({
        id: expect.any(String),
        orden: 1,
        titulo: 'Abre el correo',
        bloques: [
          { tipo: 'texto', texto: 'Toca «Redactar».' },
          {
            tipo: 'imagen',
            imagenId: imagen.id,
            url: '/api/v1/archivos/e2e/redactar.png',
            textoAlternativo: 'Botón Redactar',
          },
          { tipo: 'aviso', nivel: 'consejo', texto: 'Tómate tu tiempo.' },
        ],
      });
    });

    it('si falta un campo obligatorio dice cuál', async () => {
      const { body } = await crear({ titulo: '', objetivo: undefined }).expect(
        400,
      );
      expect(body.codigo).toBe('DATOS_INVALIDOS');
      expect(Object.keys(body.detalles.campos).sort()).toEqual([
        'objetivo',
        'titulo',
      ]);
    });

    it.each([
      ['una categoría que no existe', { categoria: 'cocina' }, 'categoria'],
      ['un paso sin bloques', { pasos: [{ bloques: [] }] }, 'pasos'],
      [
        'un bloque de un tipo desconocido',
        { pasos: [{ bloques: [{ tipo: 'video', url: 'x' }] }] },
        'pasos',
      ],
      [
        'una imagen que no existe',
        {
          pasos: [
            {
              bloques: [
                {
                  tipo: 'imagen',
                  imagenId: '00000000-0000-4000-8000-000000000000',
                  textoAlternativo: 'x',
                },
              ],
            },
          ],
        },
        'pasos',
      ],
    ])('rechaza %s y no guarda nada', async (_, cuerpo, campo) => {
      const { body } = await crear(cuerpo).expect(400);
      expect(body).toMatchObject({
        codigo: 'DATO_INVALIDO',
        detalles: { campo },
      });
      expect(await prisma.guia.count()).toBe(0);
    });

    it.each([
      ['un nivel que no existe', { nivel: 'EXPERTO' }],
      ['una duración de cero minutos', { duracionEstimadaMin: 0 }],
      ['un campo que no existe', { estado: 'PUBLICADA' }],
    ])('rechaza %s', async (_, cuerpo) => {
      const { body } = await crear(cuerpo).expect(400);
      expect(body.codigo).toBe('DATOS_INVALIDOS');
    });
  });

  describe('PUT /gestion/guias/:slug', () => {
    it('edita los datos y guarda quién la editó; el slug no cambia', async () => {
      await crear().expect(201);
      const { body } = await editar(
        {
          titulo: 'Mandar un correo',
          nivel: 'INTERMEDIO',
          descripcion: 'Paso a paso.',
        },
        luis,
      ).expect(200);

      expect(body).toMatchObject({
        slug: SLUG,
        titulo: 'Mandar un correo',
        nivel: 'INTERMEDIO',
        descripcion: 'Paso a paso.',
        creadaPor: 'Persona personal',
        actualizadaPor: 'Persona administrador',
      });
      const guardada = await prisma.guia.findUniqueOrThrow({
        where: { slug: SLUG },
      });
      expect(guardada).toMatchObject({
        creadaPorId: ana.id,
        actualizadaPorId: luis.id,
      });
      expect(guardada.actualizadoEn.getTime()).toBeGreaterThan(
        guardada.creadoEn.getTime(),
      );
    });

    it('agrega, cambia, quita y reordena pasos conservando el id de los que siguen', async () => {
      const { body: creada } = await crear({
        pasos: [paso('Uno'), paso('Dos'), paso('Tres')],
      }).expect(201);
      const [uno, , tres] = creada.pasos.map((p: { id: string }) => p.id);

      const { body } = await editar({
        pasos: [paso('Tres', tres), paso('Nuevo'), paso('Uno editado', uno)],
      }).expect(200);

      expect(body.pasos.map((p: { orden: number }) => p.orden)).toEqual([
        1, 2, 3,
      ]);
      expect(body.pasos[0].id).toBe(tres);
      expect(body.pasos[2].id).toBe(uno);

      const guardados = await prisma.paso.findMany({
        where: { guia: { slug: SLUG } },
        orderBy: { orden: 'asc' },
      });
      expect(
        guardados.map((p) => [
          p.orden,
          (p.contenido as { bloques: { texto: string }[] }).bloques[0].texto,
        ]),
      ).toEqual([
        [1, 'Tres'],
        [2, 'Nuevo'],
        [3, 'Uno editado'],
      ]);
    });

    it('sin `pasos` no toca los pasos', async () => {
      await crear({ pasos: [paso('Uno'), paso('Dos')] }).expect(201);
      const { body } = await editar({ titulo: 'Otro título' }).expect(200);
      expect(body.totalPasos).toBe(2);
    });

    it('rechaza un paso con el id de otra guía', async () => {
      await crear({ pasos: [paso('Uno')] }).expect(201);
      const { body: otra } = await crear({
        titulo: 'Otra guía',
        pasos: [paso('Ajeno')],
      }).expect(201);

      const { body } = await editar({
        pasos: [paso('Robado', otra.pasos[0].id)],
      }).expect(400);
      expect(body.codigo).toBe('DATO_INVALIDO');
      expect(await prisma.paso.count({ where: { guia: { slug: SLUG } } })).toBe(
        1,
      );
    });

    it('responde 404 si la guía no existe', async () => {
      const { body } = await http()
        .put(`${GESTION}/no-existe`)
        .set(como(ana))
        .send(DATOS)
        .expect(404);
      expect(body.codigo).toBe('GUIA_NO_ENCONTRADA');
    });
  });

  describe('publicar y ocultar (HU-15)', () => {
    it('una guía sin pasos no se puede publicar', async () => {
      await crear().expect(201);
      const { body } = await publicar().expect(409);
      expect(body.codigo).toBe('GUIA_SIN_PASOS');
      await http().get(`${PUBLICO}/${SLUG}`).expect(404);
    });

    it('un borrador con al menos un paso se publica y aparece en el catálogo', async () => {
      await crear({ pasos: [paso('Uno')] }).expect(201);
      const { body } = await publicar().expect(200);
      expect(body.estado).toBe('PUBLICADA');
      expect(body.publicadaEn).toEqual(expect.any(String));

      const { body: catalogo } = await http()
        .get(PUBLICO)
        .query({ categoria: 'correo-electronico' })
        .expect(200);
      expect(catalogo.datos.map((g: { slug: string }) => g.slug)).toEqual([
        SLUG,
      ]);
      expect(await textosPublicos()).toEqual(['Uno']);
    });

    it('al ocultarla desaparece del catálogo, pero se conserva el progreso de los usuarios', async () => {
      await crear({ pasos: [paso('Uno')] }).expect(201);
      await publicar().expect(200);
      await sesionUsuarioPublico(app);
      const usuario = await prisma.usuarioPublico.findFirstOrThrow();
      const guia = await prisma.guia.findUniqueOrThrow({
        where: { slug: SLUG },
        include: { pasos: true },
      });
      await prisma.progresoGuia.create({
        data: {
          usuarioId: usuario.numeroIdentificacion,
          guiaId: guia.id,
          ultimoPasoId: guia.pasos[0].id,
        },
      });

      const { body } = await ocultar().expect(200);
      expect(body.estado).toBe('OCULTA');
      await http().get(`${PUBLICO}/${SLUG}`).expect(404);
      const { body: catalogo } = await http().get(PUBLICO).expect(200);
      expect(catalogo.total).toBe(0);

      const progreso = await prisma.progresoGuia.findMany();
      expect(progreso).toHaveLength(1);
      expect(progreso[0].ultimoPasoId).toBe(guia.pasos[0].id);

      await publicar().expect(200);
      await http().get(`${PUBLICO}/${SLUG}`).expect(200);
    });

    it('un borrador no se puede ocultar', async () => {
      await crear({ pasos: [paso('Uno')] }).expect(201);
      const { body } = await ocultar().expect(409);
      expect(body.codigo).toBe('GUIA_NO_PUBLICADA');
    });

    it('reordenar los pasos de una guía publicada se ve de inmediato en la vista pública', async () => {
      const { body: creada } = await crear({
        pasos: [paso('Uno'), paso('Dos')],
      }).expect(201);
      await publicar().expect(200);
      expect(await textosPublicos()).toEqual(['Uno', 'Dos']);

      const [uno, dos] = creada.pasos.map((p: { id: string }) => p.id);
      await editar({ pasos: [paso('Dos', dos), paso('Uno', uno)] }).expect(200);
      expect(await textosPublicos()).toEqual(['Dos', 'Uno']);
    });

    it('una guía publicada no puede quedarse sin pasos', async () => {
      await crear({ pasos: [paso('Uno')] }).expect(201);
      await publicar().expect(200);
      const { body } = await editar({ pasos: [] }).expect(409);
      expect(body.codigo).toBe('GUIA_SIN_PASOS');
      expect(await textosPublicos()).toEqual(['Uno']);
    });

    it('responden 404 si la guía no existe', async () => {
      await http()
        .post(`${GESTION}/no-existe/publicar`)
        .set(como(ana))
        .expect(404);
      await http()
        .post(`${GESTION}/no-existe/ocultar`)
        .set(como(ana))
        .expect(404);
    });
  });

  describe('GET /gestion/guias y /gestion/guias/:slug', () => {
    beforeEach(async () => {
      await crear({ pasos: [paso('Uno')] }).expect(201);
      await publicar().expect(200);
      await crear({
        titulo: 'Buscar una dirección',
        categoria: 'busqueda-internet',
      }).expect(201);
    });

    it('lista las guías en cualquier estado, sin sus pasos', async () => {
      const { body } = await http().get(GESTION).set(como(ana)).expect(200);
      expect(body).toMatchObject({ total: 2, pagina: 1, limite: 20 });
      expect(
        body.datos.map((g: Record<string, unknown>) => [
          g.slug,
          g.estado,
          g.totalPasos,
          g.creadaPor,
        ]),
      ).toEqual([
        ['buscar-una-direccion', 'BORRADOR', 0, 'Persona personal'],
        [SLUG, 'PUBLICADA', 1, 'Persona personal'],
      ]);
      expect(body.datos[0]).not.toHaveProperty('pasos');
    });

    it('filtra por estado y por categoría, y pagina', async () => {
      const slugs = async (consulta: Record<string, string | number>) => {
        const { body } = await http()
          .get(GESTION)
          .query(consulta)
          .set(como(ana))
          .expect(200);
        return body.datos.map((g: { slug: string }) => g.slug);
      };
      expect(await slugs({ estado: 'BORRADOR' })).toEqual([
        'buscar-una-direccion',
      ]);
      expect(await slugs({ categoria: 'correo-electronico' })).toEqual([SLUG]);
      expect(await slugs({ direccion: 'desc', limite: 1 })).toEqual([SLUG]);
      await http()
        .get(GESTION)
        .query({ estado: 'PERDIDA' })
        .set(como(ana))
        .expect(400);
    });

    it('el detalle trae un borrador con sus pasos; 404 si no existe', async () => {
      const { body } = await http()
        .get(`${GESTION}/buscar-una-direccion`)
        .set(como(ana))
        .expect(200);
      expect(body).toMatchObject({
        slug: 'buscar-una-direccion',
        estado: 'BORRADOR',
        pasos: [],
      });
      await http().get(`${GESTION}/no-existe`).set(como(ana)).expect(404);
    });
  });
});
