import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpSolicitudesColaRepository } from './HttpSolicitudesColaRepository';

const solicitud = (sobre: Record<string, unknown> = {}) => ({
  id: '55555555-5555-4555-8555-555555555555',
  equipo: '12',
  tema: 'SEGURIDAD_DIGITAL',
  estado: 'PENDIENTE',
  guia: { slug: 'smishing', titulo: 'Smishing' },
  paso: 2,
  creadaEn: '2026-11-27T15:00:00.000Z',
  atendidaPor: null,
  tomadaEn: null,
  resueltaEn: null,
  comentarioResolucion: null,
  ...sobre,
});

const pagina = (datos: unknown[], total = datos.length) => ({
  datos,
  total,
  pagina: 1,
  limite: 20,
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

describe('HttpSolicitudesColaRepository (contrato C-06)', () => {
  let repo: HttpSolicitudesColaRepository;
  beforeEach(() => {
    repo = new HttpSolicitudesColaRepository('/api/v1');
    vi.restoreAllMocks();
  });

  describe('listar', () => {
    it('GET con estado, paginación y orden ascendente; mapea fechas y guía', async () => {
      const f = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(respuesta(200, pagina([solicitud()])));
      const r = await repo.listar('tok', {
        estado: 'PENDIENTE',
        tema: 'CORREO',
        pagina: 2,
        limite: 20,
      });

      const [url, init] = f.mock.calls[0];
      expect(url).toBe(
        '/api/v1/solicitudes-ayuda?estado=PENDIENTE&tema=CORREO&pagina=2&limite=20&ordenarPor=creadaEn&direccion=asc',
      );
      expect(init?.headers).toMatchObject({
        Authorization: 'Bearer tok',
        Accept: 'application/json',
      });
      expect(r.total).toBe(1);
      expect(r.datos[0].creadaEn).toBeInstanceOf(Date);
      expect(r.datos[0].guia).toEqual({ slug: 'smishing', titulo: 'Smishing' });
    });

    it('200 vacío devuelve [] real, no un error', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        respuesta(200, pagina([])),
      );
      await expect(repo.listar('t', {})).resolves.toMatchObject({
        datos: [],
        total: 0,
      });
    });

    it('EN_ATENCION conserva atendidaPor (nombre) y tomadaEn', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        respuesta(
          200,
          pagina([
            solicitud({
              estado: 'EN_ATENCION',
              atendidaPor: 'Luis Díaz',
              tomadaEn: '2026-11-27T15:05:00.000Z',
              guia: null,
              paso: null,
            }),
          ]),
        ),
      );
      const r = await repo.listar('t', { estado: 'EN_ATENCION' });
      expect(r.datos[0].atendidaPor).toBe('Luis Díaz');
      expect(r.datos[0].tomadaEn).toBeInstanceOf(Date);
      expect(r.datos[0].guia).toBeNull();
      expect(r.datos[0].paso).toBeNull();
    });

    it.each([
      [401, 'SESION'],
      [403, 'PERMISO'],
      [404, 'NO_ENCONTRADA'],
      [400, 'VALIDACION'],
      [500, 'SERVIDOR'],
      [502, 'SERVIDOR'],
      [503, 'SERVIDOR'],
    ])('HTTP %i lanza error de tipo %s', async (status, tipo) => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        respuesta(status, { statusCode: status, codigo: 'X', mensaje: 'm' }),
      );
      await expect(repo.listar('t', {})).rejects.toMatchObject({
        name: 'ColaSolicitudError',
        tipo,
        statusCode: status,
      });
    });

    it('error de red y timeout (lectura: no es incierto)', async () => {
      const f = vi.spyOn(globalThis, 'fetch');
      f.mockRejectedValueOnce(new TypeError('fail'));
      await expect(repo.listar('t', {})).rejects.toMatchObject({
        tipo: 'CONEXION',
        resultadoIncierto: false,
      });
      f.mockRejectedValueOnce(new DOMException('t', 'TimeoutError'));
      await expect(repo.listar('t', {})).rejects.toMatchObject({
        tipo: 'TIMEOUT',
      });
    });

    it('JSON inválido y respuestas incompatibles lanzan RESPUESTA_INVALIDA', async () => {
      const f = vi.spyOn(globalThis, 'fetch');
      f.mockResolvedValueOnce(respuesta(200));
      await expect(repo.listar('t', {})).rejects.toMatchObject({
        tipo: 'RESPUESTA_INVALIDA',
      });
      f.mockResolvedValueOnce(respuesta(200, { foo: 1 }));
      await expect(repo.listar('t', {})).rejects.toMatchObject({
        tipo: 'RESPUESTA_INVALIDA',
      });
      f.mockResolvedValueOnce(
        respuesta(200, pagina([solicitud({ tema: 'INVENTADO' })])),
      );
      await expect(repo.listar('t', {})).rejects.toMatchObject({
        tipo: 'RESPUESTA_INVALIDA',
      });
      f.mockResolvedValueOnce(
        respuesta(200, pagina([solicitud({ creadaEn: 'no-fecha' })])),
      );
      await expect(repo.listar('t', {})).rejects.toMatchObject({
        tipo: 'RESPUESTA_INVALIDA',
      });
    });

    it('se recupera tras reconectar', async () => {
      const f = vi.spyOn(globalThis, 'fetch');
      f.mockRejectedValueOnce(new TypeError('fail'));
      await expect(repo.listar('t', {})).rejects.toThrow();
      f.mockResolvedValueOnce(respuesta(200, pagina([solicitud()])));
      await expect(repo.listar('t', {})).resolves.toMatchObject({ total: 1 });
    });
  });

  describe('tomar', () => {
    it('POST sin cuerpo con Bearer y devuelve EN_ATENCION', async () => {
      const f = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(
          respuesta(
            200,
            solicitud({ estado: 'EN_ATENCION', atendidaPor: 'Ana' }),
          ),
        );
      const r = await repo.tomar('tok', 'abc');
      const [url, init] = f.mock.calls[0];
      expect(url).toBe('/api/v1/solicitudes-ayuda/abc/tomar');
      expect(init?.method).toBe('POST');
      expect(init?.body).toBeUndefined();
      expect(r.estado).toBe('EN_ATENCION');
      expect(r.atendidaPor).toBe('Ana');
    });

    it.each([
      ['SOLICITUD_YA_TOMADA', 'Otro monitor ya la atiende.'],
      ['SOLICITUD_MODIFICADA', 'Cambió hace un momento.'],
      ['SOLICITUD_CERRADA', 'Ya se cerró.'],
    ])(
      '409 %s conserva código y mensaje del servidor',
      async (codigo, mensaje) => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
          respuesta(409, { statusCode: 409, codigo, mensaje }),
        );
        await expect(repo.tomar('t', 'x')).rejects.toMatchObject({
          tipo: 'CONFLICTO',
          codigo,
          message: mensaje,
          resultadoIncierto: false,
        });
      },
    );

    it('401, 403 y 404', async () => {
      const f = vi.spyOn(globalThis, 'fetch');
      for (const [status, tipo] of [
        [401, 'SESION'],
        [403, 'PERMISO'],
        [404, 'NO_ENCONTRADA'],
      ] as const) {
        f.mockResolvedValueOnce(
          respuesta(status, { codigo: 'C', mensaje: 'm' }),
        );
        await expect(repo.tomar('t', 'x')).rejects.toMatchObject({ tipo });
      }
    });

    it('red/timeout/JSON roto tras el POST dejan el resultado INCIERTO y no reintentan', async () => {
      const f = vi.spyOn(globalThis, 'fetch');
      f.mockRejectedValueOnce(new TypeError('fail'));
      await expect(repo.tomar('t', 'x')).rejects.toMatchObject({
        tipo: 'CONEXION',
        resultadoIncierto: true,
      });
      f.mockRejectedValueOnce(new DOMException('t', 'TimeoutError'));
      await expect(repo.tomar('t', 'x')).rejects.toMatchObject({
        tipo: 'TIMEOUT',
        resultadoIncierto: true,
      });
      f.mockResolvedValueOnce(respuesta(200));
      await expect(repo.tomar('t', 'x')).rejects.toMatchObject({
        tipo: 'RESPUESTA_INVALIDA',
        resultadoIncierto: true,
      });
      expect(f).toHaveBeenCalledTimes(3); // un POST por intento, sin reintentos automáticos
    });

    it('500 y 503 son error de servidor', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(respuesta(503, {}));
      await expect(repo.tomar('t', 'x')).rejects.toMatchObject({
        tipo: 'SERVIDOR',
      });
    });
  });

  describe('resolver', () => {
    it('POST con comentario JSON y devuelve RESUELTA', async () => {
      const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        respuesta(
          200,
          solicitud({
            estado: 'RESUELTA',
            resueltaEn: '2026-11-27T15:10:00.000Z',
            comentarioResolucion: 'Listo',
          }),
        ),
      );
      const r = await repo.resolver('tok', 'abc', 'Listo');
      const [url, init] = f.mock.calls[0];
      expect(url).toBe('/api/v1/solicitudes-ayuda/abc/resolver');
      expect(init?.headers).toMatchObject({
        'Content-Type': 'application/json',
        Authorization: 'Bearer tok',
      });
      expect(JSON.parse(init?.body as string)).toEqual({ comentario: 'Listo' });
      expect(r.estado).toBe('RESUELTA');
      expect(r.resueltaEn).toBeInstanceOf(Date);
    });

    it('envía comentario null cuando no hay', async () => {
      const f = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(respuesta(200, solicitud({ estado: 'RESUELTA' })));
      await repo.resolver('t', 'x', null);
      expect(JSON.parse(f.mock.calls[0][1]?.body as string)).toEqual({
        comentario: null,
      });
    });

    it.each([
      [403, 'SOLICITUD_DE_OTRO_MONITOR', 'PERMISO'],
      [409, 'SOLICITUD_SIN_TOMAR', 'CONFLICTO'],
      [409, 'SOLICITUD_MODIFICADA', 'CONFLICTO'],
      [409, 'SOLICITUD_CERRADA', 'CONFLICTO'],
      [400, 'VALIDACION', 'VALIDACION'],
    ])('HTTP %i %s', async (status, codigo, tipo) => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        respuesta(status, { statusCode: status, codigo, mensaje: 'm' }),
      );
      await expect(repo.resolver('t', 'x', null)).rejects.toMatchObject({
        tipo,
        codigo,
      });
    });

    it('una caída de red deja el resultado incierto', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fail'));
      await expect(repo.resolver('t', 'x', null)).rejects.toMatchObject({
        resultadoIncierto: true,
      });
    });
  });

  describe('concurrencia (servidor simulado con la semántica verificada en e2e del backend)', () => {
    it('dos monitores toman la misma: uno gana, el otro recibe 409; solo el dueño resuelve', async () => {
      let dueno: string | null = null;
      let estado = 'PENDIENTE';
      const nombres: Record<string, string> = { tokA: 'Ana', tokB: 'Luis' };
      const cuerpoError = (status: number, codigo: string) =>
        respuesta(status, { statusCode: status, codigo, mensaje: codigo });

      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
        const token = String(
          (init?.headers as Record<string, string>).Authorization,
        ).replace('Bearer ', '');
        if (String(url).endsWith('/tomar')) {
          if (estado !== 'PENDIENTE')
            return cuerpoError(409, 'SOLICITUD_YA_TOMADA');
          estado = 'EN_ATENCION';
          dueno = token;
          return respuesta(
            200,
            solicitud({ estado, atendidaPor: nombres[token] }),
          );
        }
        if (String(url).endsWith('/resolver')) {
          if (estado === 'RESUELTA')
            return cuerpoError(409, 'SOLICITUD_CERRADA');
          if (dueno !== token)
            return cuerpoError(403, 'SOLICITUD_DE_OTRO_MONITOR');
          estado = 'RESUELTA';
          return respuesta(200, solicitud({ estado }));
        }
        return respuesta(200, pagina([]));
      });

      const [a, b] = await Promise.allSettled([
        repo.tomar('tokA', 'id'),
        repo.tomar('tokB', 'id'),
      ]);
      expect(a.status).toBe('fulfilled');
      expect(b).toMatchObject({
        status: 'rejected',
        reason: { tipo: 'CONFLICTO', codigo: 'SOLICITUD_YA_TOMADA' },
      });

      await expect(repo.resolver('tokB', 'id', null)).rejects.toMatchObject({
        tipo: 'PERMISO',
        codigo: 'SOLICITUD_DE_OTRO_MONITOR',
      });
      await expect(repo.resolver('tokA', 'id', 'ok')).resolves.toMatchObject({
        estado: 'RESUELTA',
      });
      await expect(repo.resolver('tokA', 'id', 'otra')).rejects.toMatchObject({
        tipo: 'CONFLICTO',
        codigo: 'SOLICITUD_CERRADA',
      });
    });
  });
});
