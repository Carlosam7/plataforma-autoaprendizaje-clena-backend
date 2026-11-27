// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SesionRequeridaError } from '@/domain/practica/errors';
import { ProgresoError } from '@/domain/progreso/errors';
import type { ProgresoGuia, ProgresoPaginado } from '@/domain/progreso/types';
import { container } from '@/main/container';
import { ProgresoPage } from './ProgresoPage';

const guia = (sobre: Partial<ProgresoGuia> = {}): ProgresoGuia => ({
  slug: 'smishing',
  categoria: 'seguridad-digital',
  titulo: 'Smishing',
  nivel: 'BASICO',
  totalPasos: 4,
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

const pagina = (
  datos: ProgresoGuia[],
  total = datos.length,
): ProgresoPaginado => ({
  datos,
  total,
  pagina: 1,
  limite: 20,
});

function montar(modo: 'REGISTRADO' | 'INVITADO') {
  vi.spyOn(container.practica, 'determinarModo').mockResolvedValue(modo);
  vi.spyOn(container.guias.listarCategorias, 'ejecutar').mockResolvedValue([
    { slug: 'seguridad-digital', nombre: 'Seguridad digital' },
    { slug: 'correo-electronico', nombre: 'Correo electrónico' },
  ]);
  return render(
    <MemoryRouter>
      <ProgresoPage />
    </MemoryRouter>,
  );
}

describe('ProgresoPage (HU-23 · C-10)', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(cleanup);

  it('invitado: invitación opcional a registrarse y NUNCA consulta el progreso', async () => {
    const listar = vi.spyOn(container.progreso.listar, 'ejecutar');
    montar('INVITADO');
    expect(
      await screen.findByText('¿Aún no has iniciado sesión?'),
    ).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Crear cuenta gratuita' }),
    ).toBeTruthy();
    expect(listar).not.toHaveBeenCalled();
  });

  it('registrado: muestra porcentaje, barra y la acción según el estado', async () => {
    vi.spyOn(container.progreso.listar, 'ejecutar').mockResolvedValue(
      pagina([
        guia(),
        guia({
          slug: 'nueva',
          titulo: 'Guía nueva',
          estado: 'SIN_EMPEZAR',
          pasosLeidos: 0,
          porcentaje: 0,
          ultimoPaso: null,
        }),
        guia({
          slug: 'lista',
          titulo: 'Guía lista',
          estado: 'COMPLETADA',
          completada: true,
          porcentaje: 100,
          pasosLeidos: 4,
        }),
      ]),
    );
    montar('REGISTRADO');
    expect(await screen.findByText('25%')).toBeTruthy();
    const barra = screen.getByRole('progressbar', {
      name: 'Avance de Smishing',
    });
    expect(barra.getAttribute('aria-valuenow')).toBe('25');

    expect(
      screen
        .getByRole('link', { name: 'Continuar en el paso 2' })
        .getAttribute('href'),
    ).toBe('/guias/smishing?paso=2');
    expect(
      screen.getByRole('link', { name: 'Empezar' }).getAttribute('href'),
    ).toBe('/guias/nueva');
    const lista = within(screen.getByRole('list'));
    expect(lista.getByText(/Completada/)).toBeTruthy();
    expect(lista.getByText('100%')).toBeTruthy();
  });

  it('estado vacío real distinto del error', async () => {
    vi.spyOn(container.progreso.listar, 'ejecutar').mockResolvedValue(
      pagina([]),
    );
    montar('REGISTRADO');
    expect(
      await screen.findByText('Todavía no hay guías publicadas.'),
    ).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('error de red muestra alerta con Reintentar y se recupera', async () => {
    const listar = vi
      .spyOn(container.progreso.listar, 'ejecutar')
      .mockRejectedValueOnce(
        new ProgresoError('No pudimos conectarnos.', 'CONEXION'),
      )
      .mockResolvedValue(pagina([guia()]));
    montar('REGISTRADO');
    expect((await screen.findByRole('alert')).textContent).toContain(
      'No pudimos conectarnos.',
    );
    expect(screen.queryByText('Todavía no hay guías publicadas.')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('25%')).toBeTruthy();
    expect(listar).toHaveBeenCalledTimes(2);
  });

  it('sesión vencida (401 o sin token vigente) pide iniciar sesión de nuevo', async () => {
    vi.spyOn(container.progreso.listar, 'ejecutar').mockRejectedValue(
      new SesionRequeridaError(),
    );
    montar('REGISTRADO');
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Tu sesión terminó',
    );
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeTruthy();
  });

  it('filtrar por categoría consulta al servidor y vuelve a la página 1', async () => {
    const listar = vi
      .spyOn(container.progreso.listar, 'ejecutar')
      .mockResolvedValue(pagina([guia()]));
    montar('REGISTRADO');
    await screen.findByText('25%');
    await userEvent.selectOptions(
      screen.getByLabelText('Categoría'),
      'correo-electronico',
    );
    await screen.findByText('25%');
    expect(listar.mock.calls.at(-1)?.[0]).toMatchObject({
      categoria: 'correo-electronico',
      pagina: 1,
    });
  });

  it('pagina contra el servidor cuando hay más de 20 guías', async () => {
    const listar = vi
      .spyOn(container.progreso.listar, 'ejecutar')
      .mockImplementation(async (c = {}) => ({
        datos: [guia({ slug: `g${c.pagina}`, titulo: `Guía ${c.pagina}` })],
        total: 45,
        pagina: c.pagina ?? 1,
        limite: 20,
      }));
    montar('REGISTRADO');
    expect(await screen.findByText('Guía 1')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(await screen.findByText('Guía 2')).toBeTruthy();
    expect(listar.mock.calls.at(-1)?.[0]).toMatchObject({ pagina: 2 });
  });
});
