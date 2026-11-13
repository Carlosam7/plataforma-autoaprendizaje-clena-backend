import { describe, expect, it } from 'vitest';
import { DatoInvalidoError } from '../../shared/error-de-negocio.js';
import { ContenidoPaso } from '../contenido-paso.js';
import { GuiaNoPublicadaError, GuiaSinPasosError } from '../errores.js';
import { DatosGuia, GuiaEditable, PasoEntrada } from '../guia-editable.js';
import { slugDesdeTitulo } from '../slug.js';

const AHORA = new Date('2026-11-13T15:00:00.000Z');
const IMAGEN = '0b0e4d4e-6f0a-4c1d-9a51-3a2f6f0c1a11';

const DATOS: DatosGuia = {
  titulo: 'Enviar un correo',
  objetivo: 'Al terminar sabrás enviar un correo.',
  descripcion: null,
  categoriaSlug: 'correo-electronico',
  nivel: 'BASICO',
  duracionEstimadaMin: 10,
  palabrasClave: ['email', 'gmail'],
};

const paso = (texto: string, id?: string): PasoEntrada => ({
  id,
  bloques: [{ tipo: 'texto', texto }],
});

/** Ids «paso-1», «paso-2»… para los pasos nuevos. */
function generador() {
  let n = 0;
  return () => `paso-${(n += 1)}`;
}

function nueva(datos: Partial<DatosGuia> = {}): GuiaEditable {
  return GuiaEditable.crear({
    id: 'g1',
    slug: 'enviar-un-correo',
    datos: { ...DATOS, ...datos },
    actorId: 'ana',
  });
}

function conPasos(...textos: string[]): GuiaEditable {
  const guia = nueva();
  guia.reemplazarPasos(
    textos.map((t) => paso(t)),
    generador(),
    'ana',
  );
  return guia;
}

const textos = (guia: GuiaEditable) =>
  guia.pasos.map((p) => {
    const [bloque] = p.contenido.bloques;
    return bloque.tipo === 'imagen' ? bloque.imagenId : bloque.texto;
  });

describe('GuiaEditable', () => {
  describe('crear', () => {
    it('nace en borrador, sin pasos, y guarda quién la creó', () => {
      const guia = nueva();
      expect(guia).toMatchObject({
        estado: 'BORRADOR',
        publicadaEn: null,
        creadaPorId: 'ana',
        actualizadaPorId: 'ana',
        pasos: [],
      });
      expect(guia.datos).toEqual(DATOS);
    });

    it('limpia espacios y quita palabras clave vacías o repetidas', () => {
      const guia = nueva({
        titulo: '  Enviar un correo ',
        descripcion: '   ',
        palabrasClave: [' email ', 'Email', '', 'gmail'],
      });
      expect(guia.datos).toMatchObject({
        titulo: 'Enviar un correo',
        descripcion: null,
        palabrasClave: ['Email', 'gmail'],
      });
    });

    it.each<[string, Partial<DatosGuia>]>([
      ['titulo', { titulo: '   ' }],
      ['titulo', { titulo: 'x'.repeat(151) }],
      ['objetivo', { objetivo: '' }],
      ['duracionEstimadaMin', { duracionEstimadaMin: 0 }],
      ['duracionEstimadaMin', { duracionEstimadaMin: 2.5 }],
      ['palabrasClave', { palabrasClave: ['x'.repeat(41)] }],
    ])('rechaza un valor inválido en %s', (campo, datos) => {
      try {
        nueva(datos);
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(DatoInvalidoError);
        expect((error as DatoInvalidoError).campo).toBe(campo);
      }
    });
  });

  it('editar cambia los datos y quién la editó, pero no el slug ni quién la creó', () => {
    const guia = nueva();
    guia.editar({ ...DATOS, titulo: 'Mandar un correo' }, 'luis');
    expect(guia).toMatchObject({
      slug: 'enviar-un-correo',
      creadaPorId: 'ana',
      actualizadaPorId: 'luis',
    });
    expect(guia.datos.titulo).toBe('Mandar un correo');
  });

  describe('reemplazarPasos', () => {
    it('agrega pasos nuevos en el orden en que llegan', () => {
      const guia = conPasos('Abre el correo', 'Escribe el mensaje');
      expect(guia.pasos.map((p) => p.id)).toEqual(['paso-1', 'paso-2']);
      expect(textos(guia)).toEqual(['Abre el correo', 'Escribe el mensaje']);
    });

    it('reordena, edita, agrega y quita conservando el id de los que ya existían', () => {
      const guia = conPasos('Uno', 'Dos', 'Tres');
      guia.reemplazarPasos(
        [paso('Tres', 'paso-3'), paso('Nuevo'), paso('Uno editado', 'paso-1')],
        () => 'paso-nuevo',
        'luis',
      );
      expect(guia.pasos.map((p) => p.id)).toEqual([
        'paso-3',
        'paso-nuevo',
        'paso-1',
      ]);
      expect(textos(guia)).toEqual(['Tres', 'Nuevo', 'Uno editado']);
      expect(guia.actualizadaPorId).toBe('luis');
    });

    it('guarda el título del paso, o null si viene vacío', () => {
      const guia = nueva();
      guia.reemplazarPasos(
        [
          { ...paso('Uno'), titulo: ' Haz una pausa ' },
          { ...paso('Dos'), titulo: '  ' },
        ],
        generador(),
        'ana',
      );
      expect(guia.pasos.map((p) => p.titulo)).toEqual(['Haz una pausa', null]);
    });

    it.each([
      ['un id que no es de la guía', [paso('Uno', 'de-otra-guia')]],
      ['el mismo id dos veces', [paso('Uno', 'paso-1'), paso('Uno', 'paso-1')]],
      ['un paso sin bloques', [{ bloques: [] }]],
      ['un bloque sin texto', [{ bloques: [{ tipo: 'texto', texto: ' ' }] }]],
      ['un tipo de bloque desconocido', [{ bloques: [{ tipo: 'video' }] }]],
      [
        'una imagen con un id mal escrito',
        [
          {
            bloques: [{ tipo: 'imagen', imagenId: 'x', textoAlternativo: 'a' }],
          },
        ],
      ],
    ])('rechaza %s', (_, entradas) => {
      const guia = conPasos('Uno');
      expect(() =>
        guia.reemplazarPasos(entradas as PasoEntrada[], generador(), 'ana'),
      ).toThrow(DatoInvalidoError);
      expect(textos(guia)).toEqual(['Uno']);
    });

    it('una guía publicada no puede quedarse sin pasos; un borrador sí', () => {
      const borrador = conPasos('Uno');
      borrador.reemplazarPasos([], generador(), 'ana');
      expect(borrador.pasos).toEqual([]);

      const publicada = conPasos('Uno');
      publicada.publicar(AHORA, 'ana');
      expect(() => publicada.reemplazarPasos([], generador(), 'ana')).toThrow(
        GuiaSinPasosError,
      );
    });

    it('junta los ids de las imágenes que usan los pasos', () => {
      const guia = nueva();
      guia.reemplazarPasos(
        [
          paso('Uno'),
          {
            bloques: [
              { tipo: 'imagen', imagenId: IMAGEN, textoAlternativo: 'Un SMS' },
            ],
          },
        ],
        generador(),
        'ana',
      );
      expect(guia.imagenIds).toEqual([IMAGEN]);
    });
  });

  describe('publicar y ocultar', () => {
    it('una guía sin pasos no se puede publicar', () => {
      expect(() => nueva().publicar(AHORA, 'ana')).toThrow(GuiaSinPasosError);
    });

    it('con al menos un paso se publica y guarda la fecha', () => {
      const guia = conPasos('Uno');
      guia.publicar(AHORA, 'luis');
      expect(guia).toMatchObject({
        estado: 'PUBLICADA',
        publicadaEn: AHORA,
        actualizadaPorId: 'luis',
      });
    });

    it('se oculta y se vuelve a publicar conservando la fecha de la primera publicación', () => {
      const guia = conPasos('Uno');
      guia.publicar(AHORA, 'ana');
      guia.ocultar('ana');
      expect(guia.estado).toBe('OCULTA');
      guia.publicar(new Date('2026-12-01T00:00:00.000Z'), 'ana');
      expect(guia).toMatchObject({ estado: 'PUBLICADA', publicadaEn: AHORA });
    });

    it('un borrador no se puede ocultar', () => {
      expect(() => conPasos('Uno').ocultar('ana')).toThrow(
        GuiaNoPublicadaError,
      );
    });
  });
});

describe('ContenidoPaso.crear', () => {
  it('acepta texto, imagen y aviso, y quita los espacios de más', () => {
    const contenido = ContenidoPaso.crear([
      { tipo: 'texto', texto: '  Respira.  ' },
      { tipo: 'imagen', imagenId: IMAGEN, textoAlternativo: ' Un SMS ' },
      { tipo: 'aviso', nivel: 'alerta', texto: 'No abras el enlace.' },
    ]);
    expect(contenido.aJson()).toEqual({
      version: 1,
      bloques: [
        { tipo: 'texto', texto: 'Respira.' },
        { tipo: 'imagen', imagenId: IMAGEN, textoAlternativo: 'Un SMS' },
        { tipo: 'aviso', nivel: 'alerta', texto: 'No abras el enlace.' },
      ],
    });
  });

  it('lo que guarda se puede volver a leer', () => {
    const json = ContenidoPaso.crear([
      { tipo: 'texto', texto: 'Hola' },
    ]).aJson();
    expect(ContenidoPaso.desdeJson(json).bloques).toEqual(json.bloques);
  });

  it.each([
    ['no es una lista', 'texto'],
    ['más de 10 bloques', Array(11).fill({ tipo: 'texto', texto: 'a' })],
    [
      'un texto de más de 600 letras',
      [{ tipo: 'texto', texto: 'a'.repeat(601) }],
    ],
    [
      'un nivel de aviso desconocido',
      [{ tipo: 'aviso', nivel: 'rojo', texto: 'a' }],
    ],
  ])('rechaza %s', (_, bloques) => {
    expect(() => ContenidoPaso.crear(bloques)).toThrow(DatoInvalidoError);
  });
});

describe('slugDesdeTitulo', () => {
  it.each([
    ['Enviar un correo electrónico', 'enviar-un-correo-electronico'],
    [
      '  ¿Cómo crear una CONTRASEÑA segura?  ',
      'como-crear-una-contrasena-segura',
    ],
    ['Quishing: engaños en códigos QR', 'quishing-enganos-en-codigos-qr'],
    ['¡¡¡!!!', 'guia'],
  ])('«%s» → %s', (titulo, slug) => {
    expect(slugDesdeTitulo(titulo)).toBe(slug);
  });

  it('corta los títulos largos sin dejar un guion al final', () => {
    const slug = slugDesdeTitulo(`${'palabra '.repeat(8)}fin extra`);
    expect(slug.length).toBeLessThanOrEqual(70);
    expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
});
