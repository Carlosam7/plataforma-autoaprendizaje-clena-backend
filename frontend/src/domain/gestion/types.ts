/** HU-13, HU-15 (C-07): guías como las administra el personal, en cualquier estado. */

export const NIVELES = ['BASICO', 'INTERMEDIO', 'AVANZADO'] as const;
export type Nivel = (typeof NIVELES)[number];

export const ESTADOS_GUIA = ['BORRADOR', 'PUBLICADA', 'OCULTA'] as const;
export type EstadoGuiaGestion = (typeof ESTADOS_GUIA)[number];

export type BloqueGuia =
  | { tipo: 'texto'; texto: string }
  | { tipo: 'aviso'; nivel: 'consejo' | 'alerta'; texto: string }
  /** Solo se conservan las imágenes que ya existen: subirlas es HU-14 (Should). */
  | {
      tipo: 'imagen';
      imagenId: string;
      textoAlternativo: string;
      /** Para verla en el editor; null si la imagen ya no existe. */
      url?: string | null;
    };

export interface PasoGuia {
  /** UUID de un paso que ya existía: se envía para conservar el progreso de quien lo leyó. */
  id?: string;
  titulo: string | null;
  bloques: BloqueGuia[];
}

export interface GuiaGestionResumen {
  slug: string;
  /** Slug de la categoría. */
  categoria: string;
  titulo: string;
  objetivo: string;
  nivel: Nivel;
  duracionEstimadaMin: number;
  estado: EstadoGuiaGestion;
  totalPasos: number;
  publicadaEn: Date | null;
  creadaPor: string;
  actualizadaPor: string;
  creadoEn: Date;
  actualizadoEn: Date;
}

export interface GuiaGestionDetalle extends GuiaGestionResumen {
  descripcion: string | null;
  palabrasClave: string[];
  pasos: (PasoGuia & { id: string; orden: number })[];
}

/** Lo que se envía al crear (POST) o editar (PUT) una guía. */
export interface GuardarGuiaComando {
  titulo: string;
  objetivo: string;
  descripcion: string | null;
  categoria: string;
  nivel: Nivel;
  duracionEstimadaMin: number;
  palabrasClave: string[];
  /** Sin `pasos` el PUT no los toca; con ellos quedan exactamente estos, en este orden. */
  pasos?: PasoGuia[];
}

export interface GuiasGestionPaginadas {
  datos: GuiaGestionResumen[];
  total: number;
  pagina: number;
  limite: number;
}

/** Los mismos límites que valida el backend (C-07): el formulario avisa antes de enviar. */
export const LIMITES = {
  titulo: 150,
  objetivo: 300,
  descripcion: 2000,
  duracionMin: 1,
  duracionMax: 600,
  palabrasClave: 15,
  palabraClave: 40,
  pasos: 50,
  tituloPaso: 120,
  bloquesPorPaso: 10,
  textoBloque: 600,
  textoAlternativo: 250,
} as const;

export interface ErrorCampo {
  /** `titulo`, `objetivo`, … o `pasos` / `paso-3` para los pasos. */
  campo: string;
  mensaje: string;
}

/**
 * Revisa la guía con las reglas del backend y devuelve todos los errores, para mostrarlos
 * junto a cada campo. Lista vacía: se puede guardar.
 */
export function validarGuia(guia: GuardarGuiaComando): ErrorCampo[] {
  const errores: ErrorCampo[] = [];
  const largo = (
    campo: string,
    valor: string,
    max: number,
    nombre: { escribe: string; sujeto: string },
  ) => {
    if (!valor.trim())
      errores.push({ campo, mensaje: `Escribe ${nombre.escribe}.` });
    else if (valor.trim().length > max)
      errores.push({
        campo,
        mensaje: `${nombre.sujeto} puede tener máximo ${max} letras.`,
      });
  };
  largo('titulo', guia.titulo, LIMITES.titulo, {
    escribe: 'el título',
    sujeto: 'El título',
  });
  largo('objetivo', guia.objetivo, LIMITES.objetivo, {
    escribe: 'el objetivo',
    sujeto: 'El objetivo',
  });
  if ((guia.descripcion ?? '').trim().length > LIMITES.descripcion) {
    errores.push({
      campo: 'descripcion',
      mensaje: `La descripción puede tener máximo ${LIMITES.descripcion} letras.`,
    });
  }
  if (!guia.categoria) {
    errores.push({ campo: 'categoria', mensaje: 'Elige una categoría.' });
  }
  if (
    !Number.isInteger(guia.duracionEstimadaMin) ||
    guia.duracionEstimadaMin < LIMITES.duracionMin ||
    guia.duracionEstimadaMin > LIMITES.duracionMax
  ) {
    errores.push({
      campo: 'duracionEstimadaMin',
      mensaje: `La duración debe ser un número entero de minutos, entre ${LIMITES.duracionMin} y ${LIMITES.duracionMax}.`,
    });
  }
  if (guia.palabrasClave.length > LIMITES.palabrasClave) {
    errores.push({
      campo: 'palabrasClave',
      mensaje: `Escribe máximo ${LIMITES.palabrasClave} palabras clave.`,
    });
  } else if (guia.palabrasClave.some((p) => p.length > LIMITES.palabraClave)) {
    errores.push({
      campo: 'palabrasClave',
      mensaje: `Cada palabra clave puede tener máximo ${LIMITES.palabraClave} letras.`,
    });
  }

  const pasos = guia.pasos ?? [];
  if (pasos.length > LIMITES.pasos) {
    errores.push({
      campo: 'pasos',
      mensaje: `Una guía puede tener máximo ${LIMITES.pasos} pasos.`,
    });
  }
  pasos.forEach((paso, i) => {
    const campo = `paso-${i + 1}`;
    const numero = `El paso ${i + 1}`;
    if ((paso.titulo ?? '').length > LIMITES.tituloPaso) {
      errores.push({
        campo,
        mensaje: `${numero}: el título puede tener máximo ${LIMITES.tituloPaso} letras.`,
      });
    }
    if (paso.bloques.length === 0) {
      errores.push({
        campo,
        mensaje: `${numero} necesita al menos un texto, una imagen o un aviso.`,
      });
    }
    if (paso.bloques.length > LIMITES.bloquesPorPaso) {
      errores.push({
        campo,
        mensaje: `${numero} puede tener máximo ${LIMITES.bloquesPorPaso} bloques.`,
      });
    }
    for (const bloque of paso.bloques) {
      if (bloque.tipo === 'imagen') {
        if (!bloque.textoAlternativo.trim()) {
          errores.push({
            campo,
            mensaje: `${numero}: describe cada imagen para quien no puede verla.`,
          });
        } else if (bloque.textoAlternativo.length > LIMITES.textoAlternativo) {
          errores.push({
            campo,
            mensaje: `${numero}: la descripción de una imagen puede tener máximo ${LIMITES.textoAlternativo} letras.`,
          });
        }
      } else if (!bloque.texto.trim()) {
        errores.push({
          campo,
          mensaje: `${numero} tiene un bloque vacío: escríbelo o quítalo.`,
        });
      } else if (bloque.texto.length > LIMITES.textoBloque) {
        errores.push({
          campo,
          mensaje: `${numero}: cada texto puede tener máximo ${LIMITES.textoBloque} letras.`,
        });
      }
    }
  });
  return errores;
}
