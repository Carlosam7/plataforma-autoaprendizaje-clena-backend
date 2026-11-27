// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CatalogoError } from '../../domain/guias/errors';
import { container } from '../../main/container';
import { GuiasPage } from './GuiasPage';

const categoria = {
  slug: 'seguridad-digital',
  nombre: 'Seguridad digital',
  icono: 'shield',
  numero: '01 / CATEGORÍA',
  descripcion: 'Descripción real.',
};

function renderizar() {
  return render(
    <MemoryRouter>
      <GuiasPage />
    </MemoryRouter>,
  );
}

describe('GuiasPage', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(cleanup);

  it('muestra cargando y luego las guías reales', async () => {
    vi.spyOn(container.guias.listarCategorias, 'ejecutar').mockResolvedValue([
      categoria,
    ]);
    vi.spyOn(container.guias.listar, 'ejecutar').mockResolvedValue([
      {
        slug: 'smishing',
        numero: '01',
        titulo: 'Smishing',
        duracionEstimadaMinutos: 8,
        nivel: 'Básico',
        estado: 'PUBLICADA',
        categoriaSlug: 'seguridad-digital',
        objetivo: 'Reconocer SMS falsos',
      },
    ]);
    renderizar();
    expect(screen.getByText(/Cargando guías/)).toBeTruthy();
    expect(await screen.findByText('Smishing')).toBeTruthy();
  });

  it('colección vacía real muestra el mensaje de vacío, no un error', async () => {
    vi.spyOn(container.guias.listarCategorias, 'ejecutar').mockResolvedValue([
      categoria,
    ]);
    vi.spyOn(container.guias.listar, 'ejecutar').mockResolvedValue([]);
    renderizar();
    expect(
      await screen.findByText('Pronto habrá guías en esta sección'),
    ).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('backend caído muestra error con reintento y nunca "Pronto habrá guías"', async () => {
    const error = new CatalogoError('No pudimos conectarnos.', 'CONEXION');
    const cats = vi
      .spyOn(container.guias.listarCategorias, 'ejecutar')
      .mockRejectedValueOnce(error)
      .mockResolvedValue([categoria]);
    const guias = vi
      .spyOn(container.guias.listar, 'ejecutar')
      .mockRejectedValueOnce(error)
      .mockResolvedValue([]);
    renderizar();

    expect((await screen.findByRole('alert')).textContent).toContain(
      'No pudimos conectarnos.',
    );
    expect(screen.queryByText('Pronto habrá guías en esta sección')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(
      await screen.findByText('Pronto habrá guías en esta sección'),
    ).toBeTruthy();
    await waitFor(() => expect(cats).toHaveBeenCalledTimes(2));
    expect(guias).toHaveBeenCalledTimes(2);
  });
});
