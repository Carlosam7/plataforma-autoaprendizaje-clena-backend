import { ApiProperty } from '@nestjs/swagger';
import { CategoriaResumen } from '../../../application/categoria/listar-categorias.use-case.js';
import { ResultadoPaginado } from '../../../application/shared/resultado-paginado.js';
import { PaginaDto } from '../../shared/paginacion.dto.js';

// Solo documenta en Swagger la salida del caso de uso.
export class CategoriaDto implements CategoriaResumen {
  @ApiProperty({ example: 'salud' })
  slug!: string;

  @ApiProperty({ example: 'Salud' })
  nombre!: string;

  @ApiProperty({ example: 'heart' })
  icono!: string;
}

export class CategoriasPaginadasDto
  extends PaginaDto
  implements ResultadoPaginado<CategoriaResumen>
{
  @ApiProperty({ type: [CategoriaDto] })
  datos!: CategoriaDto[];
}
