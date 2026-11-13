export const NIVELES_AVISO = ['consejo', 'alerta'] as const;
export type NivelAviso = (typeof NIVELES_AVISO)[number];

export type BloquePaso =
  | { tipo: 'texto'; texto: string }
  | { tipo: 'imagen'; imagenId: string; textoAlternativo: string }
  | { tipo: 'aviso'; nivel: NivelAviso; texto: string };

const VERSION = 1;

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
