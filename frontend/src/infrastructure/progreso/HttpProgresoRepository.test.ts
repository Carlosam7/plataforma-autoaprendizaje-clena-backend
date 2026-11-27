import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpProgresoRepository } from './HttpProgresoRepository';

const progreso = (sobre: Record<string, unknown> = {}) => ({
  slug: 'smishing',
  categoria: 'seguridad-digital',
  titulo: 'Smishing',
  nivel: 'BASICO',
  totalPasos: 3,
  pasosLeidos: 1,
  porcentaje: 25,
  estado: 'EN_CURSO',
  completada: false,
  tieneActividad: true,
  actividadAprobada: false,
  ultimoPaso: 2,
  completadaEn: null,
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

describe('HttpProgresoRepository (contrato C-10)', () => {
  let repo: HttpProgresoRepository;
  beforeEach(() => {
    repo = new HttpProgresoRepository('/api/v1');
    vi.restoreAllMocks();
  });

  describe('listar', () => {
    it('GET /progreso con Bearer, filtro, orden y paginación; mapea el ejemplo real', async () => {
      const f = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(respuesta(200, pagina([progreso()])));
      const r = await repo.listar('tok', {
        categoria: 'seguridad-digital',
        pagina: 2,
        limite: 20,
      });
      const [url, init] = f.mock.calls[0];
      expect(url).toBe(
        '/api/v1/progreso?categoria=seguridad-digital&ordenarPor=titulo&direccion=asc&pagina=2&limite=20',
      );
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer tok' });
      expect(r.datos[0]).toMatchObject({
        slug: 'smishing',
        porcentaje: 25,
        estado: 'EN_CURSO',
        ultimoPaso: 2,
        completadaEn: null,
      });
    });

    it('incluye guías SIN_EMPEZAR (0 %) y COMPLETADA con fecha', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        respuesta(
          200,
          pagina([
            progreso({
              estado: 'SIN_EMPEZAR',
              pasosLeidos: 0,
              porcentaje: 0,
              ultimoPaso: null,
            }),
            progreso({
              slug: 'otra',
              estado: 'COMPLETADA',
              completada: true,
              porcentaje: 100,
              completadaEn: '2026-11-27T15:00:00.000Z',
            }),
          ]),
        ),
      );
      const r = await repo.listar('t', {});
      expect(r.datos[0].ultimoPaso).toBeNull();
      expect(r.datos[1].completadaEn).toBeInstanceOf(Date);
    });

    it('lista vacía real devuelve []', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        respuesta(200, pagina([])),
      );
      await expect(repo.listar('t', {})).resolves.toMatchObject({
        datos: [],
        total: 0,
      });
    });

    it.each([
      [401, 'SESION'],
      [403, 'PERMISO'],
      [400, 'VALIDACION'],
      [500, 'SERVIDOR'],
      [502, 'SERVIDOR'],
      [503, 'SERVIDOR'],
    ])('HTTP %i -> %s', async (status, tipo) => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        respuesta(status, { statusCode: status, codigo: 'X', mensaje: 'm' }),
      );
      await expect(repo.listar('t', {})).rejects.toMatchObject({
        tipo,
        statusCode: status,
      });
    });

    it('red, timeout, JSON inválido y respuestas incompatibles', async () => {
      const f = vi.spyOn(globalThis, 'fetch');
      f.mockRejectedValueOnce(new TypeError('x'));
      await expect(repo.listar('t', {})).rejects.toMatchObject({
        tipo: 'CONEXION',
      });
      f.mockRejectedValueOnce(new DOMException('t', 'TimeoutError'));
      await expect(repo.listar('t', {})).rejects.toMatchObject({
        tipo: 'TIMEOUT',
      });
      f.mockResolvedValueOnce(respuesta(200));
      await expect(repo.listar('t', {})).rejects.toMatchObject({
        tipo: 'RESPUESTA_INVALIDA',
      });
      f.mockResolvedValueOnce(respuesta(200, { foo: 1 }));
      await expect(repo.listar('t', {})).rejects.toMatchObject({
        tipo: 'RESPUESTA_INVALIDA',
      });
      for (const malo of [
        { estado: 'INVENTADO' },
        { porcentaje: 140 },
        { porcentaje: 'mucho' },
        { nivel: 'EXPERTO' },
        { completadaEn: 'ayer' },
      ]) {
        f.mockResolvedValueOnce(respuesta(200, pagina([progreso(malo)])));
        await expect(repo.listar('t', {})).rejects.toMatchObject({
          tipo: 'RESPUESTA_INVALIDA',
        });
      }
    });

    it('se recupera tras reconectar', async () => {
      const f = vi.spyOn(globalThis, 'fetch');
      f.mockRejectedValueOnce(new TypeError('x'));
      await expect(repo.listar('t', {})).rejects.toThrow();
      f.mockResolvedValueOnce(respuesta(200, pagina([progreso()])));
      await expect(repo.listar('t', {})).resolves.toMatchObject({ total: 1 });
    });
  });

  describe('registrarLectura', () => {
    it('POST sin cuerpo a /guias/:slug/pasos/:orden/lectura y devuelve el progreso actualizado', async () => {
      const f = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(
          respuesta(200, progreso({ pasosLeidos: 2, porcentaje: 50 })),
        );
      const r = await repo.registrarLectura('tok', 'smishing', 2);
      const [url, init] = f.mock.calls[0];
      expect(url).toBe('/api/v1/guias/smishing/pasos/2/lectura');
      expect(init?.method).toBe('POST');
      expect(init?.body).toBeUndefined();
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer tok' });
      expect(r.porcentaje).toBe(50);
    });

    it('404 PASO_NO_ENCONTRADO se distingue de una guía inexistente', async () => {
      const f = vi.spyOn(globalThis, 'fetch');
      f.mockResolvedValueOnce(
        respuesta(404, {
          statusCode: 404,
          codigo: 'PASO_NO_ENCONTRADO',
          mensaje: 'm',
        }),
      );
      await expect(repo.registrarLectura('t', 's', 9)).rejects.toMatchObject({
        tipo: 'PASO_NO_ENCONTRADO',
      });
      f.mockResolvedValueOnce(
        respuesta(404, {
          statusCode: 404,
          codigo: 'GUIA_NO_ENCONTRADA',
          mensaje: 'm',
        }),
      );
      await expect(repo.registrarLectura('t', 's', 1)).rejects.toMatchObject({
        tipo: 'NO_ENCONTRADA',
      });
    });

    it('401, 403, red y respuesta incompatible', async () => {
      const f = vi.spyOn(globalThis, 'fetch');
      f.mockResolvedValueOnce(respuesta(401, { codigo: 'C', mensaje: 'm' }));
      await expect(repo.registrarLectura('t', 's', 1)).rejects.toMatchObject({
        tipo: 'SESION',
      });
      f.mockResolvedValueOnce(respuesta(403, { codigo: 'C', mensaje: 'm' }));
      await expect(repo.registrarLectura('t', 's', 1)).rejects.toMatchObject({
        tipo: 'PERMISO',
      });
      f.mockRejectedValueOnce(new TypeError('x'));
      await expect(repo.registrarLectura('t', 's', 1)).rejects.toMatchObject({
        tipo: 'CONEXION',
      });
      f.mockResolvedValueOnce(respuesta(200, { slug: 's' }));
      await expect(repo.registrarLectura('t', 's', 1)).rejects.toMatchObject({
        tipo: 'RESPUESTA_INVALIDA',
      });
    });

    it('escapa el slug en la ruta', async () => {
      const f = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(respuesta(200, progreso()));
      await repo.registrarLectura('t', 'a/b', 1);
      expect(f.mock.calls[0][0]).toBe('/api/v1/guias/a%2Fb/pasos/1/lectura');
    });
  });
});
