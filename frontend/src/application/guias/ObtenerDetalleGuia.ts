import type { DetalleGuia } from '../../domain/guias/types';
import type { GuiasRepository } from './ports';

export class ObtenerDetalleGuia {
  constructor(private readonly repository: GuiasRepository) {}

  /** Devuelve null solo cuando la guía no existe; los fallos se propagan. */
  async ejecutar(slug: string): Promise<DetalleGuia | null> {
    return this.repository.obtenerDetalleGuia(slug);
  }
}
