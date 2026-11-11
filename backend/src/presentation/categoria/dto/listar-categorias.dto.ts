import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  CAMPOS_ORDEN_CATEGORIA,
  CriterioCategorias,
} from '../../../domain/categoria/categoria.repository.js';
import { PaginacionDto } from '../../shared/paginacion.dto.js';

export class ListarCategoriasDto
  extends PaginacionDto
  implements CriterioCategorias
{
  @ApiPropertyOptional({
    description: 'Busca en el nombre o el slug',
    example: 'red',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  q?: string;

  // Solo campos permitidos: nunca se ordena por un campo que elija el cliente libremente.
  @ApiPropertyOptional({ enum: CAMPOS_ORDEN_CATEGORIA, default: 'orden' })
  @IsIn(CAMPOS_ORDEN_CATEGORIA)
  ordenarPor: CriterioCategorias['ordenarPor'] = 'orden';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsIn(['asc', 'desc'])
  direccion: CriterioCategorias['direccion'] = 'asc';
}
