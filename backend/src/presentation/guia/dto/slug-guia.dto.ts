import { ApiProperty } from '@nestjs/swagger';
import { Matches, MaxLength } from 'class-validator';

export class SlugGuiaDto {
  @ApiProperty({ example: 'smishing' })
  @MaxLength(80, { message: 'La dirección de la guía es demasiado larga.' })
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'La dirección de la guía no es válida.',
  })
  slug!: string;
}
