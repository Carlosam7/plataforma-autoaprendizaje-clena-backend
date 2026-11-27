import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TarjetaSolicitudCola } from './TarjetaSolicitudCola';
import { type SolicitudEnCola, textoEspera } from '@/domain/cola/types';

const AHORA = new Date('2026-11-27T15:07:00Z');
const solicitud = (
  cambios: Partial<SolicitudEnCola> = {},
): SolicitudEnCola => ({
  id: 's-1',
  equipo: '12',
  tema: 'SEGURIDAD_DIGITAL',
  estado: 'PENDIENTE',
  guia: { slug: 'smishing', titulo: 'Smishing' },
  paso: 3,
  creadaEn: new Date('2026-11-27T15:00:00Z'),
  atendidaPor: null,
  tomadaEn: null,
  resueltaEn: null,
  comentarioResolucion: null,
  ...cambios,
});
const nada = () => {};

describe('FE-06 · TarjetaSolicitudCola', () => {
  it('una pendiente muestra el equipo, el tema, la guía, la espera y el botón para atender', () => {
    const html = renderToStaticMarkup(
      <TarjetaSolicitudCola
        solicitud={solicitud()}
        ahora={AHORA}
        puesto={1}
        onTomar={nada}
      />,
    );
    expect(html).toContain('>1. Equipo 12</h3>');
    expect(html).toContain('Seguridad digital y mensajes falsos');
    expect(html).toContain('Estaba en «Smishing», paso 3.');
    expect(html).toContain('Espera hace 7 minutos');
    expect(html).toContain('Atender equipo 12');
  });

  it('en atención por otro monitor dice quién la atiende y no deja resolverla', () => {
    const html = renderToStaticMarkup(
      <TarjetaSolicitudCola
        solicitud={solicitud({ estado: 'EN_ATENCION', atendidaPor: 'Luis' })}
        ahora={AHORA}
        onEmpezarResolver={nada}
      />,
    );
    expect(html).toContain('La atiende Luis');
    expect(html).not.toContain('Marcar como resuelta');
  });

  it('al resolver una propia pide el comentario opcional con su etiqueta y límite', () => {
    const html = renderToStaticMarkup(
      <TarjetaSolicitudCola
        solicitud={solicitud({ estado: 'EN_ATENCION', atendidaPor: 'Ana' })}
        ahora={AHORA}
        esMia
        resolviendo
        comentario="Se explicó"
      />,
    );
    expect(html).toMatch(/<label for="[^"]+-comentario"/);
    expect(html).toContain('¿Cómo se resolvió? (opcional)');
    expect(html).toContain('maxLength="500"');
    expect(html).toContain('Confirmar que está resuelta');
  });

  it('no repite «Equipo» si la persona ya lo escribió, y no cambia las mayúsculas del nombre', () => {
    const html = renderToStaticMarkup(
      <TarjetaSolicitudCola
        solicitud={solicitud({ equipo: 'Equipo 7' })}
        ahora={AHORA}
        onTomar={nada}
      />,
    );
    expect(html).toContain('>Equipo 7</h3>');
    expect(html).toContain('Atender equipo 7');
    const otro = renderToStaticMarkup(
      <TarjetaSolicitudCola
        solicitud={solicitud({ equipo: 'QA-1' })}
        ahora={AHORA}
        onTomar={nada}
      />,
    );
    expect(otro).toContain('Atender equipo QA-1');
  });

  it.each([
    [0, 'Acaba de pedir ayuda'],
    [1, 'Espera hace 1 minuto'],
    [59, 'Espera hace 59 minutos'],
    [60, 'Espera hace 1 hora'],
    [150, 'Espera hace 2 horas'],
    [1440, 'Espera hace 1 día'],
    [19834, 'Espera hace 13 días'],
  ])('%i minutos → «%s»', (minutos, texto) => {
    expect(textoEspera(minutos)).toBe(texto);
  });
});
