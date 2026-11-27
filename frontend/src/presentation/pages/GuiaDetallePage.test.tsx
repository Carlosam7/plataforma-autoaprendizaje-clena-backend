// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CatalogoError } from '../../domain/guias/errors';
import type { DetalleGuia } from '../../domain/guias/types';
import { container } from '../../main/container';
import { GuiaDetallePage } from './GuiaDetallePage';

const detalle: DetalleGuia = {
  guia: {
    slug: 'smishing',
    numero: '',
    titulo: 'Smishing',
    subtitulo: 'Reconoce SMS falsos',
    descripcion: 'Reconoce SMS falsos',
    duracionEstimadaMinutos: 8,
    nivel: 'Básico',
    estado: 'PUBLICADA',
    categoriaSlug: 'seguridad-digital',
    objetivo: 'Reconoce SMS falsos',
  },
  totalPasos: 1,
  tieneActividad: false,
  pasos: [
    {
      numero: 1,
      titulo: 'Haz una pausa',
      contenido: 'Respira.',
      bloques: [{ tipo: 'texto', texto: 'Respira.' }],
    },
  ],
  preguntas: [],
};

function renderizar(strict = true) {
  const arbol = (
    <MemoryRouter initialEntries={['/guias/smishing']}>
      <Routes>
        <Route path="/guias/:slug" element={<GuiaDetallePage />} />
      </Routes>
    </MemoryRouter>
  );
  return render(strict ? <StrictMode>{arbol}</StrictMode> : arbol);
}

describe('GuiaDetallePage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.scrollTo = vi.fn();
  });
  afterEach(cleanup);

  it('muestra la guía real y registra UNA apertura aun con StrictMode', async () => {
    vi.spyOn(container.guias.obtenerDetalle, 'ejecutar').mockResolvedValue(
      detalle,
    );
    const apertura = vi
      .spyOn(container.guias.registrarApertura, 'ejecutar')
      .mockResolvedValue();
    renderizar();
    expect(await screen.findByText('Haz una pausa')).toBeTruthy();
    expect(apertura).toHaveBeenCalledTimes(1);
    expect(apertura).toHaveBeenCalledWith('smishing');
  });

  it('un fallo de telemetría no bloquea la lectura', async () => {
    vi.spyOn(container.guias.obtenerDetalle, 'ejecutar').mockResolvedValue(
      detalle,
    );
    vi.spyOn(
      container.guias.guiasRepository,
      'registrarAperturaGuia',
    ).mockRejectedValue(new Error('500'));
    renderizar();
    expect(await screen.findByText('Haz una pausa')).toBeTruthy();
    expect(screen.queryByText('No pudimos cargar la guía')).toBeNull();
  });

  it('404 muestra "Guía no encontrada" y no registra apertura', async () => {
    vi.spyOn(container.guias.obtenerDetalle, 'ejecutar').mockResolvedValue(
      null,
    );
    const apertura = vi
      .spyOn(container.guias.registrarApertura, 'ejecutar')
      .mockResolvedValue();
    renderizar();
    expect(await screen.findByText('Guía no encontrada')).toBeTruthy();
    expect(apertura).not.toHaveBeenCalled();
  });

  it('error del servidor muestra alerta y reintento que recupera la guía', async () => {
    const obtener = vi
      .spyOn(container.guias.obtenerDetalle, 'ejecutar')
      .mockRejectedValueOnce(
        new CatalogoError('El servidor no pudo atender.', 'SERVIDOR', 503),
      )
      .mockResolvedValue(detalle);
    vi.spyOn(container.guias.registrarApertura, 'ejecutar').mockResolvedValue();
    renderizar(false);

    expect((await screen.findByRole('alert')).textContent).toContain(
      'El servidor no pudo atender.',
    );
    expect(screen.queryByText('Guía no encontrada')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Haz una pausa')).toBeTruthy();
    expect(obtener).toHaveBeenCalledTimes(2);
  });
});
