import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { EditarPersonalEntrada } from '../../../application/personal/editar-personal.use-case.js';
import { ROLES_PERSONAL } from '../../../domain/personal/personal.js';
import type { RolPersonal } from '../../../domain/personal/personal.js';

export class EditarPersonalDto implements EditarPersonalEntrada {
  @ApiPropertyOptional({ example: 'Luis Pérez' })
  @IsOptional()
  @IsString({ message: 'Escribe el nombre.' })
  @MaxLength(100, { message: 'El nombre puede tener máximo 100 letras.' })
  nombre?: string;

  @ApiPropertyOptional({ example: 'luis.perez@clena.org' })
  @IsOptional()
  @IsString({ message: 'Escribe el correo.' })
  @MaxLength(254, { message: 'El correo es demasiado largo.' })
  correo?: string;

  @ApiPropertyOptional({ enum: ROLES_PERSONAL })
  @IsOptional()
  @IsIn(ROLES_PERSONAL, {
    message: 'El rol debe ser PERSONAL o ADMINISTRADOR.',
  })
  rol?: RolPersonal;
}
