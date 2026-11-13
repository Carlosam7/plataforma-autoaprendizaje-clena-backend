import { describe, expect, it } from 'vitest';
import { ContenidoPaso } from '../contenido-paso.js';

describe('ContenidoPaso', () => {
  it('lee los tres tipos de bloque en el orden guardado', () => {
    const contenido = ContenidoPaso.desdeJson({
      version: 1,
      bloques: [
        { tipo: 'texto', texto: 'Haz una pausa.' },
        { tipo: 'imagen', imagenId: 'img-1', textoAlternativo: 'Un SMS' },
        { tipo: 'aviso', nivel: 'alerta', texto: 'No abras el enlace.' },
      ],
    });
    expect(contenido.bloques).toEqual([
      { tipo: 'texto', texto: 'Haz una pausa.' },
      { tipo: 'imagen', imagenId: 'img-1', textoAlternativo: 'Un SMS' },
      { tipo: 'aviso', nivel: 'alerta', texto: 'No abras el enlace.' },
    ]);
  });

  it('descarta campos que no son del formato', () => {
    const contenido = ContenidoPaso.desdeJson({
      version: 1,
      bloques: [{ tipo: 'texto', texto: 'Hola', extra: 'x' }],
    });
    expect(contenido.bloques).toEqual([{ tipo: 'texto', texto: 'Hola' }]);
  });

  it.each([
    ['otra versión', { version: 2, bloques: [] }],
    ['sin bloques', { version: 1 }],
    ['un tipo desconocido', { version: 1, bloques: [{ tipo: 'ejemplo' }] }],
    [
      'un nivel de aviso desconocido',
      { version: 1, bloques: [{ tipo: 'aviso', nivel: 'info', texto: 'x' }] },
    ],
    [
      'una imagen sin texto alternativo',
      { version: 1, bloques: [{ tipo: 'imagen', imagenId: 'img-1' }] },
    ],
    [
      'un texto vacío',
      { version: 1, bloques: [{ tipo: 'texto', texto: ' ' }] },
    ],
  ])('rechaza %s', (_caso, json) => {
    expect(() => ContenidoPaso.desdeJson(json)).toThrow();
  });
});
