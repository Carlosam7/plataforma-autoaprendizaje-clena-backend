import type { DetalleGuia } from '../../domain/guias/types';
import type { GuiasRepository } from './ports';

export class ObtenerDetalleGuia {
  constructor(private readonly repository: GuiasRepository) {}

  async ejecutar(slug: string): Promise<DetalleGuia | null> {
    const detalle = await this.repository.obtenerDetalleGuia(slug);
    if (!detalle) {
      return null;
    }

    // AC-HU10-05: registrar la apertura de la guía para estadísticas
    try {
      await this.repository.registrarAperturaGuia(slug);
    } catch {
      // El fallo en la telemetría nunca debe impedir que el usuario lea su guía
    }

    return detalle;
  }
}

