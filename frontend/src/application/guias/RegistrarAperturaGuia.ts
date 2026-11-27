import type { GuiasRepository } from './ports';

/** AC-HU10-05: telemetría de apertura; nunca bloquea la lectura. */
export class RegistrarAperturaGuia {
  constructor(private readonly repository: GuiasRepository) {}

  async ejecutar(slug: string): Promise<void> {
    try {
      await this.repository.registrarAperturaGuia(slug);
    } catch {
      // Un fallo de telemetría no debe afectar al usuario
    }
  }
}
