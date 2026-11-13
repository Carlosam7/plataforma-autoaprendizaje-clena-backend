export type NivelGuia = 'BASICO' | 'INTERMEDIO' | 'AVANZADO';
export type EstadoGuia = 'BORRADOR' | 'PUBLICADA' | 'OCULTA';

/** Guía del catálogo, sin sus pasos (HU-09). */
export class Guia {
  constructor(
    readonly id: string,
    /** Identifica la guía en URLs y QR; no cambia al editar el título. */
    readonly slug: string,
    readonly categoriaSlug: string,
    readonly titulo: string,
    /** «Al terminar sabrás…» */
    readonly objetivo: string,
    readonly nivel: NivelGuia,
    readonly duracionEstimadaMin: number,
    readonly estado: EstadoGuia,
  ) {}
}
