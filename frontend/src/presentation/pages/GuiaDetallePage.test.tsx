// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CatalogoError } from '../../domain/guias/errors';
import { ProgresoError } from '@/domain/progreso/errors';
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

describe('GuiaDetallePage · avance guardado (HU-23)', () => {
  const detalle2: DetalleGuia = {
    ...detalle,
    totalPasos: 2,
    pasos: [
      {
        numero: 1,
        titulo: 'Paso uno',
        contenido: 'a',
        bloques: [{ tipo: 'texto', texto: 'a' }],
      },
      {
        numero: 2,
        titulo: 'Paso dos',
        contenido: 'b',
        bloques: [{ tipo: 'texto', texto: 'b' }],
      },
    ],
  };
  const progreso = (sobre = {}) => ({
    slug: 'smishing',
    categoria: 'seguridad-digital',
    titulo: 'Smishing',
    nivel: 'BASICO' as const,
    totalPasos: 2,
    pasosLeidos: 1,
    porcentaje: 50,
    estado: 'EN_CURSO' as const,
    completada: false,
    tieneActividad: false,
    actividadAprobada: false,
    ultimoPaso: 1,
    completadaEn: null,
    ...sobre,
  });

  function montar(modo: 'REGISTRADO' | 'INVITADO', ruta = '/guias/smishing') {
    vi.spyOn(container.practica, 'determinarModo').mockResolvedValue(modo);
    vi.spyOn(container.guias.registrarApertura, 'ejecutar').mockResolvedValue();
    return render(
      <StrictMode>
        <MemoryRouter initialEntries={[ruta]}>
          <Routes>
            <Route path="/guias/:slug" element={<GuiaDetallePage />} />
          </Routes>
        </MemoryRouter>
      </StrictMode>,
    );
  }

  beforeEach(() => {
    vi.restoreAllMocks();
    window.scrollTo = vi.fn();
  });
  afterEach(cleanup);

  it('registrado: un solo POST por paso (aun con StrictMode) y muestra el avance devuelto', async () => {
    vi.spyOn(container.guias.obtenerDetalle, 'ejecutar').mockResolvedValue(
      detalle2,
    );
    const lectura = vi
      .spyOn(container.progreso.registrarLectura, 'ejecutar')
      .mockResolvedValue(progreso());
    montar('REGISTRADO');
    expect(await screen.findByText(/Tu avance guardado: 50%/)).toBeTruthy();
    expect(lectura).toHaveBeenCalledTimes(1);
    expect(lectura).toHaveBeenCalledWith('smishing', 1);

    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await screen.findByText('Paso dos');
    expect(lectura).toHaveBeenCalledTimes(2);
    expect(lectura).toHaveBeenLastCalledWith('smishing', 2);
  });

  it('invitado: nunca llama al progreso', async () => {
    vi.spyOn(container.guias.obtenerDetalle, 'ejecutar').mockResolvedValue(
      detalle2,
    );
    const lectura = vi.spyOn(container.progreso.registrarLectura, 'ejecutar');
    montar('INVITADO');
    await screen.findByText('Paso uno');
    await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
    await screen.findByText('Paso dos');
    expect(lectura).not.toHaveBeenCalled();
  });

  it('?paso=2 abre la guía en ese paso (Continuar donde quedé)', async () => {
    vi.spyOn(container.guias.obtenerDetalle, 'ejecutar').mockResolvedValue(
      detalle2,
    );
    const lectura = vi
      .spyOn(container.progreso.registrarLectura, 'ejecutar')
      .mockResolvedValue(progreso({ ultimoPaso: 2 }));
    montar('REGISTRADO', '/guias/smishing?paso=2');
    expect(await screen.findByText('Paso dos')).toBeTruthy();
    expect(lectura).toHaveBeenCalledWith('smishing', 2);
  });

  it('PASO_NO_ENCONTRADO recarga el detalle vigente', async () => {
    const obtener = vi
      .spyOn(container.guias.obtenerDetalle, 'ejecutar')
      .mockResolvedValueOnce(detalle2)
      // el servidor devuelve un detalle nuevo tras la recarga
      .mockImplementation(async () => ({ ...detalle2 }));
    const lectura = vi
      .spyOn(container.progreso.registrarLectura, 'ejecutar')
      .mockRejectedValueOnce(
        new ProgresoError('x', 'PASO_NO_ENCONTRADO', 'PASO_NO_ENCONTRADO', 404),
      )
      .mockResolvedValue(progreso());
    montar('REGISTRADO');
    expect(await screen.findByText(/Tu avance guardado/)).toBeTruthy();
    expect(obtener.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(lectura).toHaveBeenCalledTimes(2); // se reintenta el paso tras recargar
  });

  it('un fallo al guardar avisa pero no bloquea la lectura', async () => {
    vi.spyOn(container.guias.obtenerDetalle, 'ejecutar').mockResolvedValue(
      detalle2,
    );
    vi.spyOn(container.progreso.registrarLectura, 'ejecutar').mockRejectedValue(
      new ProgresoError('red', 'CONEXION'),
    );
    montar('REGISTRADO');
    expect(
      await screen.findByText(/No pudimos guardar tu avance/),
    ).toBeTruthy();
    expect(screen.getByText('Paso uno')).toBeTruthy();
    expect(screen.queryByText(/Tu avance guardado/)).toBeNull();
  });
});
