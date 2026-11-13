import { ApiProperty } from '@nestjs/swagger';
import { GuiaResumen } from '../../../application/guia/listar-guias.use-case.js';
import { ResultadoPaginado } from '../../../application/shared/resultado-paginado.js';
import type { NivelGuia } from '../../../domain/guia/guia.js';
import { PaginaDto } from '../../shared/paginacion.dto.js';

// Solo documenta en Swagger la salida del caso de uso.
export class GuiaResumenDto implements GuiaResumen {
  @ApiProperty({ example: 'smishing' })
  slug!: string;

  @ApiProperty({ example: 'phishing', description: 'Slug de la categoría' })
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
