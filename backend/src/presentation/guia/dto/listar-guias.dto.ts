import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  CAMPOS_ORDEN_GUIA,
  CriterioGuiasPublicadas,
} from '../../../domain/guia/guia.repository.js';
import { PaginacionDto } from '../../shared/paginacion.dto.js';

export class ListarGuiasDto
  extends PaginacionDto
  implements CriterioGuiasPublicadas
{
  @ApiPropertyOptional({
    description: 'Slug de la categoría (GET /categorias)',
    example: 'seguridad-digital',
  })
  @IsOptional()
  @IsString({ message: 'La categoría debe ser un texto.' })
  @MaxLength(40, { message: 'La categoría puede tener máximo 40 letras.' })
  categoria?: string;

  @ApiPropertyOptional({
    description:
      'Lo que se quiere hacer (HU-11). Busca en el título, la descripción y las palabras clave, sin distinguir tildes ni mayúsculas; deben aparecer todas las palabras.',
    example: 'mandar foto',
  })
  @IsOptional()
  @IsString({ message: 'Escribe el texto que quieres buscar.' })
  @MaxLength(60, { message: 'La búsqueda puede tener máximo 60 letras.' })
  q?: string;

  // Solo campos permitidos: nunca se ordena por un campo que elija el cliente libremente.
  @ApiPropertyOptional({ enum: CAMPOS_ORDEN_GUIA, default: 'titulo' })
  @IsIn(CAMPOS_ORDEN_GUIA, {
    message:
      'Solo se puede ordenar por titulo, duracionEstimadaMin o publicadaEn.',
  })
  ordenarPor: CriterioGuiasPublicadas['ordenarPor'] = 'titulo';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsIn(['asc', 'desc'], { message: 'La dirección debe ser asc o desc.' })
  direccion: CriterioGuiasPublicadas['direccion'] = 'asc';
}
