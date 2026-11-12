import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ROLES_PERSONAL } from '../../../domain/personal/personal.js';
import type { RolPersonal } from '../../../domain/personal/personal.js';
import {
  CAMPOS_ORDEN_PERSONAL,
  CriterioPersonal,
} from '../../../domain/personal/personal.repository.js';
import { PaginacionDto } from '../../shared/paginacion.dto.js';

export class ListarPersonalDto
  extends PaginacionDto
  implements CriterioPersonal
{
  @ApiPropertyOptional({
    description: 'Busca en el nombre o el correo',
    example: 'luis',
  })
  @IsOptional()
  @IsString({ message: 'Escribe el texto que quieres buscar.' })
  @MaxLength(60, { message: 'La búsqueda puede tener máximo 60 letras.' })
  q?: string;

  @ApiPropertyOptional({ enum: ROLES_PERSONAL })
  @IsOptional()
  @IsIn(ROLES_PERSONAL, {
    message: 'El rol debe ser PERSONAL o ADMINISTRADOR.',
  })
  rol?: RolPersonal;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'true: solo activas; false: solo desactivadas',
  })
  @IsOptional()
  // En la query llega como texto: "true"/"false".
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean({ message: 'El filtro activo debe ser true o false.' })
  activo?: boolean;

  @ApiPropertyOptional({ enum: CAMPOS_ORDEN_PERSONAL, default: 'nombre' })
  @IsIn(CAMPOS_ORDEN_PERSONAL, {
    message: 'Solo se puede ordenar por nombre, correo o creadoEn.',
  })
  ordenarPor: CriterioPersonal['ordenarPor'] = 'nombre';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsIn(['asc', 'desc'], { message: 'La dirección debe ser asc o desc.' })
  direccion: CriterioPersonal['direccion'] = 'asc';
}
