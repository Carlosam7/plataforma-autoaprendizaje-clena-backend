import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import { SolicitarInicioSesionComando } from '../../../application/auth/solicitar-inicio-sesion.use-case.js';

export class SolicitarInicioSesionRequestDto implements SolicitarInicioSesionComando {
  @ApiProperty({ example: '41234567' })
  @IsString({ message: 'Escribe tu número de identificación.' })
  @MaxLength(30, { message: 'El número de identificación es demasiado largo.' })
  numeroIdentificacion: string;

  @ApiProperty({
    example: 'carmen@correo.com',
    description:
      'El correo o el celular con el que te registraste. Si tiene «@» se toma como correo.',
  })
  @IsString({ message: 'Escribe tu correo o tu número de celular.' })
  @MaxLength(254, { message: 'El correo o celular es demasiado largo.' })
  contacto: string;
}

export class VerificarInicioSesionRequestDto {
  @ApiProperty({
    format: 'uuid',
    description: 'El que devolvió POST /auth/login',
  })
  @IsUUID('all', {
    message:
      'La solicitud para iniciar sesión no es válida. Vuelve a escribir tus datos.',
  })
  solicitudId: string;

  @ApiProperty({ example: '483920' })
  @Matches(/^\s*\d{6}\s*$/, { message: 'El código tiene 6 números.' })
  codigo: string;
}

export class RefreshTokenRequestDto {
  @ApiProperty({
    description: 'El refresh token que se recibió al iniciar sesión',
  })
  @IsString({ message: 'Falta el refresh token.' })
  @MaxLength(200, { message: 'El refresh token no es válido.' })
  refreshToken: string;
}

export class InicioSesionSolicitadoResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Se envía al verificar el código',
  })
  solicitudId: string;

  @ApiProperty({ enum: ['CORREO', 'TELEFONO'] })
  canal: 'CORREO' | 'TELEFONO';

  @ApiProperty({
    example: 'c****@correo.com',
    description: 'Destino enmascarado',
  })
  destino: string;

  @ApiProperty({
    example: 'Te enviamos un código a c****@correo.com. Escríbelo para entrar.',
  })
  mensaje: string;

  @ApiProperty()
  expiraEn: Date;

  @ApiProperty({ description: 'Desde cuándo se puede pedir otro código' })
  puedeReenviarEn: Date;
}

export class SesionRenovadaResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  accessTokenExpiraEn: Date;

  @ApiProperty({ description: 'Nuevo refresh token: el anterior ya no sirve' })
  refreshToken: string;

  @ApiProperty()
  refreshTokenExpiraEn: Date;
}
