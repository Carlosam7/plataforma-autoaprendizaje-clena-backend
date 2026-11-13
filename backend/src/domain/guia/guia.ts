export const NIVELES_GUIA = ['BASICO', 'INTERMEDIO', 'AVANZADO'] as const;
export type NivelGuia = (typeof NIVELES_GUIA)[number];

export const ESTADOS_GUIA = ['BORRADOR', 'PUBLICADA', 'OCULTA'] as const;
export type EstadoGuia = (typeof ESTADOS_GUIA)[number];

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
