import { describe, expect, it, vi } from 'vitest';
import type { AuthRepository } from '@/application/auth/ports';
import type { AuthSession } from '@/domain/auth/types';
import {
  IntentoNoEncontradoError,
  RespuestaInesperadaError,
  RespuestaInvalidaError,
  SesionRequeridaError,
} from '@/domain/practica/errors';
import type { Actividad, Pregunta } from '@/domain/practica/types';
import { EvaluarRespuestaInvitado } from './EvaluarRespuestaInvitado';
import { IniciarIntentoAutenticado } from './IniciarIntentoAutenticado';
import { ObtenerActividad } from './ObtenerActividad';
import type { PracticaRepository } from './ports';
import { ResponderPreguntaAutenticado } from './ResponderPreguntaAutenticado';
import { determinarModoPractica } from './sesionPractica';

const uuid = (n: number) =>
  `${String(n).padStart(8, '0')}-0000-4000-8000-000000000000`;

function pregunta(n: number, opciones: number): Pregunta {
  return {
    id: uuid(n * 100),
    enunciado: `Pregunta ${n}`,
    opciones: Array.from({ length: opciones }, (_, i) => ({
      id: uuid(n * 100 + i + 1),
      texto: `Opción ${i + 1}`,
    })),
  };
}

function actividad(preguntas: Pregunta[]): Actividad {
  return {
    titulo: 'Práctica',
    porcentajeAprobacion: 70,
    totalPreguntas: preguntas.length,
    preguntas,
  };
}

function repoMock(overrides: Partial<PracticaRepository> = {}) {
  return {
    obtenerActividad: vi.fn(),
    iniciarIntentoAutenticado: vi.fn(),
    responderAutenticado: vi.fn(),
    evaluarInvitado: vi.fn(),
    ...overrides,
  } as PracticaRepository & {
    [K in keyof PracticaRepository]: ReturnType<typeof vi.fn>;
  };
}

function authMock(
  sesion: AuthSession | null,
  renovar?: () => Promise<AuthSession>,
): AuthRepository {
  return {
    obtenerAvisoPrivacidad: vi.fn(),
    solicitarRegistro: vi.fn(),
    solicitarInicioSesion: vi.fn(),
    verificarRegistro: vi.fn(),
    verificarInicioSesion: vi.fn(),
    reenviarCodigo: vi.fn(),
    obtenerSesion: vi.fn().mockResolvedValue(sesion),
    guardarSesion: vi.fn(),
    renovarSesion: renovar ? vi.fn(renovar) : undefined,
    cerrarSesion: vi.fn(),
    solicitarEliminacionCuenta: vi.fn(),
    confirmarEliminacionCuenta: vi.fn(),
  };
}

const AHORA = new Date('2026-11-26T19:00:00.000Z');
const reloj = () => AHORA;
const sesionPublica = (expiraEn?: string): AuthSession => ({
  usuario: { nombre: 'Persona de prueba', rol: 'USUARIO_PUBLICO' },
  accessToken: 'token-vigente',
  accessTokenExpiraEn: expiraEn,
});

const INTENTO = uuid(9999);
const P1 = uuid(100);
const O1 = uuid(101);

describe('ObtenerActividad (C-03)', () => {
  it.each([2, 3, 4])('acepta preguntas con %i opciones', async (n) => {
    const a = actividad([pregunta(1, n)]);
    const repo = repoMock({ obtenerActividad: vi.fn().mockResolvedValue(a) });
    await expect(new ObtenerActividad(repo).ejecutar('smishing')).resolves.toBe(
      a,
    );
  });

  it.each([1, 10])('acepta actividades de %i preguntas', async (total) => {
    const a = actividad(
      Array.from({ length: total }, (_, i) => pregunta(i + 1, 2)),
    );
    const repo = repoMock({ obtenerActividad: vi.fn().mockResolvedValue(a) });
    const res = await new ObtenerActividad(repo).ejecutar('smishing');
    expect(res.preguntas).toHaveLength(total);
  });

  it.each([
    ['0 preguntas', actividad([])],
    [
      '11 preguntas',
      actividad(Array.from({ length: 11 }, (_, i) => pregunta(i + 1, 2))),
    ],
    ['1 opción', actividad([pregunta(1, 1)])],
    ['5 opciones', actividad([pregunta(1, 5)])],
    [
      'totalPreguntas distinto',
      { ...actividad([pregunta(1, 2)]), totalPreguntas: 3 },
    ],
    ['id no UUID', actividad([{ ...pregunta(1, 2), id: 'A' }])],
    [
      'opción con id A/B/C',
      actividad([
        {
          ...pregunta(1, 2),
          opciones: [
            { id: 'A', texto: 'x' },
            { id: 'B', texto: 'y' },
          ],
        },
      ]),
    ],
    ['preguntas duplicadas', actividad([pregunta(1, 2), pregunta(1, 2)])],
  ])('rechaza contrato inválido: %s', async (_caso, a) => {
    const repo = repoMock({ obtenerActividad: vi.fn().mockResolvedValue(a) });
    await expect(
      new ObtenerActividad(repo).ejecutar('smishing'),
    ).rejects.toBeInstanceOf(RespuestaInesperadaError);
  });

  it('rechaza slug vacío sin llamar al repositorio', async () => {
    const repo = repoMock();
    await expect(
      new ObtenerActividad(repo).ejecutar('  '),
    ).rejects.toBeInstanceOf(RespuestaInvalidaError);
    expect(repo.obtenerActividad).not.toHaveBeenCalled();
  });

  it('propaga errores del repositorio sin sustituirlos por datos simulados', async () => {
    const repo = repoMock({
      obtenerActividad: vi.fn().mockRejectedValue(new Error('caído')),
    });
    await expect(
      new ObtenerActividad(repo).ejecutar('smishing'),
    ).rejects.toThrow('caído');
  });
});

describe('determinarModoPractica', () => {
  it('USUARIO_PUBLICO con token → REGISTRADO', async () => {
    await expect(
      determinarModoPractica(authMock(sesionPublica())),
    ).resolves.toBe('REGISTRADO');
  });

  it.each([
    ['sin sesión', null],
    [
      'personal',
      { usuario: { nombre: 'Monitor', rol: 'PERSONAL' }, accessToken: 't' },
    ],
    [
      'administrador',
      {
        usuario: { nombre: 'Admin', rol: 'ADMINISTRADOR' },
        accessToken: 't',
      },
    ],
    [
      'token vacío',
      { usuario: { nombre: 'X', rol: 'USUARIO_PUBLICO' }, accessToken: '' },
    ],
  ])('%s → INVITADO', async (_caso, sesion) => {
    await expect(
      determinarModoPractica(authMock(sesion as AuthSession | null)),
    ).resolves.toBe('INVITADO');
  });
});

describe('IniciarIntentoAutenticado (C-03)', () => {
  it('inicia con el token del USUARIO_PUBLICO', async () => {
    const repo = repoMock({
      iniciarIntentoAutenticado: vi
        .fn()
        .mockResolvedValue({ id: INTENTO, totalPreguntas: 2 }),
    });
    const uc = new IniciarIntentoAutenticado(
      repo,
      authMock(sesionPublica('2026-11-26T20:00:00.000Z')),
      reloj,
    );

    await expect(uc.ejecutar('smishing')).resolves.toEqual({
      id: INTENTO,
      totalPreguntas: 2,
    });
    expect(repo.iniciarIntentoAutenticado).toHaveBeenCalledWith(
      'smishing',
      'token-vigente',
    );
  });

  it('invitado: nunca llama a POST intentos (no persiste anónimos)', async () => {
    const repo = repoMock();
    const uc = new IniciarIntentoAutenticado(repo, authMock(null), reloj);
    await expect(uc.ejecutar('smishing')).rejects.toBeInstanceOf(
      SesionRequeridaError,
    );
    expect(repo.iniciarIntentoAutenticado).not.toHaveBeenCalled();
  });

  it('personal: no inicia intento de cuenta', async () => {
    const repo = repoMock();
    const uc = new IniciarIntentoAutenticado(
      repo,
      authMock({
        usuario: { nombre: 'Monitor', rol: 'PERSONAL' },
        accessToken: 't',
      }),
      reloj,
    );
    await expect(uc.ejecutar('smishing')).rejects.toBeInstanceOf(
      SesionRequeridaError,
    );
    expect(repo.iniciarIntentoAutenticado).not.toHaveBeenCalled();
  });

  it('token por vencer: renueva una sola vez y usa el nuevo token', async () => {
    const repo = repoMock({
      iniciarIntentoAutenticado: vi
        .fn()
        .mockResolvedValue({ id: INTENTO, totalPreguntas: 2 }),
    });
    const auth = authMock(
      sesionPublica('2026-11-26T19:00:10.000Z'),
      async () => ({ ...sesionPublica(), accessToken: 'token-renovado' }),
    );
    await new IniciarIntentoAutenticado(repo, auth, reloj).ejecutar('smishing');

    expect(auth.renovarSesion).toHaveBeenCalledTimes(1);
    expect(repo.iniciarIntentoAutenticado).toHaveBeenCalledWith(
      'smishing',
      'token-renovado',
    );
  });

  it('si la renovación falla → SesionRequeridaError sin llamar al backend', async () => {
    const repo = repoMock();
    const auth = authMock(sesionPublica('2026-11-26T18:00:00.000Z'), () =>
      Promise.reject(new Error('401')),
    );
    await expect(
      new IniciarIntentoAutenticado(repo, auth, reloj).ejecutar('smishing'),
    ).rejects.toBeInstanceOf(SesionRequeridaError);
    expect(repo.iniciarIntentoAutenticado).not.toHaveBeenCalled();
  });
});

describe('ResponderPreguntaAutenticado (C-03)', () => {
  it('envía la respuesta con el token y devuelve la evaluación', async () => {
    const evaluada = {
      esCorrecta: false,
      opcionCorrecta: { id: O1, texto: 'No abrirlo' },
      explicacion: 'Explicación',
      respondidas: 1,
      totalPreguntas: 2,
      resultado: null,
    };
    const repo = repoMock({
      responderAutenticado: vi.fn().mockResolvedValue(evaluada),
    });
    const uc = new ResponderPreguntaAutenticado(
      repo,
      authMock(sesionPublica()),
      reloj,
    );

    await expect(
      uc.ejecutar({ intentoId: INTENTO, preguntaId: P1, opcionId: O1 }),
    ).resolves.toEqual(evaluada);
    expect(repo.responderAutenticado).toHaveBeenCalledWith(
      INTENTO,
      { preguntaId: P1, opcionId: O1 },
      'token-vigente',
    );
  });

  it.each([
    ['opción A/B/C', { intentoId: INTENTO, preguntaId: P1, opcionId: 'A' }],
    [
      'pregunta inválida',
      { intentoId: INTENTO, preguntaId: 'x', opcionId: O1 },
    ],
  ])('rechaza %s sin llamar al backend', async (_caso, params) => {
    const repo = repoMock();
    const uc = new ResponderPreguntaAutenticado(
      repo,
      authMock(sesionPublica()),
      reloj,
    );
    await expect(uc.ejecutar(params)).rejects.toBeInstanceOf(
      RespuestaInvalidaError,
    );
    expect(repo.responderAutenticado).not.toHaveBeenCalled();
  });

  it('intentoId inválido → IntentoNoEncontradoError', async () => {
    const repo = repoMock();
    const uc = new ResponderPreguntaAutenticado(
      repo,
      authMock(sesionPublica()),
      reloj,
    );
    await expect(
      uc.ejecutar({ intentoId: 'no-uuid', preguntaId: P1, opcionId: O1 }),
    ).rejects.toBeInstanceOf(IntentoNoEncontradoError);
  });

  it('no reintenta cuando el repositorio falla', async () => {
    const repo = repoMock({
      responderAutenticado: vi.fn().mockRejectedValue(new Error('red')),
    });
    const uc = new ResponderPreguntaAutenticado(
      repo,
      authMock(sesionPublica()),
      reloj,
    );
    await expect(
      uc.ejecutar({ intentoId: INTENTO, preguntaId: P1, opcionId: O1 }),
    ).rejects.toThrow('red');
    expect(repo.responderAutenticado).toHaveBeenCalledTimes(1);
  });
});

describe('EvaluarRespuestaInvitado (C-04 PROPUESTO)', () => {
  it('evalúa sin token ni sesión', async () => {
    const feedback = {
      esCorrecta: true,
      opcionCorrecta: { id: O1, texto: 'No abrirlo' },
      explicacion: 'Bien',
    };
    const repo = repoMock({
      evaluarInvitado: vi.fn().mockResolvedValue(feedback),
    });
    await expect(
      new EvaluarRespuestaInvitado(repo).ejecutar({
        slug: 'smishing',
        preguntaId: P1,
        opcionId: O1,
      }),
    ).resolves.toEqual(feedback);
    expect(repo.evaluarInvitado).toHaveBeenCalledWith('smishing', {
      preguntaId: P1,
      opcionId: O1,
    });
    expect(repo.iniciarIntentoAutenticado).not.toHaveBeenCalled();
  });

  it('valida UUID antes de llamar al backend', async () => {
    const repo = repoMock();
    await expect(
      new EvaluarRespuestaInvitado(repo).ejecutar({
        slug: 'smishing',
        preguntaId: P1,
        opcionId: 'B',
      }),
    ).rejects.toBeInstanceOf(RespuestaInvalidaError);
    expect(repo.evaluarInvitado).not.toHaveBeenCalled();
  });
});
