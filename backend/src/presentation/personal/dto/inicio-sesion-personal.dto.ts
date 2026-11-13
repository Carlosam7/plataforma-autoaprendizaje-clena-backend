import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';
import { SolicitarInicioSesionPersonalComando } from '../../../application/personal/solicitar-inicio-sesion-personal.use-case.js';
import { SesionIniciadaResponseDto } from '../../auth/dto/registro.response.dto.js';

// El formato del correo lo valida el dominio.
export class SolicitarInicioSesionPersonalDto implements SolicitarInicioSesionPersonalComando {
  @ApiProperty({ example: 'andrea@clena.example' })
  @IsString({ message: 'Escribe tu correo.' })
  @MaxLength(254, { message: 'El correo es demasiado largo.' })
  correo!: string;

  @ApiProperty({ example: 'MiClave2026' })
  @IsString({ message: 'Escribe tu contraseña.' })
  @MaxLength(72, { message: 'La contraseña puede tener máximo 72 caracteres.' })
  password!: string;
}

class UsuarioPersonalResponseDto {
  @ApiProperty({ example: 'Andrea Gómez' })
  nombre!: string;

  @ApiProperty({ enum: ['PERSONAL', 'ADMINISTRADOR'] })
  rol!: string;

  @ApiProperty({
    description:
      'true si aún tiene la contraseña temporal: debe cambiarla en POST /personal/yo/password (HU-04).',
  })
  debeCambiarPassword!: boolean;
}

export class SesionPersonalIniciadaResponseDto extends SesionIniciadaResponseDto {
  @ApiProperty({ type: UsuarioPersonalResponseDto })
  declare usuario: UsuarioPersonalResponseDto;
}
