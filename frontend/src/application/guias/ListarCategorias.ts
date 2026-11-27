import type { GuiasRepository } from './ports';
import type { Categoria } from '../../domain/guias/types';

export class ListarCategorias {
  constructor(private readonly guiasRepository: GuiasRepository) {}

  async ejecutar(): Promise<Categoria[]> {
    return this.guiasRepository.listarCategorias();
  }
}
