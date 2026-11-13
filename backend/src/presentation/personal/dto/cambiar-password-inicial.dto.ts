import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';
import { CambiarPasswordInicialEntrada } from '../../../application/personal/cambiar-password-inicial.use-case.js';

export class CambiarPasswordInicialDto implements CambiarPasswordInicialEntrada {
  @ApiProperty({ example: '483920' })
  @Matches(/^\d{6}$/, { message: 'El código tiene 6 números.' })
  codigo!: string;

  @ApiProperty({ example: 'MiClaveNueva2026' })
  @IsString({ message: 'Escribe tu contraseña nueva.' })
  @MaxLength(72, { message: 'La contraseña puede tener máximo 72 caracteres.' })
  passwordNueva!: string;
}
