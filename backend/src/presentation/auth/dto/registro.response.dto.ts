import { ApiProperty } from '@nestjs/swagger';

export class CodigoEnviadoResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Se envía al verificar o reenviar el código',
  })
  registroId: string;

  @ApiProperty({ enum: ['CORREO', 'TELEFONO'] })
  canal: 'CORREO' | 'TELEFONO';

  @ApiProperty({
    example: 'c****@correo.com',
    description: 'Destino enmascarado',
  })
  destino: string;

  @ApiProperty({
    example:
      'Te enviamos un código a c****@correo.com. Escríbelo para terminar tu registro.',
  })
  mensaje: string;

  @ApiProperty()
  expiraEn: Date;

  @ApiProperty({ description: 'Desde cuándo se puede pedir otro código' })
  puedeReenviarEn: Date;
}

class UsuarioResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Carmen Rodríguez' })
  nombre: string;

  @ApiProperty({ enum: ['USUARIO_PUBLICO', 'PERSONAL', 'ADMINISTRADOR'] })
  rol: string;
}

export class SesionIniciadaResponseDto {
  @ApiProperty({ type: UsuarioResponseDto })
  usuario: UsuarioResponseDto;

  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  accessTokenExpiraEn: Date;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  refreshTokenExpiraEn: Date;
}
