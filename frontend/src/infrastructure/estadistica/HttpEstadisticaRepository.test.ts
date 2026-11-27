import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpEstadisticaRepository } from './HttpEstadisticaRepository';

// Ejemplo real de C-11.
const resumen = (sobre: Record<string, unknown> = {}) => ({
  periodo: {
    desde: '2026-11-20',
    hasta: '2026-11-26',
    zonaHoraria: 'America/Bogota',
  },
  totales: { consultasGuias: 35, solicitudesAyuda: 6 },
  topGuias: [
    { slug: 'smishing', titulo: 'Smishing', consultas: 20 },
    { slug: 'vishing', titulo: 'Vishing', consultas: 15 },
  ],
  consultasPorCategoria: [
    { slug: 'seguridad-digital', nombre: 'Seguridad digital', consultas: 35 },
  ],
  solicitudesPorTema: [{ tema: 'SEGURIDAD_DIGITAL', cantidad: 6 }],
  hayDatos: true,
  ...sobre,
});

const respuesta = (status: number, cuerpo?: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (cuerpo === undefined) throw new SyntaxError('JSON inválido');
      return cuerpo;
    },
  }) as Response;

describe('HttpEstadisticaRepository (contrato C-11)', () => {
  let repo: HttpEstadisticaRepository;
  beforeEach(() => {
    repo = new HttpEstadisticaRepository('/api/v1');
    vi.restoreAllMocks();
  });

  it('GET con Bearer y las fechas tal cual, sin convertir zona', async () => {
    const f = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(respuesta(200, resumen()));
    const r = await repo.resumen('tok', {
      desde: '2026-11-20',
      hasta: '2026-11-26',
    });
    const [url, init] = f.mock.calls[0];
    expect(url).toBe(
      '/api/v1/gestion/estadisticas/resumen?desde=2026-11-20&hasta=2026-11-26',
    );
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer tok' });
    expect(r.periodo).toEqual({
      desde: '2026-11-20',
      hasta: '2026-11-26',
      zonaHoraria: 'America/Bogota',
    });
    expect(r.totales).toEqual({ consultasGuias: 35, solicitudesAyuda: 6 });
  });

  it('sin criterio no envía parámetros: el servidor aplica los últimos 7 días', async () => {
    const f = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(respuesta(200, resumen()));
    await repo.resumen('t', {});
    expect(f.mock.calls[0][0]).toBe('/api/v1/gestion/estadisticas/resumen');
  });

  it('conserva el orden recibido (el servidor ordena el top 10)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(respuesta(200, resumen()));
    const r = await repo.resumen('t', {});
    expect(r.topGuias.map((g) => g.slug)).toEqual(['smishing', 'vishing']);
    expect(r.solicitudesPorTema[0]).toEqual({
      tema: 'SEGURIDAD_DIGITAL',
      cantidad: 6,
    });
  });

  it('hayDatos=false llega con ceros reales y listas vacías', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      respuesta(
        200,
        resumen({
          totales: { consultasGuias: 0, solicitudesAyuda: 0 },
          topGuias: [],
          consultasPorCategoria: [],
          solicitudesPorTema: [],
          hayDatos: false,
        }),
      ),
    );
    const r = await repo.resumen('t', {});
    expect(r.hayDatos).toBe(false);
    expect(r.totales.consultasGuias).toBe(0);
    expect(r.topGuias).toEqual([]);
  });

  it.each([
    [401, 'SESION'],
    [403, 'PERMISO'],
    [500, 'SERVIDOR'],
    [502, 'SERVIDOR'],
    [503, 'SERVIDOR'],
  ])('HTTP %i -> %s', async (status, tipo) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      respuesta(status, { statusCode: status, codigo: 'X', mensaje: 'm' }),
    );
    await expect(repo.resumen('t', {})).rejects.toMatchObject({
      tipo,
      statusCode: status,
    });
  });

  it.each(['DATOS_INVALIDOS', 'RANGO_FECHAS_INVALIDO'])(
    '400 %s conserva el mensaje del servidor',
    async (codigo) => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        respuesta(400, {
          statusCode: 400,
          codigo,
          mensaje: 'La fecha inicial no es válida.',
        }),
      );
      await expect(repo.resumen('t', {})).rejects.toMatchObject({
        tipo: 'PERIODO_INVALIDO',
        codigo,
        message: 'La fecha inicial no es válida.',
      });
    },
  );

  it('red, timeout y JSON inválido', async () => {
    const f = vi.spyOn(globalThis, 'fetch');
    f.mockRejectedValueOnce(new TypeError('x'));
    await expect(repo.resumen('t', {})).rejects.toMatchObject({
      tipo: 'CONEXION',
    });
    f.mockRejectedValueOnce(new DOMException('t', 'TimeoutError'));
    await expect(repo.resumen('t', {})).rejects.toMatchObject({
      tipo: 'TIMEOUT',
    });
    f.mockResolvedValueOnce(respuesta(200));
    await expect(repo.resumen('t', {})).rejects.toMatchObject({
      tipo: 'RESPUESTA_INVALIDA',
    });
  });

  it('respuestas incompatibles: nunca se inventan ceros', async () => {
    const f = vi.spyOn(globalThis, 'fetch');
    for (const malo of [
      { foo: 1 },
      resumen({ totales: { consultasGuias: null, solicitudesAyuda: 6 } }),
      resumen({ totales: { consultasGuias: -1, solicitudesAyuda: 6 } }),
      resumen({ totales: { consultasGuias: 1.5, solicitudesAyuda: 6 } }),
      resumen({ topGuias: [{ slug: 's', titulo: 't' }] }),
      resumen({ solicitudesPorTema: [{ tema: 'INVENTADO', cantidad: 1 }] }),
      resumen({ hayDatos: 'si' }),
    ]) {
      f.mockResolvedValueOnce(respuesta(200, malo));
      await expect(repo.resumen('t', {})).rejects.toMatchObject({
        tipo: 'RESPUESTA_INVALIDA',
      });
    }
  });

  it('se recupera tras reconectar', async () => {
    const f = vi.spyOn(globalThis, 'fetch');
    f.mockRejectedValueOnce(new TypeError('x'));
    await expect(repo.resumen('t', {})).rejects.toThrow();
    f.mockResolvedValueOnce(respuesta(200, resumen()));
    await expect(repo.resumen('t', {})).resolves.toMatchObject({
      hayDatos: true,
    });
  });
});
