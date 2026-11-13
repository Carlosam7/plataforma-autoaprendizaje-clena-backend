import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength } from 'class-validator';
import { CrearPersonalEntrada } from '../../../application/personal/crear-personal.use-case.js';
import { ROLES_PERSONAL } from '../../../domain/personal/personal.js';
import type { RolPersonal } from '../../../domain/personal/personal.js';

// Formato y longitud finos (correo válido, contraseña segura) los valida el dominio.
export class CrearPersonalDto implements CrearPersonalEntrada {
  @ApiProperty({ example: 'Luis Pérez' })
  @IsString({ message: 'Escribe el nombre.' })
  @MaxLength(100, { message: 'El nombre puede tener máximo 100 letras.' })
  nombre!: string;

  @ApiProperty({ example: 'luis.perez@clena.org' })
  @IsString({ message: 'Escribe el correo.' })
  @MaxLength(254, { message: 'El correo es demasiado largo.' })
  correo!: string;

  @ApiProperty({
    example: 'Temporal2026',
    description:
      'Entre 8 y 72 caracteres, con al menos una letra y un número. Se debe cambiar en el primer ingreso.',
  })
  @IsString({ message: 'Escribe la contraseña temporal.' })
  @MaxLength(72, { message: 'La contraseña puede tener máximo 72 caracteres.' })
  passwordTemporal!: string;

  @ApiProperty({ enum: ROLES_PERSONAL, example: 'PERSONAL' })
  @IsIn(ROLES_PERSONAL, {
    message: 'El rol debe ser PERSONAL o ADMINISTRADOR.',
  })
  rol!: RolPersonal;
}
