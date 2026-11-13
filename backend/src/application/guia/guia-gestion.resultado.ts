import { NivelAviso } from '../../domain/guia/contenido-paso.js';
import { GuiaNoEncontradaError } from '../../domain/guia/errores.js';
import { GuiaEditable } from '../../domain/guia/guia-editable.js';
import {
  GuiaGestionada,
  GuiaGestionRepository,
} from '../../domain/guia/guia-gestion.repository.js';
import { EstadoGuia, NivelGuia } from '../../domain/guia/guia.js';
import { ImagenRepository } from '../../domain/imagen/imagen.repository.js';
import { DatoInvalidoError } from '../../domain/shared/error-de-negocio.js';

/** Bloque como lo edita el personal: la imagen trae su id (para guardarla) y su URL (para verla). */
export type BloqueGestion =
  | { tipo: 'texto'; texto: string }
  | {
      tipo: 'imagen';
      imagenId: string;
      /** null si la imagen ya no existe. */
      url: string | null;
      textoAlternativo: string;
    }
  | { tipo: 'aviso'; nivel: NivelAviso; texto: string };

export interface PasoGestion {
  /** Se devuelve al guardar para conservar el paso; sin él, el paso cuenta como nuevo. */
  id: string;
  orden: number;
  titulo: string | null;
  bloques: BloqueGestion[];
}

export interface GuiaGestionResumen {
  slug: string;
  categoria: string;
  titulo: string;
  objetivo: string;
  nivel: NivelGuia;
  duracionEstimadaMin: number;
  estado: EstadoGuia;
  totalPasos: number;
  publicadaEn: Date | null;
  /** Nombre de quien la creó. */
  creadaPor: string;
  /** Nombre de quien la editó por última vez. */
  actualizadaPor: string;
  creadoEn: Date;
  actualizadoEn: Date;
}

export interface GuiaGestionDetalle extends GuiaGestionResumen {
  descripcion: string | null;
  palabrasClave: string[];
  pasos: PasoGestion[];
}

export function resumenGestion({
  guia,
  ...auditoria
}: GuiaGestionada): GuiaGestionResumen {
  const { datos } = guia;
  return {
    slug: guia.slug,
    categoria: datos.categoriaSlug,
    titulo: datos.titulo,
    objetivo: datos.objetivo,
    nivel: datos.nivel,
    duracionEstimadaMin: datos.duracionEstimadaMin,
    estado: guia.estado,
    totalPasos: guia.pasos.length,
    publicadaEn: guia.publicadaEn,
    ...auditoria,
  };
}

/** La guía recién leída de la base, con todo lo que el formulario necesita. */
export async function detalleGestion(
  slug: string,
  guias: GuiaGestionRepository,
  imagenes: ImagenRepository,
): Promise<GuiaGestionDetalle> {
  const gestionada = await guias.buscar(slug);
  if (!gestionada) throw new GuiaNoEncontradaError();
  const { guia } = gestionada;
  const ids = guia.imagenIds;
  const urls = ids.length ? await imagenes.urlsPorId(ids) : new Map();
  return {
    ...resumenGestion(gestionada),
    descripcion: guia.datos.descripcion,
    palabrasClave: guia.datos.palabrasClave,
    pasos: guia.pasos.map(({ id, titulo, contenido }, i) => ({
      id,
      orden: i + 1,
      titulo,
      bloques: contenido.bloques.map((b): BloqueGestion =>
        b.tipo === 'imagen' ? { ...b, url: urls.get(b.imagenId) ?? null } : b,
      ),
    })),
  };
}

/** paso.contenido no tiene llave foránea a imagen: se comprueba aquí que existan. */
export async function validarImagenes(
  guia: GuiaEditable,
  imagenes: ImagenRepository,
): Promise<void> {
  const ids = guia.imagenIds;
  if (ids.length === 0) return;
  const urls = await imagenes.urlsPorId(ids);
  if (ids.some((id) => !urls.has(id))) {
    throw new DatoInvalidoError(
      'pasos',
      'Una de las imágenes ya no existe. Quítala del paso o elige otra.',
    );
  }
}

export async function validarCategoria(
  slug: string,
  guias: GuiaGestionRepository,
): Promise<void> {
  if (!(await guias.existeCategoria(slug))) {
    throw new DatoInvalidoError(
      'categoria',
      'Elige una categoría de la lista.',
    );
  }
}
