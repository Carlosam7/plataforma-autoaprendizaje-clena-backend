// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EstadisticaError } from '@/domain/estadistica/errors';
import type { ResumenEstadisticas } from '@/domain/estadistica/types';
import type { SesionPersonal } from '@/domain/personal/types';
import { container } from '@/main/container';
import { EstadisticasPage } from './EstadisticasPage';

const resumen = (
  sobre: Partial<ResumenEstadisticas> = {},
): ResumenEstadisticas => ({
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
const sesion = (debe = false): SesionPersonal => ({
  usuario: {
    id: 'u',
    nombre: 'Ana',
    rol: 'PERSONAL',
    debeCambiarPassword: debe,
  },
  accessToken: 'tok',
});

function montar(s: SesionPersonal | null = sesion()) {
  vi.spyOn(container.personal.obtenerSesion, 'ejecutar').mockResolvedValue(s);
  return render(
    <MemoryRouter>
      <EstadisticasPage />
    </MemoryRouter>,
  );
}

describe('EstadisticasPage (HU-31 · C-11)', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(cleanup);

  it('sin sesión no consulta la API', async () => {
    const ver = vi.spyOn(container.estadistica.resumen, 'ejecutar');
    montar(null);
    expect(await screen.findByText('Necesitas ingresar')).toBeTruthy();
    expect(ver).not.toHaveBeenCalled();
  });

  it('con contraseña inicial pendiente no consulta', async () => {
    const ver = vi.spyOn(container.estadistica.resumen, 'ejecutar');
    montar(sesion(true));
    expect(await screen.findByText(/cambia tu contraseña/i)).toBeTruthy();
    expect(ver).not.toHaveBeenCalled();
  });

  it('primera consulta sin fechas (servidor: últimos 7 días) y los campos muestran el periodo devuelto', async () => {
    const ver = vi
      .spyOn(container.estadistica.resumen, 'ejecutar')
      .mockResolvedValue(resumen());
    montar();
    expect(
      await screen.findByText('Periodo: 2026-11-20 a 2026-11-26'),
    ).toBeTruthy();
    expect(ver).toHaveBeenCalledWith('tok', {});
    expect((screen.getByLabelText('Desde') as HTMLInputElement).value).toBe(
      '2026-11-20',
    );
    expect((screen.getByLabelText('Hasta') as HTMLInputElement).value).toBe(
      '2026-11-26',
    );
  });

  it('muestra totales y tablas accesibles con las cifras en texto y el orden del servidor', async () => {
    vi.spyOn(container.estadistica.resumen, 'ejecutar').mockResolvedValue(
      resumen(),
    );
    montar();
    await screen.findByText('Periodo: 2026-11-20 a 2026-11-26');
    expect(screen.getByText('35', { selector: 'dd' })).toBeTruthy();
    expect(screen.getByText('6', { selector: 'dd' })).toBeTruthy();

    const top = screen.getByRole('table', {
      name: 'Guías más consultadas (hasta 10)',
    });
    const filas = within(top).getAllByRole('row').slice(1);
    expect(
      filas.map((f) => within(f).getByRole('rowheader').textContent),
    ).toEqual(['Smishing', 'Vishing']);
    expect(within(filas[0]).getByText('20')).toBeTruthy();

    const temas = screen.getByRole('table', {
      name: 'Solicitudes de ayuda por tema',
    });
    expect(
      within(temas).getByText('Seguridad digital y mensajes falsos'),
    ).toBeTruthy();
    expect(
      screen.getByRole('table', { name: 'Consultas por categoría' }),
    ).toBeTruthy();
  });

  it('hayDatos=false muestra «no hubo» con estado vacío real, sin alerta ni tablas', async () => {
    vi.spyOn(container.estadistica.resumen, 'ejecutar').mockResolvedValue(
      resumen({
        totales: { consultasGuias: 0, solicitudesAyuda: 0 },
        topGuias: [],
        consultasPorCategoria: [],
        solicitudesPorTema: [],
        hayDatos: false,
      }),
    );
    montar();
    expect(
      await screen.findByText(/No hubo consultas ni solicitudes/),
    ).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('una sección sin filas (p. ej. sin solicitudes) lo dice sin ocultar las demás', async () => {
    vi.spyOn(container.estadistica.resumen, 'ejecutar').mockResolvedValue(
      resumen({
        solicitudesPorTema: [],
        totales: { consultasGuias: 35, solicitudesAyuda: 0 },
      }),
    );
    montar();
    expect(
      await screen.findByText('No hubo solicitudes de ayuda en este periodo.'),
    ).toBeTruthy();
    expect(
      screen.getByRole('table', { name: 'Guías más consultadas (hasta 10)' }),
    ).toBeTruthy();
  });

  it('error muestra alerta con Reintentar, sin ceros inventados, y se recupera', async () => {
    const ver = vi
      .spyOn(container.estadistica.resumen, 'ejecutar')
      .mockRejectedValueOnce(
        new EstadisticaError('No pudimos conectarnos.', 'CONEXION'),
      )
      .mockResolvedValue(resumen());
    montar();
    expect((await screen.findByRole('alert')).textContent).toContain(
      'No pudimos conectarnos.',
    );
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByText('0', { selector: 'dd' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(
      await screen.findByText('Periodo: 2026-11-20 a 2026-11-26'),
    ).toBeTruthy();
    expect(ver).toHaveBeenCalledTimes(2);
  });

  it('401 pide ingresar de nuevo y 403 se informa como error', async () => {
    vi.spyOn(container.estadistica.resumen, 'ejecutar').mockRejectedValue(
      new EstadisticaError('x', 'SESION', undefined, 401),
    );
    montar();
    expect(await screen.findByText('Tu sesión terminó')).toBeTruthy();
    cleanup();
    vi.restoreAllMocks();
    vi.spyOn(container.estadistica.resumen, 'ejecutar').mockRejectedValue(
      new EstadisticaError('No tienes permiso.', 'PERMISO', undefined, 403),
    );
    montar();
    expect((await screen.findByRole('alert')).textContent).toContain(
      'No tienes permiso.',
    );
  });

  it('periodo inválido: avisa en pantalla y no consulta al servidor', async () => {
    const ver = vi
      .spyOn(container.estadistica.resumen, 'ejecutar')
      .mockResolvedValue(resumen());
    montar();
    await screen.findByText('Periodo: 2026-11-20 a 2026-11-26');
    ver.mockClear();
    const desde = screen.getByLabelText('Desde');
    await userEvent.clear(desde);
    await userEvent.type(desde, '2026-11-30');
    await userEvent.click(screen.getByRole('button', { name: 'Consultar' }));
    expect((await screen.findByRole('alert')).textContent).toContain(
      'posterior',
    );
    expect(ver).not.toHaveBeenCalled();
  });

  it('periodo válido consulta con esas fechas; «Últimos 7 días» vuelve al valor por defecto', async () => {
    const ver = vi
      .spyOn(container.estadistica.resumen, 'ejecutar')
      .mockResolvedValue(resumen());
    montar();
    await screen.findByText('Periodo: 2026-11-20 a 2026-11-26');
    const desde = screen.getByLabelText('Desde');
    await userEvent.clear(desde);
    await userEvent.type(desde, '2026-11-01');
    await userEvent.click(screen.getByRole('button', { name: 'Consultar' }));
    await screen.findByText('Periodo: 2026-11-20 a 2026-11-26');
    expect(ver.mock.calls.at(-1)?.[1]).toEqual({
      desde: '2026-11-01',
      hasta: '2026-11-26',
    });

    await userEvent.click(
      screen.getByRole('button', { name: 'Últimos 7 días' }),
    );
    await screen.findByText('Periodo: 2026-11-20 a 2026-11-26');
    expect(ver.mock.calls.at(-1)?.[1]).toEqual({});
  });

  it('el 400 del servidor se muestra y los campos siguen editables', async () => {
    vi.spyOn(container.estadistica.resumen, 'ejecutar').mockRejectedValue(
      new EstadisticaError(
        'Máximo 366 días.',
        'PERIODO_INVALIDO',
        'RANGO_FECHAS_INVALIDO',
        400,
      ),
    );
    montar();
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Máximo 366 días.',
    );
    expect((screen.getByLabelText('Desde') as HTMLInputElement).disabled).toBe(
      false,
    );
  });
});
