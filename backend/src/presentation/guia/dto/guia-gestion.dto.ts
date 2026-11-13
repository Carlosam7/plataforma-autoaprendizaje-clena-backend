import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  BloqueGestion,
  GuiaGestionDetalle,
  GuiaGestionResumen,
  PasoGestion,
} from '../../../application/guia/guia-gestion.resultado.js';
import { ResultadoPaginado } from '../../../application/shared/resultado-paginado.js';
import {
  NIVELES_AVISO,
  type NivelAviso,
} from '../../../domain/guia/contenido-paso.js';
import {
  ESTADOS_GUIA,
  NIVELES_GUIA,
  type EstadoGuia,
  type NivelGuia,
} from '../../../domain/guia/guia.js';
import { PaginaDto } from '../../shared/paginacion.dto.js';

// Solo documentan en Swagger la salida de los casos de uso.
export class GuiaGestionResumenDto implements GuiaGestionResumen {
  @ApiProperty({
    example: 'enviar-un-correo-electronico',
    description: 'Se genera del título al crear la guía y ya no cambia.',
  })
  slug!: string;

  @ApiProperty({
    example: 'correo-electronico',
    description: 'Slug de la categoría',
  })
  categoria!: string;

  @ApiProperty({ example: 'Enviar un correo electrónico' })
  titulo!: string;

  @ApiProperty({
    example: 'Al terminar sabrás enviar un correo con un archivo.',
  })
  objetivo!: string;

  @ApiProperty({ enum: NIVELES_GUIA })
  nivel!: NivelGuia;

  @ApiProperty({ example: 10 })
  duracionEstimadaMin!: number;

  @ApiProperty({ enum: ESTADOS_GUIA })
  estado!: EstadoGuia;

  @ApiProperty({ example: 4 })
  totalPasos!: number;

  @ApiProperty({ type: Date, nullable: true })
  publicadaEn!: Date | null;

  @ApiProperty({ example: 'Ana Pérez', description: 'Quién la creó' })
  creadaPor!: string;

  @ApiProperty({
    example: 'Luis Díaz',
    description: 'Quién la editó por última vez',
  })
  actualizadaPor!: string;

  @ApiProperty()
  creadoEn!: Date;

  @ApiProperty({ description: 'Cuándo se editó por última vez' })
  actualizadoEn!: Date;
}

export class GuiasGestionPaginadasDto
  extends PaginaDto
  implements ResultadoPaginado<GuiaGestionResumen>
{
  @ApiProperty({ type: [GuiaGestionResumenDto] })
  datos!: GuiaGestionResumenDto[];
}

// Swagger no describe bien uniones: un solo esquema con los campos de cada tipo.
class BloqueGestionDto {
  @ApiProperty({ enum: ['texto', 'imagen', 'aviso'] })
  tipo!: 'texto' | 'imagen' | 'aviso';

  @ApiPropertyOptional({ description: 'Tipos texto y aviso' })
  texto?: string;

  @ApiPropertyOptional({ description: 'Tipo aviso', enum: NIVELES_AVISO })
  nivel?: NivelAviso;

  @ApiPropertyOptional({ description: 'Tipo imagen', format: 'uuid' })
  imagenId?: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description:
      'Tipo imagen: para verla en el formulario; null si ya no existe',
  })
  url?: string | null;

  @ApiPropertyOptional({ description: 'Tipo imagen' })
  textoAlternativo?: string;
}

class PasoGestionDto implements PasoGestion {
  @ApiProperty({
    format: 'uuid',
    description: 'Se devuelve al guardar para conservar el paso.',
  })
  id!: string;

  @ApiProperty({ example: 1 })
  orden!: number;

  @ApiProperty({ type: String, nullable: true })
  titulo!: string | null;

  @ApiProperty({ type: [BloqueGestionDto] })
  bloques!: BloqueGestion[];
}

export class GuiaGestionDetalleDto
  extends GuiaGestionResumenDto
  implements GuiaGestionDetalle
{
  @ApiProperty({ type: String, nullable: true })
  descripcion!: string | null;

  @ApiProperty({ type: [String] })
  palabrasClave!: string[];

  @ApiProperty({ type: [PasoGestionDto] })
  pasos!: PasoGestionDto[];
}
