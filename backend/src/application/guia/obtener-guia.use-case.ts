import { NivelAviso } from '../../domain/guia/contenido-paso.js';
import { GuiaNoEncontradaError } from '../../domain/guia/errores.js';
import { GuiaRepository } from '../../domain/guia/guia.repository.js';
import { ImagenRepository } from '../../domain/imagen/imagen.repository.js';
import { GuiaResumen, resumenGuia } from './listar-guias.use-case.js';

/** Bloque tal como lo recibe el frontend: la imagen ya trae su URL en vez del id. */
export type BloqueMostrado =
  | { tipo: 'texto'; texto: string }
  | { tipo: 'imagen'; url: string; textoAlternativo: string }
  | { tipo: 'aviso'; nivel: NivelAviso; texto: string };

export interface PasoMostrado {
  orden: number;
  titulo: string | null;
  bloques: BloqueMostrado[];
}

export interface DetalleGuiaResultado extends GuiaResumen {
  totalPasos: number;
  tieneActividad: boolean;
  pasos: PasoMostrado[];
}

/** HU-10: una guía publicada con sus pasos en orden, para leerla paso a paso. */
export class ObtenerGuiaUseCase {
  constructor(
    private readonly guias: GuiaRepository,
    private readonly imagenes: ImagenRepository,
  ) {}

  async ejecutar(slug: string): Promise<DetalleGuiaResultado> {
    const detalle = await this.guias.buscarPublicada(slug);
    if (!detalle) throw new GuiaNoEncontradaError();

    // Todas las imágenes de la guía en una sola consulta.
    const ids = detalle.pasos.flatMap((p) =>
      p.contenido.bloques.flatMap((b) =>
        b.tipo === 'imagen' ? [b.imagenId] : [],
      ),
    );
    const urls = ids.length ? await this.imagenes.urlsPorId(ids) : new Map();

    const pasos = detalle.pasos.map(({ orden, titulo, contenido }) => ({
      orden,
      titulo,
      bloques: contenido.bloques.flatMap((b): BloqueMostrado[] => {
        if (b.tipo !== 'imagen') return [b];
        const url = urls.get(b.imagenId);
        // paso.contenido no tiene FK a imagen: si la imagen ya no existe, el paso se
        // muestra sin ella en vez de con una imagen rota.
        return url
          ? [{ tipo: 'imagen', url, textoAlternativo: b.textoAlternativo }]
          : [];
      }),
    }));

    return {
      ...resumenGuia(detalle.guia),
      totalPasos: pasos.length,
      tieneActividad: detalle.tieneActividad,
      pasos,
    };
  }
}
