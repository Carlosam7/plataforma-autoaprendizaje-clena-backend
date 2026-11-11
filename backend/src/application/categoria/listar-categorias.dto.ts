import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  CAMPOS_ORDEN_CATEGORIA,
  CriterioCategorias,
} from '../../domain/categoria/categoria.repository.js';
import { PaginacionDto } from '../shared/paginacion.dto.js';

export class ListarCategoriasDto
  extends PaginacionDto
  implements CriterioCategorias
{
  @ApiPropertyOptional({
    description: 'Busca en el nombre o el slug',
    example: 'red',
  })
  @IsOptional()
  @IsString({ message: 'Escribe el texto que quieres buscar.' })
  @MaxLength(60, { message: 'La búsqueda puede tener máximo 60 letras.' })
  q?: string;

  // Solo campos permitidos: nunca se ordena por un campo que elija el cliente libremente.
  @ApiPropertyOptional({ enum: CAMPOS_ORDEN_CATEGORIA, default: 'orden' })
  @IsIn(CAMPOS_ORDEN_CATEGORIA, {
    message: 'Solo se puede ordenar por orden o por nombre.',
  })
  ordenarPor: CriterioCategorias['ordenarPor'] = 'orden';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsIn(['asc', 'desc'], {
    message: 'La dirección debe ser asc o desc.',
  })
  direccion: CriterioCategorias['direccion'] = 'asc';
}
