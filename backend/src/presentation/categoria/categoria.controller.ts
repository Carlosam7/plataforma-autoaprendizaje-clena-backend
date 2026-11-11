import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { CategoriasPaginadasDto } from '../../application/categoria/categoria.dto.js';
import { ListarCategoriasDto } from '../../application/categoria/listar-categorias.dto.js';
import { ListarCategoriasUseCase } from '../../application/categoria/listar-categorias.use-case.js';

@Controller('categorias')
export class CategoriaController {
  constructor(private readonly listarCategorias: ListarCategoriasUseCase) {}

  @Get()
  @ApiOkResponse({ type: CategoriasPaginadasDto })
  listar(
    @Query() criterio: ListarCategoriasDto,
  ): Promise<CategoriasPaginadasDto> {
    return this.listarCategorias.ejecutar(criterio);
  }
}
