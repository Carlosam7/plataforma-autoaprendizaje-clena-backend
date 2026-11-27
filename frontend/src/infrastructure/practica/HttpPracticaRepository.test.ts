import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AccesoDenegadoPracticaError,
  ActividadNoEncontradaError,
  ConexionPracticaError,
  EvaluacionInvitadoNoDisponibleError,
  IntentoFinalizadoError,
  IntentoNoEncontradoError,
  PracticaError,
  PracticaNoDisponibleError,
  PreguntaNoEncontradaError,
  PreguntaYaRespondidaError,
  RespuestaInesperadaError,
  RespuestaInvalidaError,
  SesionRequeridaError,
} from '@/domain/practica/errors';
import { HttpPracticaRepository } from './HttpPracticaRepository';

// Fixtures contractuales tomados de C-03 (KAMA-API-CLOSE-2026-11-26-v2) y DTO reales del backend.
const P1 = '11111111-1111-4111-8111-111111111111';
const O1 = '22222222-2222-4222-8222-222222222222';
const O2 = '33333333-3333-4333-8333-333333333333';
const INTENTO = '44444444-4444-4444-8444-444444444444';
const TOKEN = 'token-usuario-publico';

const ACTIVIDAD_C03 = {
  titulo: 'Práctica de Smishing',
  porcentajeAprobacion: 70,
  totalPreguntas: 1,
  preguntas: [
    {
      id: P1,
      enunciado: '¿Qué harías ante un enlace sospechoso?',
      opciones: [
        { id: O1, texto: 'No abrirlo' },
        { id: O2, texto: 'Abrirlo inmediatamente' },
      ],
    },
  ],
};

const RESPUESTA_INTERMEDIA_C03 = {
  esCorrecta: true,
  opcionCorrecta: { id: O1, texto: 'No abrirlo' },
  explicacion: 'Los mensajes sospechosos deben verificarse.',
  respondidas: 1,
  totalPreguntas: 2,
  resultado: null,
};

const RESPUESTA_FINAL_C03 = {
  ...RESPUESTA_INTERMEDIA_C03,
  respondidas: 2,
  resultado: {
    respuestasCorrectas: 2,
    totalPreguntas: 2,
    porcentaje: 100,
    aprobado: true,
    porcentajeAprobacion: 70,
  },
};

function respuestaOk(cuerpo: unknown, status = 200): Response {
  return {
    ok: true,
    status,
    json: async () => cuerpo,
  } as unknown as Response;
}

function respuestaError(status: number, codigo?: string, mensaje?: string) {
  return {
    ok: false,
    status,
    json: async () => ({
      statusCode: status,
      codigo,
      mensaje,
      ruta: '/api/v1/x',
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

describe('HttpPracticaRepository · C-03', () => {
  const repo = new HttpPracticaRepository({ baseUrl: '/api/v1' });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /guias/:slug/actividad', () => {
    it('consulta la ruta pública y mapea preguntas con UUID', async () => {
      const spy = mockFetch(respuestaOk(ACTIVIDAD_C03));

      const actividad = await repo.obtenerActividad('smishing');

      expect(spy).toHaveBeenCalledWith(
        '/api/v1/guias/smishing/actividad',
        expect.objectContaining({ method: 'GET', credentials: 'include' }),
      );
      const init = spy.mock.calls[0][1] as RequestInit;
      expect(init.headers).not.toHaveProperty('Authorization');
      expect(init.body).toBeUndefined();
      expect(actividad).toEqual(ACTIVIDAD_C03);
    });

    it('descarta campos que revelen la respuesta antes de contestar', async () => {
      const conFuga = {
        ...ACTIVIDAD_C03,
        preguntas: [
          {
            ...ACTIVIDAD_C03.preguntas[0],
            opcionCorrecta: O1,
            explicacion: 'secreto',
            opciones: [
              { id: O1, texto: 'No abrirlo', esCorrecta: true },
              { id: O2, texto: 'Abrirlo', esCorrecta: false },
            ],
          },
        ],
      };
      mockFetch(respuestaOk(conFuga));

      const actividad = await repo.obtenerActividad('smishing');
      const serializado = JSON.stringify(actividad);

      expect(serializado).not.toContain('esCorrecta');
      expect(serializado).not.toContain('opcionCorrecta');
      expect(serializado).not.toContain('explicacion');
    });

    it('codifica el slug en la URL', async () => {
      const spy = mockFetch(respuestaOk(ACTIVIDAD_C03));
      await repo.obtenerActividad('a b');
      expect(spy.mock.calls[0][0]).toBe('/api/v1/guias/a%20b/actividad');
    });

    it('404 ACTIVIDAD_NO_ENCONTRADA → ActividadNoEncontradaError con el mensaje del backend', async () => {
      mockFetch(
        respuestaError(
          404,
          'ACTIVIDAD_NO_ENCONTRADA',
          'Esta guía no tiene actividad de práctica.',
        ),
      );
      const error = await repo.obtenerActividad('vishing').catch((e) => e);
      expect(error).toBeInstanceOf(ActividadNoEncontradaError);
      expect(error.message).toBe('Esta guía no tiene actividad de práctica.');
    });

    it('500 → PracticaNoDisponibleError (sin fallback a datos simulados)', async () => {
      mockFetch(respuestaError(500, 'ERROR_INTERNO'));
      await expect(repo.obtenerActividad('smishing')).rejects.toBeInstanceOf(
        PracticaNoDisponibleError,
      );
    });

    it('error de red en GET → ConexionPracticaError no ambiguo', async () => {
      mockFetch(new TypeError('Failed to fetch'));
      const error = await repo.obtenerActividad('smishing').catch((e) => e);
      expect(error).toBeInstanceOf(ConexionPracticaError);
      expect(error.ambigua).toBe(false);
    });

    it('JSON inválido → RespuestaInesperadaError', async () => {
      mockFetch({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
      } as unknown as Response);
      await expect(repo.obtenerActividad('smishing')).rejects.toBeInstanceOf(
        RespuestaInesperadaError,
      );
    });

    it('forma inesperada (sin preguntas) → RespuestaInesperadaError', async () => {
      mockFetch(respuestaOk({ titulo: 'x', porcentajeAprobacion: 70 }));
      await expect(repo.obtenerActividad('smishing')).rejects.toBeInstanceOf(
        RespuestaInesperadaError,
      );
    });

    it('timeout → aborta la petición y lanza ConexionPracticaError', async () => {
      vi.useFakeTimers();
      try {
        const lento = new HttpPracticaRepository({ timeoutMs: 1000 });
        vi.spyOn(globalThis, 'fetch').mockImplementationOnce(
          (_url, init) =>
            new Promise((_resolve, reject) => {
              init?.signal?.addEventListener('abort', () =>
                reject(new DOMException('Aborted', 'AbortError')),
              );
            }),
        );
        const promesa = lento.obtenerActividad('smishing').catch((e) => e);
        await vi.advanceTimersByTimeAsync(1000);
        const error = await promesa;
        expect(error).toBeInstanceOf(ConexionPracticaError);
        expect(error.ambigua).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('POST /guias/:slug/actividad/intentos', () => {
    it('envía Bearer, sin cuerpo, y mapea { id, totalPreguntas }', async () => {
      const spy = mockFetch(
        respuestaOk({ id: INTENTO, totalPreguntas: 2 }, 201),
      );

      const intento = await repo.iniciarIntentoAutenticado('smishing', TOKEN);

      expect(spy).toHaveBeenCalledWith(
        '/api/v1/guias/smishing/actividad/intentos',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: expect.objectContaining({
            Authorization: `Bearer ${TOKEN}`,
          }),
        }),
      );
      expect((spy.mock.calls[0][1] as RequestInit).body).toBeUndefined();
      expect(intento).toEqual({ id: INTENTO, totalPreguntas: 2 });
    });

    it('error de red en POST de intento → ConexionPracticaError ambiguo', async () => {
      mockFetch(new TypeError('Failed to fetch'));
      const error = await repo
        .iniciarIntentoAutenticado('smishing', TOKEN)
        .catch((e) => e);
      expect(error).toBeInstanceOf(ConexionPracticaError);
      expect(error.ambigua).toBe(true);
    });

    it('404 → ActividadNoEncontradaError', async () => {
      mockFetch(respuestaError(404, 'ACTIVIDAD_NO_ENCONTRADA'));
      await expect(
        repo.iniciarIntentoAutenticado('no-existe', TOKEN),
      ).rejects.toBeInstanceOf(ActividadNoEncontradaError);
    });
  });

  describe('POST /intentos/:id/respuestas', () => {
    const respuesta = { preguntaId: P1, opcionId: O1 };

    it('envía { preguntaId, opcionId } con Bearer y mapea retroalimentación intermedia', async () => {
      const spy = mockFetch(respuestaOk(RESPUESTA_INTERMEDIA_C03, 201));

      const evaluada = await repo.responderAutenticado(
        INTENTO,
        respuesta,
        TOKEN,
      );

      expect(spy).toHaveBeenCalledWith(
        `/api/v1/intentos/${INTENTO}/respuestas`,
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify(respuesta),
          headers: expect.objectContaining({
            Authorization: `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
          }),
        }),
      );
      expect(evaluada).toEqual(RESPUESTA_INTERMEDIA_C03);
      expect(evaluada.resultado).toBeNull();
    });

    it('la última respuesta trae el resultado final', async () => {
      mockFetch(respuestaOk(RESPUESTA_FINAL_C03, 201));
      const evaluada = await repo.responderAutenticado(
        INTENTO,
        respuesta,
        TOKEN,
      );
      expect(evaluada.resultado).toEqual(RESPUESTA_FINAL_C03.resultado);
    });

    it('respuesta sin campo resultado → RespuestaInesperadaError', async () => {
      const sinResultado: Record<string, unknown> = {
        ...RESPUESTA_INTERMEDIA_C03,
      };
      delete sinResultado.resultado;
      mockFetch(respuestaOk(sinResultado, 201));
      await expect(
        repo.responderAutenticado(INTENTO, respuesta, TOKEN),
      ).rejects.toBeInstanceOf(RespuestaInesperadaError);
    });

    it.each([
      [400, 'RESPUESTA_INVALIDA', RespuestaInvalidaError],
      [400, 'DATOS_INVALIDOS', RespuestaInvalidaError],
      [401, 'NO_AUTENTICADO', SesionRequeridaError],
      [403, 'SIN_PERMISO', AccesoDenegadoPracticaError],
      [404, 'INTENTO_NO_ENCONTRADO', IntentoNoEncontradoError],
      [409, 'PREGUNTA_YA_RESPONDIDA', PreguntaYaRespondidaError],
      [409, 'INTENTO_FINALIZADO', IntentoFinalizadoError],
      [500, 'ERROR_INTERNO', PracticaNoDisponibleError],
      [503, undefined, PracticaNoDisponibleError],
    ])('HTTP %i %s → %o', async (status, codigo, Clase) => {
      mockFetch(respuestaError(status, codigo, 'Mensaje del servidor'));
      const error = await repo
        .responderAutenticado(INTENTO, respuesta, TOKEN)
        .catch((e) => e);
      expect(error).toBeInstanceOf(Clase);
      expect(error).toBeInstanceOf(PracticaError);
      expect(error.statusCode).toBe(status === 503 ? 503 : status);
    });

    it('409 sin código conocido → PracticaError 409 genérico', async () => {
      mockFetch(respuestaError(409, 'CONFLICTO'));
      const error = await repo
        .responderAutenticado(INTENTO, respuesta, TOKEN)
        .catch((e) => e);
      expect(error).toBeInstanceOf(PracticaError);
      expect(error.statusCode).toBe(409);
      expect(error.codigo).toBe('CONFLICTO');
    });

    it('error sin cuerpo JSON usa mensaje por defecto en español', async () => {
      mockFetch({
        ok: false,
        status: 409,
        json: async () => {
          throw new SyntaxError('vacío');
        },
      } as unknown as Response);
      const error = await repo
        .responderAutenticado(INTENTO, respuesta, TOKEN)
        .catch((e) => e);
      expect(error).toBeInstanceOf(PracticaError);
      expect(error.message).toMatch(/práctica/i);
    });

    it('timeout/red en POST de respuesta → ConexionPracticaError ambiguo y sin reintento', async () => {
      const spy = mockFetch(new TypeError('Failed to fetch'));
      const error = await repo
        .responderAutenticado(INTENTO, respuesta, TOKEN)
        .catch((e) => e);
      expect(error).toBeInstanceOf(ConexionPracticaError);
      expect(error.ambigua).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});

describe('HttpPracticaRepository · C-04 (EXISTENTE · BE-01)', () => {
  const respuesta = { preguntaId: P1, opcionId: O1 };
  const FEEDBACK_C04 = {
    esCorrecta: true,
    opcionCorrecta: { id: O1, texto: 'No abrirlo' },
    explicacion: 'Los mensajes sospechosos deben verificarse.',
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('cuando se desactiva explícitamente: lanza error sin llamar a la red', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    const repo = new HttpPracticaRepository({
      evaluacionInvitadoHabilitada: false,
    });
    await expect(
      repo.evaluarInvitado('smishing', respuesta),
    ).rejects.toBeInstanceOf(EvaluacionInvitadoNoDisponibleError);
    expect(spy).not.toHaveBeenCalled();
  });

  describe('habilitado por defecto', () => {
    const repo = new HttpPracticaRepository();

    it('POST sin Authorization con { preguntaId, opcionId } y mapea el feedback', async () => {
      const spy = mockFetch(respuestaOk(FEEDBACK_C04));

      const feedback = await repo.evaluarInvitado('smishing', respuesta);

      expect(spy).toHaveBeenCalledWith(
        '/api/v1/guias/smishing/actividad/evaluar-respuesta',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(respuesta),
        }),
      );
      const init = spy.mock.calls[0][1] as RequestInit;
      expect(init.headers).not.toHaveProperty('Authorization');
      expect(feedback).toEqual(FEEDBACK_C04);
    });

    it('404 genérico de ruta inexistente → EvaluacionInvitadoNoDisponibleError', async () => {
      mockFetch(respuestaError(404, 'NO_ENCONTRADO'));
      await expect(
        repo.evaluarInvitado('smishing', respuesta),
      ).rejects.toBeInstanceOf(EvaluacionInvitadoNoDisponibleError);
    });

    it('404 ACTIVIDAD_NO_ENCONTRADA → ActividadNoEncontradaError', async () => {
      mockFetch(respuestaError(404, 'ACTIVIDAD_NO_ENCONTRADA'));
      await expect(
        repo.evaluarInvitado('smishing', respuesta),
      ).rejects.toBeInstanceOf(ActividadNoEncontradaError);
    });

    it('404 PREGUNTA_NO_ENCONTRADA → PreguntaNoEncontradaError', async () => {
      mockFetch(
        respuestaError(
          404,
          'PREGUNTA_NO_ENCONTRADA',
          'Esta pregunta no es de la práctica de esta guía.',
        ),
      );
      await expect(
        repo.evaluarInvitado('smishing', respuesta),
      ).rejects.toBeInstanceOf(PreguntaNoEncontradaError);
    });

    it('400 opción ajena → RespuestaInvalidaError', async () => {
      mockFetch(respuestaError(400, 'RESPUESTA_INVALIDA'));
      await expect(
        repo.evaluarInvitado('smishing', respuesta),
      ).rejects.toBeInstanceOf(RespuestaInvalidaError);
    });

    it('red caída → ConexionPracticaError no ambiguo (stateless)', async () => {
      mockFetch(new TypeError('Failed to fetch'));
      const error = await repo
        .evaluarInvitado('smishing', respuesta)
        .catch((e) => e);
      expect(error).toBeInstanceOf(ConexionPracticaError);
      expect(error.ambigua).toBe(false);
    });
  });
});
