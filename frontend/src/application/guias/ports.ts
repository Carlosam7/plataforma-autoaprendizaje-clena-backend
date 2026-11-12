import type { Categoria, DetalleGuia, Guia } from '../../domain/guias/types';

export interface GuiasRepository {
  obtenerCategoria(slug: string): Promise<Categoria | null>;
  listarGuiasPublicadas(categoriaSlug?: string): Promise<Guia[]>;
  obtenerDetalleGuia(slug: string): Promise<DetalleGuia | null>;
  registrarAperturaGuia(slug: string): Promise<void>;
}

