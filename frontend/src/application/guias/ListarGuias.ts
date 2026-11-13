import type { Guia } from '../../domain/guias/types';
import type { GuiasRepository } from './ports';

export class ListarGuias {
  constructor(private readonly repository: GuiasRepository) {}

  async ejecutar(categoriaSlug?: string): Promise<Guia[]> {
    const guias = await this.repository.listarGuiasPublicadas(categoriaSlug);
    // Filtrar siempre exclusivamente las publicadas según AC-HU09-02
    return guias.filter((g) => g.estado === 'PUBLICADA');
  }
}
