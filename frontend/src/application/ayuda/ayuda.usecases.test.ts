import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AyudaNoDisponibleError,
  ConexionAyudaError,
  DatosAyudaInvalidosError,
  SolicitudNoEncontradaError,
} from '@/domain/ayuda/errors';
import type {
  EstadoSolicitud,
  SolicitarAyudaComando,
  SolicitudAyuda,
  SolicitudCreada,
} from '@/domain/ayuda/types';
import { CancelarSolicitudAyuda } from './CancelarSolicitudAyuda';
import type { AyudaRepository } from './ports';
import { SeguimientoSolicitudAyuda } from './SeguimientoSolicitudAyuda';
import { prepararSolicitud, SolicitarAyuda } from './SolicitarAyuda';

const ID = '55555555-5555-4555-8555-555555555555';

function solicitud(
  estado: EstadoSolicitud = 'PENDIENTE',
  posicion: number | null = 2,
): SolicitudAyuda {
  return {
    id: ID,
    equipo: '12',
    tema: 'CORREO',
    estado,
    posicion: estado === 'PENDIENTE' ? posicion : null,
    creadaEn: '2026-11-26T19:00:00.000Z',
  };
}

/** Promesa que el test resuelve cuando quiere, para simular una respuesta lenta. */
function diferida<T>() {
  let resolver!: (valor: T) => void;
  const promesa = new Promise<T>((r) => (resolver = r));
  return { promesa, resolver };
}

function repositorio(
  parcial: Partial<AyudaRepository> = {},
): AyudaRepository & {
  [K in keyof AyudaRepository]: ReturnType<typeof vi.fn>;
} {
  return {
    solicitar: vi.fn(),
    consultar: vi.fn(),
    cancelar: vi.fn(),
    ...parcial,
  } as never;
}

describe('prepararSolicitud (C-05)', () => {
  it('arma el cuerpo exacto con la guía y el paso', () => {
    expect(
      prepararSolicitud({
        equipo: '  Equipo   12 ',
        tema: 'SEGURIDAD_DIGITAL',
        guiaSlug: 'smishing',
        pasoOrden: 2,
      }),
    ).toEqual({
      equipo: 'Equipo 12',
      tema: 'SEGURIDAD_DIGITAL',
      guiaSlug: 'smishing',
      pasoOrden: 2,
    });
  });

  it('sin guía no envía el paso', () => {
    expect(
      prepararSolicitud({ equipo: '12', tema: 'OTRO', pasoOrden: 3 }),
    ).toEqual({ equipo: '12', tema: 'OTRO' });
  });

  it.each([
    ['un slug con mayúsculas', 'Smishing'],
    ['un slug con espacios', 'mi guia'],
    ['un slug de más de 80 letras', 'a'.repeat(81)],
  ])('descarta %s y su paso, sin impedir pedir ayuda', (_, guiaSlug) => {
    expect(
      prepararSolicitud({ equipo: '12', tema: 'OTRO', guiaSlug, pasoOrden: 2 }),
    ).toEqual({ equipo: '12', tema: 'OTRO' });
  });

  it.each([0, -1, 1.5, Number.NaN])(
    'descarta un paso no válido (%s)',
    (paso) => {
      expect(
        prepararSolicitud({
          equipo: '12',
          tema: 'OTRO',
          guiaSlug: 'smishing',
          pasoOrden: paso,
        }),
      ).toEqual({ equipo: '12', tema: 'OTRO', guiaSlug: 'smishing' });
    },
  );

  it.each([
    ['vacío', '   '],
    ['de más de 100 letras', 'x'.repeat(101)],
  ])('rechaza un equipo %s', (_, equipo) => {
    expect(() => prepararSolicitud({ equipo, tema: 'OTRO' })).toThrow(
      expect.objectContaining({ campo: 'equipo' }),
    );
  });

  it('rechaza un tema que no está en la lista', () => {
    expect(() => prepararSolicitud({ equipo: '12', tema: '' })).toThrow(
      DatosAyudaInvalidosError,
    );
    expect(() =>
      prepararSolicitud({ equipo: '12', tema: 'COCINA' as never }),
    ).toThrow(expect.objectContaining({ campo: 'tema' }));
  });
});

describe('SolicitarAyuda', () => {
  it('un doble clic envía un solo POST y ambos reciben la misma solicitud', async () => {
    const respuesta = diferida<SolicitudCreada>();
    const repo = repositorio({ solicitar: vi.fn(() => respuesta.promesa) });
    const caso = new SolicitarAyuda(repo);

    const primera = caso.ejecutar({ equipo: '12', tema: 'CORREO' });
    const segunda = caso.ejecutar({ equipo: '12', tema: 'CORREO' });
    respuesta.resolver({ ...solicitud(), yaExistia: false });

    expect(await primera).toBe(await segunda);
    expect(repo.solicitar).toHaveBeenCalledTimes(1);
  });

  it('cuando termina, se puede volver a pedir (p. ej. tras un error)', async () => {
    const repo = repositorio({
      solicitar: vi
        .fn<(c: SolicitarAyudaComando) => Promise<SolicitudCreada>>()
        .mockRejectedValueOnce(new AyudaNoDisponibleError())
        .mockResolvedValueOnce({ ...solicitud(), yaExistia: true }),
    });
    const caso = new SolicitarAyuda(repo);

    await expect(
      caso.ejecutar({ equipo: '12', tema: 'CORREO' }),
    ).rejects.toBeInstanceOf(AyudaNoDisponibleError);
    expect(await caso.ejecutar({ equipo: '12', tema: 'CORREO' })).toMatchObject(
      { yaExistia: true },
    );
    expect(repo.solicitar).toHaveBeenCalledTimes(2);
  });

  it('con datos inválidos no llama al servidor', async () => {
    const repo = repositorio();
    await expect(
      new SolicitarAyuda(repo).ejecutar({ equipo: '', tema: 'CORREO' }),
    ).rejects.toBeInstanceOf(DatosAyudaInvalidosError);
    expect(repo.solicitar).not.toHaveBeenCalled();
  });
});

describe('CancelarSolicitudAyuda', () => {
  it('un doble clic envía un solo DELETE', async () => {
    const respuesta = diferida<void>();
    const repo = repositorio({ cancelar: vi.fn(() => respuesta.promesa) });
    const caso = new CancelarSolicitudAyuda(repo);

    const a = caso.ejecutar(ID);
    const b = caso.ejecutar(ID);
    respuesta.resolver();
    await Promise.all([a, b]);

    expect(repo.cancelar).toHaveBeenCalledTimes(1);
  });
});

describe('SeguimientoSolicitudAyuda (cada 15 s)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('consulta cada 15 s mientras está activa y para cuando la resuelven', async () => {
    const repo = repositorio({
      consultar: vi
        .fn()
        .mockResolvedValueOnce(solicitud('PENDIENTE', 1))
        .mockResolvedValueOnce(solicitud('EN_ATENCION'))
        .mockResolvedValueOnce(solicitud('RESUELTA')),
    });
    const eventos: unknown[] = [];
    new SeguimientoSolicitudAyuda(repo).iniciar(ID, (e) => eventos.push(e));

    // No consulta de inmediato: la creación ya trajo el estado.
    expect(repo.consultar).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(14_999);
    expect(repo.consultar).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(repo.consultar).toHaveBeenCalledWith(ID);

    await vi.advanceTimersByTimeAsync(15_000 * 5);
    expect(repo.consultar).toHaveBeenCalledTimes(3);
    expect(eventos).toEqual([
      { tipo: 'actualizada', solicitud: solicitud('PENDIENTE', 1) },
      { tipo: 'actualizada', solicitud: solicitud('EN_ATENCION') },
      { tipo: 'actualizada', solicitud: solicitud('RESUELTA') },
    ]);
  });

  it('al detenerlo (salir de la página) no vuelve a consultar ni avisa', async () => {
    const respuesta = diferida<SolicitudAyuda>();
    const repo = repositorio({ consultar: vi.fn(() => respuesta.promesa) });
    const alCambiar = vi.fn();
    const detener = new SeguimientoSolicitudAyuda(repo).iniciar(ID, alCambiar);

    await vi.advanceTimersByTimeAsync(15_000);
    detener();
    respuesta.resolver(solicitud());
    await vi.advanceTimersByTimeAsync(60_000);

    expect(repo.consultar).toHaveBeenCalledTimes(1);
    expect(alCambiar).not.toHaveBeenCalled();
  });

  it('nunca hay dos consultas a la vez aunque una tarde más de 15 s', async () => {
    const lenta = diferida<SolicitudAyuda>();
    const repo = repositorio({ consultar: vi.fn(() => lenta.promesa) });
    new SeguimientoSolicitudAyuda(repo).iniciar(ID, () => {});

    await vi.advanceTimersByTimeAsync(15_000 * 4);
    expect(repo.consultar).toHaveBeenCalledTimes(1);
  });

  it('un error de red avisa y se reintenta en el siguiente ciclo', async () => {
    const repo = repositorio({
      consultar: vi
        .fn()
        .mockRejectedValueOnce(new ConexionAyudaError(false))
        .mockResolvedValueOnce(solicitud('CANCELADA')),
    });
    const eventos: { tipo: string }[] = [];
    new SeguimientoSolicitudAyuda(repo).iniciar(ID, (e) => eventos.push(e));

    await vi.advanceTimersByTimeAsync(30_000);
    expect(eventos.map((e) => e.tipo)).toEqual([
      'error-temporal',
      'actualizada',
    ]);
  });

  it('un 404 (ya no es de este navegador) termina el seguimiento', async () => {
    const repo = repositorio({
      consultar: vi.fn().mockRejectedValue(new SolicitudNoEncontradaError()),
    });
    const eventos: { tipo: string }[] = [];
    new SeguimientoSolicitudAyuda(repo).iniciar(ID, (e) => eventos.push(e));

    await vi.advanceTimersByTimeAsync(15_000 * 4);
    expect(repo.consultar).toHaveBeenCalledTimes(1);
    expect(eventos.map((e) => e.tipo)).toEqual(['perdida']);
  });
});
