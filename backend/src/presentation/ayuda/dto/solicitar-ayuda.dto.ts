import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

import type { SolicitarAyudaComando } from '../../../application/ayuda/solicitar-ayuda.use-case.js';
import {
  TEMAS_AYUDA,
  type TemaAyuda,
} from '../../../domain/ayuda/solicitud-ayuda.js';

export class SolicitarAyudaDto implements SolicitarAyudaComando {
  @ApiProperty({
    example: '12',
    description:
      'Dónde está la persona: el número del equipo o un texto corto. Identifica la solicitud: no se distinguen mayúsculas ni espacios de más.',
  })
  @IsString({ message: 'Escribe en qué equipo estás.' })
  @IsNotEmpty({ message: 'Escribe en qué equipo estás.' })
  @MaxLength(100, { message: 'El equipo puede tener máximo 100 letras.' })
  equipo!: string;

  @ApiProperty({ enum: TEMAS_AYUDA, example: 'CORREO' })
  @IsIn(TEMAS_AYUDA, { message: 'Elige un tema de la lista.' })
  tema!: TemaAyuda;

  @ApiPropertyOptional({
    example: 'smishing',
    description:
      'Guía donde estaba la persona. El frontend la envía solo; si ya no existe, la solicitud se crea sin ella.',
  })
  @IsOptional()
  @MaxLength(80, { message: 'La dirección de la guía es demasiado larga.' })
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'La dirección de la guía no es válida.',
  })
  guiaSlug?: string;

  @ApiPropertyOptional({
    example: 3,
    description: 'Número del paso donde estaba (el `orden` del paso).',
  })
  @IsOptional()
  @IsInt({ message: 'El paso debe ser un número entero.' })
  @Min(1, { message: 'El paso debe ser 1 o mayor.' })
  pasoOrden?: number;
}

export class IdSolicitudDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('all', { message: 'No encontramos esa solicitud de ayuda.' })
  id!: string;
}

export class ResolverSolicitudDto {
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'No encontraba el botón «Adjuntar».',
    description: 'Nota breve opcional sobre cómo se resolvió',
  })
  @IsOptional()
  @IsString({ message: 'El comentario debe ser un texto.' })
  @MaxLength(500, { message: 'El comentario puede tener máximo 500 letras.' })
  comentario?: string | null;
}
