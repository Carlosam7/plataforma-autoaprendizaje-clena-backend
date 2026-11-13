import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ListarGuiasUseCase } from '../../application/guia/listar-guias.use-case.js';
import { Publico } from '../shared/publico.decorator.js';
import { RespuestaErrorDto } from '../shared/respuesta-error.dto.js';
import { GuiasPaginadasDto } from './dto/guia.dto.js';
import { ListarGuiasDto } from './dto/listar-guias.dto.js';

@ApiTags('guias')
// HU-03: el catálogo se puede ver sin cuenta.
@Publico()
@Controller('guias')
export class GuiaController {
  constructor(private readonly listarGuias: ListarGuiasUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'Guías publicadas de una categoría (HU-09)',
    description:
      'Solo guías publicadas; los borradores y las ocultas no salen.',
  })
  @ApiOkResponse({ type: GuiasPaginadasDto })
  @ApiBadRequestResponse({ type: RespuestaErrorDto })
  listar(@Query() criterio: ListarGuiasDto): Promise<GuiasPaginadasDto> {
    return this.listarGuias.ejecutar(criterio);
  }
}
