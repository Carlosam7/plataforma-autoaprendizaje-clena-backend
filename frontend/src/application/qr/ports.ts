/** Categorías y guías publicadas, leídas siempre del backend (sin datos de ejemplo). */
export interface EnlacesPublicosRepository {
  listarCategorias(): Promise<{ slug: string; nombre: string }[]>;
  listarGuias(
    categoriaSlug: string,
  ): Promise<{ slug: string; titulo: string }[]>;
}

/** Dibuja el código QR de un texto como SVG. */
export interface GeneradorQr {
  svg(texto: string): Promise<string>;
}
