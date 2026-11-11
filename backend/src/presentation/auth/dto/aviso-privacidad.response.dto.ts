import { ApiProperty } from '@nestjs/swagger';
import { AvisoPrivacidad } from '../../../domain/auth/aviso-privacidad.repository.js';

export class AvisoPrivacidadResponseDto implements AvisoPrivacidad {
  @ApiProperty({ example: '1.0' })
  version: string;

  @ApiProperty({ description: 'Texto completo del aviso' })
  contenido: string;

  @ApiProperty()
  vigenteDesde: Date;
}
