import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GuiaResumen } from '../../../application/guia/listar-guias.use-case.js';
import type {
  BloqueMostrado,
  DetalleGuiaResultado,
  PasoMostrado,
} from '../../../application/guia/obtener-guia.use-case.js';
import {
  NIVELES_AVISO,
  type NivelAviso,
} from '../../../domain/guia/contenido-paso.js';
import { ResultadoPaginado } from '../../../application/shared/resultado-paginado.js';
import type { NivelGuia } from '../../../domain/guia/guia.js';
import { PaginaDto } from '../../shared/paginacion.dto.js';

// Solo documenta en Swagger la salida del caso de uso.
export class GuiaResumenDto implements GuiaResumen {
  @ApiProperty({ example: 'smishing' })
  slug!: string;

  @ApiProperty({
    example: 'seguridad-digital',
    description: 'Slug de la categoría',
  })
  categoria!: string;

  @ApiProperty({ example: 'Mensajes de texto falsos' })
  titulo!: string;

  @ApiProperty({ example: 'Al terminar sabrás reconocer un SMS falso.' })
  objetivo!: string;

  @ApiProperty({ enum: ['BASICO', 'INTERMEDIO', 'AVANZADO'] })
  nivel!: NivelGuia;

  @ApiProperty({ example: 8 })
  duracionEstimadaMin!: number;
}

export class GuiasPaginadasDto
  extends PaginaDto
  implements ResultadoPaginado<GuiaResumen>
{
  @ApiProperty({
    type: [GuiaResumenDto],
    description:
      'Vacío si la categoría no tiene guías publicadas: el frontend muestra «Pronto habrá guías en esta sección».',
  })
  datos!: GuiaResumenDto[];
}

// Swagger no describe bien uniones: un solo esquema con los campos de cada tipo.
class BloqueDto {
  @ApiProperty({ enum: ['texto', 'imagen', 'aviso'] })
  tipo!: 'texto' | 'imagen' | 'aviso';

  @ApiPropertyOptional({
    description: 'Tipos texto y aviso. Máximo tres oraciones.',
    example: 'Si un mensaje te pide actuar ya, detente.',
  })
  texto?: string;

  @ApiPropertyOptional({
    description: 'Tipo aviso',
    enum: NIVELES_AVISO,
  })
  nivel?: NivelAviso;

  @ApiPropertyOptional({
    description: 'Tipo imagen',
    example: '/api/v1/archivos/semilla/guias/smishing-1.png',
  })
  url?: string;

  @ApiPropertyOptional({
    description: 'Tipo imagen',
    example: 'SMS que dice que tu cuenta será bloqueada hoy',
  })
  textoAlternativo?: string;
}

class PasoDto implements PasoMostrado {
  @ApiProperty({ example: 1, description: 'Para mostrar «Paso 1 de N»' })
  orden!: number;

  @ApiProperty({ type: String, nullable: true, example: 'Haz una pausa' })
  titulo!: string | null;

  @ApiProperty({
    type: [BloqueDto],
    description: 'Se muestran en este orden',
  })
  bloques!: BloqueMostrado[];
}

export class DetalleGuiaDto
  extends GuiaResumenDto
  implements DetalleGuiaResultado
{
  @ApiProperty({ example: 5 })
  totalPasos!: number;

  @ApiProperty({
    description:
      'Si es true, al terminar se invita a practicar con la actividad de la guía.',
  })
  tieneActividad!: boolean;

  @ApiProperty({ type: [PasoDto] })
  pasos!: PasoDto[];
}
