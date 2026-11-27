// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ActividadNoEncontradaError,
  ConexionPracticaError,
} from '@/domain/practica/errors';
import { container } from '../../main/container';
import { GuiaPracticaPage } from './GuiaPracticaPage';

function renderizar() {
  return render(
    <MemoryRouter initialEntries={['/guias/smishing/practica']}>
      <Routes>
        <Route path="/guias/:slug/practica" element={<GuiaPracticaPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('GuiaPracticaPage', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(cleanup);

  it('error de conexión muestra alerta con reintento, no "sin práctica"', async () => {
    const obtener = vi
      .spyOn(container.practica.obtenerActividad, 'ejecutar')
      .mockRejectedValueOnce(new ConexionPracticaError(false, 'Sin conexión.'))
      .mockRejectedValueOnce(new ActividadNoEncontradaError());
    renderizar();
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Sin conexión.',
    );
    expect(screen.queryByText(/no tiene práctica disponible/)).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(
      await screen.findByText(/no tiene práctica disponible aún/),
    ).toBeTruthy();
    expect(obtener).toHaveBeenCalledTimes(2);
  });

  it('abrir la práctica no registra apertura de guía', async () => {
    vi.spyOn(container.practica.obtenerActividad, 'ejecutar').mockRejectedValue(
      new ActividadNoEncontradaError(),
    );
    const apertura = vi.spyOn(container.guias.registrarApertura, 'ejecutar');
    renderizar();
    await screen.findByText(/no tiene práctica disponible aún/);
    expect(apertura).not.toHaveBeenCalled();
  });
});
