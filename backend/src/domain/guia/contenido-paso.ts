export const NIVELES_AVISO = ['consejo', 'alerta'] as const;
export type NivelAviso = (typeof NIVELES_AVISO)[number];

import { DatoInvalidoError } from '../shared/error-de-negocio.js';

export type BloquePaso =
  | { tipo: 'texto'; texto: string }
  | { tipo: 'imagen'; imagenId: string; textoAlternativo: string }
  | { tipo: 'aviso'; nivel: NivelAviso; texto: string };

const VERSION = 1;
const MAX_BLOQUES = 10;
const MAX_TEXTO = 600;
const MAX_TEXTO_ALTERNATIVO = 250;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Contenido de un paso (columna paso.contenido): bloques en el orden en que se muestran.
 * `version` es la del formato del JSON, para poder leer pasos viejos si el formato cambia.
 */
export class ContenidoPaso {
  private constructor(readonly bloques: readonly BloquePaso[]) {}

  /** Valida el JSON guardado; si no tiene la forma esperada, lanza un error. */
  static desdeJson(valor: unknown): ContenidoPaso {
    if (!esObjeto(valor) || valor.version !== VERSION) {
      throw new Error('Contenido de paso con versión desconocida');
    }
    if (!Array.isArray(valor.bloques)) {
      throw new Error('Contenido de paso sin lista de bloques');
    }
    return new ContenidoPaso(valor.bloques.map(leerBloque));
  }

  /**
   * Contenido que escribe el personal al crear o editar un paso (HU-13). A diferencia de
   * `desdeJson`, los errores son de validación: su mensaje se le muestra a quien edita.
   */
  static crear(bloques: unknown): ContenidoPaso {
    if (!Array.isArray(bloques) || bloques.length === 0) {
      throw invalido(
        'Cada paso necesita al menos un texto, una imagen o un aviso.',
      );
    }
    if (bloques.length > MAX_BLOQUES) {
      throw invalido(`Un paso puede tener máximo ${MAX_BLOQUES} bloques.`);
    }
    return new ContenidoPaso(bloques.map(crearBloque));
  }

  /** Lo que se guarda en la columna paso.contenido. */
  aJson(): { version: number; bloques: BloquePaso[] } {
    return { version: VERSION, bloques: [...this.bloques] };
  }
}

function invalido(mensaje: string): DatoInvalidoError {
  return new DatoInvalidoError('pasos', mensaje);
}

function crearBloque(valor: unknown, i: number): BloquePaso {
  let bloque: BloquePaso;
  try {
    bloque = leerBloque(valor, i);
  } catch {
    throw invalido(
      `El bloque ${i + 1} de un paso no es válido: debe ser un texto, una imagen o un aviso, sin campos vacíos.`,
    );
  }
  if (bloque.tipo === 'imagen') {
    // Sin esto, un id mal escrito haría fallar la consulta de imágenes al leer la guía.
    if (!UUID.test(bloque.imagenId)) {
      throw invalido('Una de las imágenes no es válida.');
    }
    const textoAlternativo = bloque.textoAlternativo.trim();
    if (textoAlternativo.length > MAX_TEXTO_ALTERNATIVO) {
      throw invalido(
        `La descripción de una imagen puede tener máximo ${MAX_TEXTO_ALTERNATIVO} letras.`,
      );
    }
    return { ...bloque, textoAlternativo };
  }
  const texto = bloque.texto.trim();
  if (texto.length > MAX_TEXTO) {
    throw invalido(
      `Cada texto de un paso puede tener máximo ${MAX_TEXTO} letras.`,
    );
  }
  return { ...bloque, texto };
}

function leerBloque(bloque: unknown, i: number): BloquePaso {
  if (esObjeto(bloque)) {
    const { tipo } = bloque;
    if (tipo === 'texto' && esTexto(bloque.texto)) {
      return { tipo, texto: bloque.texto };
    }
    if (
      tipo === 'imagen' &&
      esTexto(bloque.imagenId) &&
      esTexto(bloque.textoAlternativo)
    ) {
      return {
        tipo,
        imagenId: bloque.imagenId,
        textoAlternativo: bloque.textoAlternativo,
      };
    }
    if (
      tipo === 'aviso' &&
      NIVELES_AVISO.includes(bloque.nivel as NivelAviso) &&
      esTexto(bloque.texto)
    ) {
      return { tipo, nivel: bloque.nivel as NivelAviso, texto: bloque.texto };
    }
  }
  throw new Error(`Bloque ${i + 1} del paso con forma inválida`);
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

function esTexto(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim() !== '';
}
