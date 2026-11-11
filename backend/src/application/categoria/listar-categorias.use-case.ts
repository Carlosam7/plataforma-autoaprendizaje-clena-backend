import { Injectable } from '@nestjs/common';
import { CategoriaRepository } from '../../domain/categoria/categoria.repository.js';
import { CategoriaDto, CategoriasPaginadasDto } from './categoria.dto.js';
import { ListarCategoriasDto } from './listar-categorias.dto.js';

@Injectable()
export class ListarCategoriasUseCase {
  constructor(private readonly categorias: CategoriaRepository) {}

  async ejecutar(
    criterio: ListarCategoriasDto,
  ): Promise<CategoriasPaginadasDto> {
    const { elementos, total } = await this.categorias.listar(criterio);
    return {
      datos: elementos.map((categoria) => CategoriaDto.desde(categoria)),
      total,
      pagina: criterio.pagina,
      limite: criterio.limite,
    };
  }
}
