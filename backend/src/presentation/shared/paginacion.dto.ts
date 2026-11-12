import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { Paginacion } from '../../domain/shared/pagina.js';

// Entrada por query string (?pagina=2&limite=10); llega como texto, @Type la convierte a número.
export class PaginacionDto implements Paginacion {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero.' })
  @Min(1, { message: 'La página debe ser 1 o mayor.' })
  pagina: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero.' })
  @Min(1, { message: 'El límite debe ser 1 o mayor.' })
  @Max(100, { message: 'El límite puede ser máximo 100.' })
  limite: number = 20;
}

// Metadatos comunes de toda respuesta paginada; cada listado la extiende con su `datos` tipado.
export class PaginaDto {
  @ApiProperty({ example: 5 })
  total!: number;

  @ApiProperty({ example: 1 })
  pagina!: number;

  @ApiProperty({ example: 20 })
  limite!: number;
}
