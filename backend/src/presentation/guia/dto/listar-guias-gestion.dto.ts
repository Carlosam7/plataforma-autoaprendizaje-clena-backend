import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  CAMPOS_ORDEN_GESTION_GUIA,
  CriterioGestionGuias,
} from '../../../domain/guia/guia-gestion.repository.js';
import { ESTADOS_GUIA, type EstadoGuia } from '../../../domain/guia/guia.js';
import { PaginacionDto } from '../../shared/paginacion.dto.js';

export class ListarGuiasGestionDto
  extends PaginacionDto
  implements CriterioGestionGuias
{
  @ApiPropertyOptional({
    enum: ESTADOS_GUIA,
    description: 'Sin él, todas: borradores, publicadas y ocultas',
  })
  @IsOptional()
  @IsIn(ESTADOS_GUIA, {
    message: 'El estado debe ser BORRADOR, PUBLICADA u OCULTA.',
  })
  estado?: EstadoGuia;

  @ApiPropertyOptional({
    description: 'Slug de la categoría (GET /categorias)',
    example: 'correo-electronico',
  })
  @IsOptional()
  @IsString({ message: 'La categoría debe ser un texto.' })
  @MaxLength(40, { message: 'La categoría puede tener máximo 40 letras.' })
  categoria?: string;

  // Solo campos permitidos: nunca se ordena por un campo que elija el cliente libremente.
  @ApiPropertyOptional({ enum: CAMPOS_ORDEN_GESTION_GUIA, default: 'titulo' })
  @IsIn(CAMPOS_ORDEN_GESTION_GUIA, {
    message: 'Solo se puede ordenar por titulo o actualizadoEn.',
  })
  ordenarPor: CriterioGestionGuias['ordenarPor'] = 'titulo';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsIn(['asc', 'desc'], { message: 'La dirección debe ser asc o desc.' })
  direccion: CriterioGestionGuias['direccion'] = 'asc';
}
