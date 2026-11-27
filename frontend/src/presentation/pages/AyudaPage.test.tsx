import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { SolicitudAyuda } from '@/domain/ayuda/types';
import {
  EstadoSolicitudAyuda,
  type EstadoSolicitudAyudaProps,
} from '@/presentation/ayuda/EstadoSolicitudAyuda';
import { contextoDeAyuda, rutaAyuda } from '@/presentation/ayuda/rutaAyuda';
import { AyudaPage } from './AyudaPage';

function renderizarPagina(url = '/ayuda') {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/ayuda" element={<AyudaPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

const nada = () => {};

function renderizarEstado(
  cambios: Partial<SolicitudAyuda> = {},
  props: Partial<EstadoSolicitudAyudaProps> = {},
) {
  return renderToStaticMarkup(
    <EstadoSolicitudAyuda
      solicitud={{
        id: '55555555-5555-4555-8555-555555555555',
        equipo: '12',
        tema: 'SEGURIDAD_DIGITAL',
        estado: 'PENDIENTE',
        posicion: 2,
        creadaEn: '2026-11-26T19:05:00.000Z',
        ...cambios,
      }}
      yaExistia={false}
      aviso={null}
      confirmandoCancelacion={false}
      cancelando={false}
      onPedirCancelacion={nada}
      onConfirmarCancelacion={nada}
      onSeguirEsperando={nada}
      onPedirOtraVez={nada}
      {...props}
    />,
  );
}

describe('AyudaPage (FE-04, HU-28/29)', () => {
  it('muestra el formulario real de «Llamar a un monitor», sin preguntas frecuentes', () => {
    const html = renderizarPagina();

    expect(html).toContain('Llamar a un monitor');
    expect(html).toContain('<label for="equipo"');
    expect(html).toContain('¿En qué equipo estás?');
    expect(html).toContain('aria-describedby="ayuda-equipo"');
    expect(html).toContain('maxLength="100"');
    expect(html).toContain('<legend');
    expect(html).toContain('¿Sobre qué necesitas ayuda?');
    expect(html.match(/type="radio"/g)).toHaveLength(8);
    expect(html).toContain('type="submit"');
    expect(html).not.toMatch(/preguntas frecuentes|glosario/i);
    expect(html).toContain('href="/"');
  });

  it('desde una guía avisa que el monitor sabrá la guía y el paso', () => {
    const html = renderizarPagina('/ayuda?guia=smishing&paso=2');
    expect(html).toContain('en qué guía y en qué paso estabas');
    expect(html).toContain('Volver a la guía');
    expect(html).toContain('href="/guias/smishing"');
  });

  it('con una guía no válida en la URL no promete contexto', () => {
    const html = renderizarPagina('/ayuda?guia=No%20Valida&paso=2');
    expect(html).not.toContain('Le contaremos al monitor');
    expect(html).toContain('Regresar al inicio');
  });
});

describe('rutaAyuda / contextoDeAyuda', () => {
  it('lleva la guía y el paso en la URL, y los lee de vuelta', () => {
    expect(rutaAyuda()).toBe('/ayuda');
    expect(rutaAyuda('smishing')).toBe('/ayuda?guia=smishing');
    expect(rutaAyuda('smishing', 3)).toBe('/ayuda?guia=smishing&paso=3');
    expect(
      contextoDeAyuda(new URLSearchParams('guia=smishing&paso=3')),
    ).toEqual({ guiaSlug: 'smishing', pasoOrden: 3 });
  });

  it('descarta el paso sin guía y los valores no válidos', () => {
    expect(contextoDeAyuda(new URLSearchParams('paso=3'))).toEqual({
      guiaSlug: null,
      pasoOrden: null,
    });
    expect(
      contextoDeAyuda(new URLSearchParams('guia=smishing&paso=0')),
    ).toEqual({ guiaSlug: 'smishing', pasoOrden: null });
  });
});

describe('EstadoSolicitudAyuda', () => {
  it('pendiente: mensaje, puesto en la fila, datos y opción de cancelar', () => {
    const html = renderizarEstado();
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('Un monitor vendrá pronto');
    expect(html).toContain('Tu lugar en la fila: 2');
    expect(html).toContain('Seguridad digital y mensajes falsos');
    expect(html).toContain('2:05');
    expect(html).toContain('Ya no necesito ayuda');
    expect(html).not.toContain('55555555');
  });

  it('si ya la había pedido desde este computador lo dice', () => {
    expect(renderizarEstado({}, { yaExistia: true })).toContain(
      'Ya habías pedido ayuda desde este computador',
    );
  });

  it('confirma antes de cancelar y bloquea el botón mientras cancela', () => {
    const html = renderizarEstado(
      {},
      { confirmandoCancelacion: true, cancelando: true },
    );
    expect(html).toContain('¿Ya resolviste tu duda?');
    expect(html).toContain('Cancelando…');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Cancelando…/);
    expect(html).not.toContain('Ya no necesito ayuda');
  });

  it('en atención: un monitor viene, sin puesto ni botón de cancelar', () => {
    const html = renderizarEstado({ estado: 'EN_ATENCION', posicion: null });
    expect(html).toContain('Un monitor ya viene a tu puesto');
    expect(html).not.toContain('Tu lugar en la fila');
    expect(html).not.toContain('Ya no necesito ayuda');
  });

  it.each([
    ['RESUELTA', 'Tu solicitud fue atendida'],
    ['CANCELADA', 'Cancelaste tu solicitud'],
  ] as const)('%s: permite pedir ayuda otra vez', (estado, titulo) => {
    const html = renderizarEstado({ estado, posicion: null });
    expect(html).toContain(titulo);
    expect(html).toContain('Pedir ayuda otra vez');
    expect(html).not.toContain('Ya no necesito ayuda');
  });

  it('muestra el aviso cuando no se pudo actualizar', () => {
    expect(
      renderizarEstado({}, { aviso: 'No pudimos actualizar el estado.' }),
    ).toContain('No pudimos actualizar el estado.');
  });
});
