import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EditorPasos } from './EditorPasos';
import type { PasoGuia } from '@/domain/gestion/types';

const nada = () => {};
const PASOS: PasoGuia[] = [
  {
    id: 'p-1',
    titulo: 'Revisa el mensaje',
    bloques: [
      { tipo: 'texto', texto: 'Mira el remitente.' },
      { tipo: 'aviso', nivel: 'alerta', texto: 'No abras enlaces.' },
    ],
  },
  {
    id: 'p-2',
    titulo: null,
    bloques: [
      {
        tipo: 'imagen',
        imagenId: 'img-1',
        textoAlternativo: 'Mensaje falso',
        url: '/api/v1/archivos/x.png',
      },
    ],
  },
];

describe('FE-05 · EditorPasos', () => {
  const html = renderToStaticMarkup(
    <EditorPasos
      pasos={PASOS}
      onChange={nada}
      errores={{ 'paso-2': ['El paso 2: describe cada imagen.'] }}
    />,
  );

  it('cada paso es un grupo con su número y sus campos con etiqueta', () => {
    expect(html).toContain('<legend');
    expect(html).toContain('>Paso 1</legend>');
    expect(html).toContain('<label for="paso-1-titulo"');
    expect(html).toContain('<label for="paso-1-bloque-1-texto"');
    expect(html).toContain('<label for="paso-1-bloque-2-nivel"');
    expect(html).toContain(
      '<option value="alerta" selected="">Alerta</option>',
    );
  });

  it('las imágenes se ven con su texto alternativo, que se puede editar', () => {
    expect(html).toContain('src="/api/v1/archivos/x.png" alt="Mensaje falso"');
    expect(html).toContain('<label for="paso-2-bloque-1-alt"');
  });

  it('los botones dicen sobre qué paso o bloque actúan, y no se puede subir el primero', () => {
    expect(html).toContain('aria-label="Mover el paso 1 antes"');
    expect(html).toMatch(
      /disabled="" class="[^"]*" aria-label="Mover el paso 1 antes"/,
    );
    expect(html).toContain('aria-label="Quitar el paso 2"');
    expect(html).toContain('aria-label="Agregar un texto al paso 1"');
  });

  it('los errores de un paso se muestran dentro de él y lo describen', () => {
    expect(html).toContain('aria-describedby="errores-paso-2"');
    expect(html).toContain('El paso 2: describe cada imagen.');
  });
});
