import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import type { ProgresoGuiaResumen } from '../../../application/progreso/progreso.resultado.js';
import { ResultadoPaginado } from '../../../application/shared/resultado-paginado.js';
import { NIVELES_GUIA, type NivelGuia } from '../../../domain/guia/guia.js';
import {
  ESTADOS_AVANCE,
  type EstadoAvance,
} from '../../../domain/progreso/avance-guia.js';
import {
  CAMPOS_ORDEN_PROGRESO,
  CriterioProgreso,
} from '../../../domain/progreso/progreso.repository.js';
import { SlugGuiaDto } from '../../guia/dto/slug-guia.dto.js';
import { PaginaDto, PaginacionDto } from '../../shared/paginacion.dto.js';

export class VerMiProgresoDto
  extends PaginacionDto
  implements CriterioProgreso
{
  @ApiPropertyOptional({
    description: 'Slug de la categoría (GET /categorias)',
    example: 'seguridad-digital',
  })
  @IsOptional()
  @IsString({ message: 'La categoría debe ser un texto.' })
  @MaxLength(40, { message: 'La categoría puede tener máximo 40 letras.' })
  categoria?: string;

  // Solo campos permitidos: nunca se ordena por un campo que elija el cliente libremente.
  @ApiPropertyOptional({ enum: CAMPOS_ORDEN_PROGRESO, default: 'titulo' })
  @IsIn(CAMPOS_ORDEN_PROGRESO, { message: 'Solo se puede ordenar por titulo.' })
  ordenarPor: CriterioProgreso['ordenarPor'] = 'titulo';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsIn(['asc', 'desc'], { message: 'La dirección debe ser asc o desc.' })
  direccion: CriterioProgreso['direccion'] = 'asc';
}

export class PasoDeGuiaDto extends SlugGuiaDto {
  @ApiProperty({ example: 2, description: 'Número del paso (su `orden`)' })
  @Type(() => Number)
  @IsInt({ message: 'El paso debe ser un número entero.' })
  @Min(1, { message: 'El paso debe ser 1 o mayor.' })
  orden!: number;
}

// Solo documentan en Swagger la salida de los casos de uso.
export class ProgresoGuiaDto implements ProgresoGuiaResumen {
  @ApiProperty({ example: 'smishing' })
  slug!: string;

  @ApiProperty({
    example: 'seguridad-digital',
    description: 'Slug de la categoría',
  })
  categoria!: string;

  @ApiProperty({ example: 'Smishing: mensajes falsos por SMS o WhatsApp' })
  titulo!: string;

  @ApiProperty({ enum: NIVELES_GUIA })
  nivel!: NivelGuia;

  @ApiProperty({ example: 5 })
  totalPasos!: number;

  @ApiProperty({ example: 3 })
  pasosLeidos!: number;

  @ApiProperty({
    example: 50,
    description:
      'De 0 a 100, para la barra y el número. La actividad pesa como un paso más; solo llega a 100 cuando la guía está completada.',
  })
  porcentaje!: number;

  @ApiProperty({
    enum: ESTADOS_AVANCE,
    description:
      'SIN_EMPEZAR: mostrar «Empezar». COMPLETADA: mostrar la marca.',
  })
  estado!: EstadoAvance;

  @ApiProperty({
    description:
      'Leyó todos los pasos y, si la guía tiene actividad, la aprobó.',
  })
  completada!: boolean;

  @ApiProperty()
  tieneActividad!: boolean;

  @ApiProperty()
  actividadAprobada!: boolean;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 3,
    description: 'Número del último paso que abrió',
  })
  ultimoPaso!: number | null;

  @ApiProperty({ type: Date, nullable: true })
  completadaEn!: Date | null;
}

export class ProgresoPaginadoDto
  extends PaginaDto
  implements ResultadoPaginado<ProgresoGuiaResumen>
{
  @ApiProperty({
    type: [ProgresoGuiaDto],
    description: 'Todas las guías publicadas, también las que no ha empezado',
  })
  datos!: ProgresoGuiaDto[];
}
