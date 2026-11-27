import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AyudaError,
  AyudaNoDisponibleError,
  ConexionAyudaError,
  DatosAyudaInvalidosError,
  EquipoConSolicitudActivaError,
  RespuestaInesperadaAyudaError,
  SolicitudCambioEstadoError,
  SolicitudNoEncontradaError,
} from '@/domain/ayuda/errors';
import { HttpAyudaRepository } from './HttpAyudaRepository';

// Fixtures contractuales de C-05 (KAMA-API-CLOSE-2026-11-27-v2.2) y DTO reales del backend.
const ID = '55555555-5555-4555-8555-555555555555';
const SOLICITUD_C05 = {
  id: ID,
  equipo: '12',
  tema: 'SEGURIDAD_DIGITAL',
  estado: 'PENDIENTE',
  posicion: 2,
  creadaEn: '2026-11-26T19:00:00.000Z',
};
const CREADA_C05 = { ...SOLICITUD_C05, yaExistia: false };

function respuestaOk(cuerpo: unknown, status = 200): Response {
  return { ok: true, status, json: async () => cuerpo } as unknown as Response;
}

function respuestaError(
  status: number,
  codigo?: string,
  mensaje?: string,
  detalles?: unknown,
): Response {
  return {
    ok: false,
    status,
    json: async () => ({
      statusCode: status,
      codigo,
      mensaje,
      detalles,
      ruta: '/api/v1/solicitudes-ayuda',
      fecha: '2026-11-26T19:00:00.000Z',
    }),
  } as unknown as Response;
}

function mockFetch(res: Response | Error) {
  const spy = vi.spyOn(globalThis, 'fetch');
  if (res instanceof Error) spy.mockRejectedValueOnce(res);
  else spy.mockResolvedValueOnce(res);
  return spy;
}

describe('HttpAyudaRepository · C-05', () => {
  const repo = new HttpAyudaRepository({ baseUrl: '/api/v1' });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /solicitudes-ayuda', () => {
    it('envía exactamente el cuerpo de C-05 con la cookie del navegador', async () => {
      const spy = mockFetch(respuestaOk(CREADA_C05, 201));

      const creada = await repo.solicitar({
        equipo: '12',
        tema: 'SEGURIDAD_DIGITAL',
        guiaSlug: 'smishing',
        pasoOrden: 2,
      });

      expect(spy).toHaveBeenCalledWith(
        '/api/v1/solicitudes-ayuda',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
      const init = spy.mock.calls[0][1] as RequestInit;
      expect(JSON.parse(init.body as string)).toEqual({
        equipo: '12',
        tema: 'SEGURIDAD_DIGITAL',
        guiaSlug: 'smishing',
        pasoOrden: 2,
      });
      expect(init.headers).toMatchObject({
        Accept: 'application/json',
        'Content-Type': 'application/json',
      });
      // La llave va solo en la cookie httpOnly: el frontend no envía Authorization ni la conoce.
      expect(init.headers).not.toHaveProperty('Authorization');
      expect(creada).toEqual(CREADA_C05);
    });

    it('no envía pasoOrden sin guía', async () => {
      const spy = mockFetch(respuestaOk(CREADA_C05, 201));
      await repo.solicitar({ equipo: '12', tema: 'OTRO', pasoOrden: 2 });
      const init = spy.mock.calls[0][1] as RequestInit;
      expect(JSON.parse(init.body as string)).toEqual({
        equipo: '12',
        tema: 'OTRO',
      });
    });

    it('200 con yaExistia: la misma solicitud de este navegador', async () => {
      mockFetch(respuestaOk({ ...SOLICITUD_C05, yaExistia: true }, 200));
      const creada = await repo.solicitar({ equipo: '12', tema: 'OTRO' });
      expect(creada).toMatchObject({ id: ID, yaExistia: true });
    });

    it('409 EQUIPO_CON_SOLICITUD_ACTIVA muestra el mensaje del servidor', async () => {
      mockFetch(
        respuestaError(
          409,
          'EQUIPO_CON_SOLICITUD_ACTIVA',
          'Ya hay una solicitud de ayuda para ese equipo y un monitor irá pronto.',
        ),
      );
      const error = await repo
        .solicitar({ equipo: '12', tema: 'OTRO' })
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(EquipoConSolicitudActivaError);
      expect((error as Error).message).toContain('un monitor irá pronto');
    });

    it('400 indica el campo con error (detalles.campos del DTO)', async () => {
      mockFetch(
        respuestaError(400, 'DATOS_INVALIDOS', 'Escribe en qué equipo estás.', {
          campos: { equipo: ['Escribe en qué equipo estás.'] },
        }),
      );
      const error = await repo
        .solicitar({ equipo: ' ', tema: 'OTRO' })
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(DatosAyudaInvalidosError);
      expect(error).toMatchObject({
        campo: 'equipo',
        message: 'Escribe en qué equipo estás.',
      });
    });

    it('400 DATO_INVALIDO del dominio usa detalles.campo', async () => {
      mockFetch(
        respuestaError(400, 'DATO_INVALIDO', 'Escribe en qué equipo estás.', {
          campo: 'equipo',
        }),
      );
      const error = await repo
        .solicitar({ equipo: 'x', tema: 'OTRO' })
        .catch((e: unknown) => e);
      expect(error).toMatchObject({ campo: 'equipo', codigo: 'DATO_INVALIDO' });
    });

    it('sin red, el POST es ambiguo: pudo haber llegado', async () => {
      mockFetch(new TypeError('Failed to fetch'));
      const error = await repo
        .solicitar({ equipo: '12', tema: 'OTRO' })
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ConexionAyudaError);
      expect((error as ConexionAyudaError).ambigua).toBe(true);
    });

    it('5xx es un error de servicio, nunca datos simulados', async () => {
      mockFetch(respuestaError(500, 'ERROR_INTERNO'));
      await expect(
        repo.solicitar({ equipo: '12', tema: 'OTRO' }),
      ).rejects.toBeInstanceOf(AyudaNoDisponibleError);
    });

    it('rechaza una respuesta que no cumple el contrato', async () => {
      mockFetch(respuestaOk({ ...SOLICITUD_C05 }, 201)); // falta yaExistia
      await expect(
        repo.solicitar({ equipo: '12', tema: 'OTRO' }),
      ).rejects.toBeInstanceOf(RespuestaInesperadaAyudaError);
    });
  });

  describe('GET /solicitudes-ayuda/:id', () => {
    it('consulta con la cookie y mapea solo los campos de C-05', async () => {
      const spy = mockFetch(
        respuestaOk({ ...SOLICITUD_C05, usuarioId: '41234567' }),
      );
      const solicitud = await repo.consultar(ID);
      expect(spy).toHaveBeenCalledWith(
        `/api/v1/solicitudes-ayuda/${ID}`,
        expect.objectContaining({ method: 'GET', credentials: 'include' }),
      );
      expect((spy.mock.calls[0][1] as RequestInit).body).toBeUndefined();
      expect(solicitud).toEqual(SOLICITUD_C05);
    });

    it('posicion null cuando ya la atienden', async () => {
      mockFetch(
        respuestaOk({
          ...SOLICITUD_C05,
          estado: 'EN_ATENCION',
          posicion: null,
        }),
      );
      expect(await repo.consultar(ID)).toMatchObject({
        estado: 'EN_ATENCION',
        posicion: null,
      });
    });

    it('404 (no existe o es de otro navegador) es SolicitudNoEncontradaError', async () => {
      mockFetch(respuestaError(404, 'SOLICITUD_NO_ENCONTRADA'));
      await expect(repo.consultar(ID)).rejects.toBeInstanceOf(
        SolicitudNoEncontradaError,
      );
    });

    it('sin red, el GET no es ambiguo', async () => {
      mockFetch(new TypeError('Failed to fetch'));
      const error = await repo.consultar(ID).catch((e: unknown) => e);
      expect((error as ConexionAyudaError).ambigua).toBe(false);
    });

    it('JSON inválido o un estado desconocido son respuesta inesperada', async () => {
      mockFetch({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
      } as unknown as Response);
      await expect(repo.consultar(ID)).rejects.toBeInstanceOf(
        RespuestaInesperadaAyudaError,
      );

      mockFetch(respuestaOk({ ...SOLICITUD_C05, estado: 'PERDIDA' }));
      await expect(repo.consultar(ID)).rejects.toBeInstanceOf(
        RespuestaInesperadaAyudaError,
      );
    });
  });

  describe('DELETE /solicitudes-ayuda/:id', () => {
    it('204 sin cuerpo: no lee JSON', async () => {
      const json = vi.fn();
      const spy = mockFetch({
        ok: true,
        status: 204,
        json,
      } as unknown as Response);
      await repo.cancelar(ID);
      expect(spy).toHaveBeenCalledWith(
        `/api/v1/solicitudes-ayuda/${ID}`,
        expect.objectContaining({ method: 'DELETE', credentials: 'include' }),
      );
      expect(json).not.toHaveBeenCalled();
    });

    it.each(['SOLICITUD_CERRADA', 'SOLICITUD_MODIFICADA'])(
      '409 %s es un cambio de estado',
      async (codigo) => {
        mockFetch(
          respuestaError(409, codigo, 'Esta solicitud ya fue atendida.'),
        );
        const error = await repo.cancelar(ID).catch((e: unknown) => e);
        expect(error).toBeInstanceOf(SolicitudCambioEstadoError);
        expect(error).toMatchObject({ codigo });
      },
    );

    it('404 si es de otro navegador', async () => {
      mockFetch(respuestaError(404, 'SOLICITUD_NO_ENCONTRADA'));
      await expect(repo.cancelar(ID)).rejects.toBeInstanceOf(
        SolicitudNoEncontradaError,
      );
    });

    it('sin red, el DELETE es ambiguo', async () => {
      mockFetch(new TypeError('Failed to fetch'));
      const error = await repo.cancelar(ID).catch((e: unknown) => e);
      expect((error as ConexionAyudaError).ambigua).toBe(true);
    });

    it('otro estado HTTP inesperado es un AyudaError genérico', async () => {
      mockFetch(respuestaError(418, undefined, 'Soy una tetera'));
      const error = await repo.cancelar(ID).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(AyudaError);
      expect(error).toMatchObject({ statusCode: 418 });
    });
  });
});
