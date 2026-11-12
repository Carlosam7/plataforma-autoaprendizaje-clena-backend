import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ListarCategoriasUseCase } from '../../application/categoria/listar-categorias.use-case.js';
import { Publico } from '../shared/publico.decorator.js';
import { CategoriasPaginadasDto } from './dto/categoria.dto.js';
import { ListarCategoriasDto } from './dto/listar-categorias.dto.js';

@ApiTags('categorias')
// HU-03: el catálogo se puede ver sin cuenta.
@Publico()
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
