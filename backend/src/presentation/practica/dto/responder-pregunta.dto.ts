import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class IdIntentoDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('all', { message: 'No encontramos esta práctica.' })
  id!: string;
}

export class ResponderPreguntaDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('all', { message: 'Elige una pregunta válida.' })
  preguntaId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('all', { message: 'Elige una de las opciones.' })
  opcionId!: string;
}
