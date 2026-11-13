import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, Matches } from 'class-validator';

export class RegistroIdRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', {
    message:
      'La solicitud de registro no es válida. Vuelve a llenar el formulario.',
  })
  registroId: string;
}

export class VerificarRegistroRequestDto extends RegistroIdRequestDto {
  @ApiProperty({ example: '483920' })
  @Matches(/^\s*\d{6}\s*$/, { message: 'El código tiene 6 números.' })
  codigo: string;
}
