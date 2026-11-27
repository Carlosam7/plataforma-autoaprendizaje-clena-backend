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

const RESUMEN = '/api/v1/gestion/estadisticas/resumen';
// Categorías semilla, que limpiarBaseDatos conserva.
const SEGURIDAD = 1; // seguridad-digital
const CORREO = 2; // correo-electronico

describe('HU-31 · Estadísticas del panel (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let ana: { id: string; token: string };

  beforeAll(async () => {
    ({ app, prisma } = await crearApp());
  });

  beforeEach(async () => {
    await limpiarBaseDatos(prisma);
    ana = await sesionPersonal(app, { rol: 'PERSONAL' });
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const pedir = (query = '', token = ana.token) =>
    http().get(`${RESUMEN}${query}`).set('Authorization', `Bearer ${token}`);

  const guia = async (
    slug: string,
    categoriaId: number,
    estado: 'PUBLICADA' | 'OCULTA' | 'BORRADOR' = 'PUBLICADA',
  ): Promise<string> => {
    const { id } = await prisma.guia.create({
      data: {
        slug,
        titulo: `Guía ${slug}`,
        objetivo: 'x',
        categoriaId,
        nivel: 'BASICO',
        duracionEstimadaMin: 5,
        estado,
        creadaPorId: ana.id,
        actualizadaPorId: ana.id,
      },
    });
    return id;
  };

  const consultas = (guiaId: string, ...fechas: string[]) =>
    prisma.consultaGuia.createMany({
      data: fechas.map((f) => ({ guiaId, consultadaEn: new Date(f) })),
    });

  let equipo = 0;
  const solicitud = (
    tema: 'SEGURIDAD_DIGITAL' | 'CORREO',
    creadaEn: string,
    guiaId?: string,
  ) =>
    prisma.solicitudAyuda.create({
      data: {
        equipo: `Equipo ${++equipo}`,
        tema,
        creadaEn: new Date(creadaEn),
        guiaId,
      },
    });

  describe('permisos', () => {
    it('responde 401 sin sesión', async () => {
      await http().get(RESUMEN).expect(401);
    });

    it('responde 403 al usuario público', async () => {
      const token = await sesionUsuarioPublico(app);
      await pedir('', token).expect(403);
    });

    it('el administrador también lo ve', async () => {
      const luis = await sesionPersonal(app, { rol: 'ADMINISTRADOR' });
      await pedir('', luis.token).expect(200);
    });
  });

  it('cuenta lo del rango en hora de Bogotá, incluidas las guías ocultas y las consultas sin cuenta', async () => {
    const smishing = await guia('smishing', SEGURIDAD);
    const vishing = await guia('vishing', SEGURIDAD, 'BORRADOR');
    const oculta = await guia('correo-oculto', CORREO, 'OCULTA');

    // Rango 20/11–26/11 en Bogotá = [2026-11-20T05:00Z, 2026-11-27T05:00Z).
    await consultas(
      smishing,
      '2026-11-20T04:59:59.999Z', // 19/11 23:59:59 en Bogotá: fuera
      '2026-11-20T05:00:00.000Z', // 20/11 00:00: primer instante, dentro
      '2026-11-23T17:30:00.000Z',
      '2026-11-27T04:59:59.999Z', // 26/11 23:59:59: último instante, dentro
      '2026-11-27T05:00:00.000Z', // 27/11 00:00: fuera
    );
    await consultas(vishing, '2026-11-21T12:00:00Z', '2026-11-22T12:00:00Z');
    await consultas(oculta, '2026-11-24T12:00:00Z', '2026-11-25T12:00:00Z');

    await solicitud('SEGURIDAD_DIGITAL', '2026-11-20T05:00:00.000Z', smishing);
    await solicitud('SEGURIDAD_DIGITAL', '2026-11-26T20:00:00.000Z'); // sin guía
    await solicitud('CORREO', '2026-11-27T04:59:59.999Z');
    await solicitud('CORREO', '2026-11-27T05:00:00.000Z'); // fuera

    const { body } = await pedir('?desde=2026-11-20&hasta=2026-11-26').expect(
      200,
    );
    expect(body).toEqual({
      periodo: {
        desde: '2026-11-20',
        hasta: '2026-11-26',
        zonaHoraria: 'America/Bogota',
      },
      totales: { consultasGuias: 7, solicitudesAyuda: 3 },
      // Empate a 2 entre correo-oculto y vishing: por slug.
      topGuias: [
        { slug: 'smishing', titulo: 'Guía smishing', consultas: 3 },
        { slug: 'correo-oculto', titulo: 'Guía correo-oculto', consultas: 2 },
        { slug: 'vishing', titulo: 'Guía vishing', consultas: 2 },
      ],
      consultasPorCategoria: [
        {
          slug: 'seguridad-digital',
          nombre: 'Seguridad digital',
          consultas: 5,
        },
        {
          slug: 'correo-electronico',
          nombre: 'Correo electrónico',
          consultas: 2,
        },
      ],
      solicitudesPorTema: [
        { tema: 'SEGURIDAD_DIGITAL', cantidad: 2 },
        { tema: 'CORREO', cantidad: 1 },
      ],
      hayDatos: true,
    });

    // Las sumas coinciden con un SELECT controlado sobre el mismo intervalo.
    const enRango = {
      gte: new Date('2026-11-20T05:00:00Z'),
      lt: new Date('2026-11-27T05:00:00Z'),
    };
    expect(body.totales).toEqual({
      consultasGuias: await prisma.consultaGuia.count({
        where: { consultadaEn: enRango },
      }),
      solicitudesAyuda: await prisma.solicitudAyuda.count({
        where: { creadaEn: enRango },
      }),
    });
  });

  it('el top trae como máximo 10 guías, pero los totales cuentan todas', async () => {
    for (let i = 1; i <= 12; i++) {
      const id = await guia(`guia-${String(i).padStart(2, '0')}`, SEGURIDAD);
      await consultas(id, ...Array(i).fill('2026-11-25T12:00:00Z'));
    }
    const { body } = await pedir('?desde=2026-11-25&hasta=2026-11-25').expect(
      200,
    );
    expect(body.topGuias).toHaveLength(10);
    expect(body.topGuias[0]).toMatchObject({ slug: 'guia-12', consultas: 12 });
    expect(body.topGuias[9]).toMatchObject({ slug: 'guia-03', consultas: 3 });
    expect(body.totales.consultasGuias).toBe(78); // 1 + 2 + … + 12
  });

  it('sin datos: hayDatos false, totales en 0 y listas vacías', async () => {
    const { body } = await pedir('?desde=2026-01-01&hasta=2026-01-31').expect(
      200,
    );
    expect(body).toMatchObject({
      totales: { consultasGuias: 0, solicitudesAyuda: 0 },
      topGuias: [],
      consultasPorCategoria: [],
      solicitudesPorTema: [],
      hayDatos: false,
    });
  });

  it('sin fechas son los últimos 7 días e incluye lo que registra POST /guias/:slug/consultas', async () => {
    await guia('smishing', SEGURIDAD);
    await http().post('/api/v1/guias/smishing/consultas').expect(204);
    await http().post('/api/v1/guias/smishing/consultas').expect(204);

    const respuesta = await pedir().expect(200);
    const hoy = new Date(Date.now() - 5 * 3_600_000).toISOString().slice(0, 10);
    expect(respuesta.body.periodo.hasta).toBe(hoy);
    expect(respuesta.body.totales.consultasGuias).toBe(2);
    expect(respuesta.headers['cache-control']).toBe('no-store');
  });

  describe('validación de fechas', () => {
    it.each([
      ['?desde=2026-11-27&hasta=2026-11-26', 'desde'],
      ['?hasta=2026-02-30', 'hasta'],
      ['?desde=2025-11-25&hasta=2026-11-26', 'desde'], // 367 días
    ])('%s responde 400 RANGO_FECHAS_INVALIDO', async (query, campo) => {
      const { body } = await pedir(query).expect(400);
      expect(body).toMatchObject({
        codigo: 'RANGO_FECHAS_INVALIDO',
        detalles: { campo },
      });
    });

    it('un formato que no es AAAA-MM-DD responde 400 DATOS_INVALIDOS', async () => {
      const { body } = await pedir('?desde=ayer').expect(400);
      expect(body.codigo).toBe('DATOS_INVALIDOS');
      expect(body.detalles.campos).toHaveProperty('desde');
    });

    it('acepta exactamente 366 días', async () => {
      await pedir('?desde=2025-11-26&hasta=2026-11-26').expect(200);
    });
  });
});
