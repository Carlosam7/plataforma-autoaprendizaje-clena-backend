import { ApiProperty } from '@nestjs/swagger';
import type { SolicitudEnColaResumen } from '../../../application/ayuda/listar-solicitudes-ayuda.use-case.js';
import type { AyudaSolicitada } from '../../../application/ayuda/solicitar-ayuda.use-case.js';
import type { SolicitudAyudaResultado } from '../../../application/ayuda/solicitud-ayuda.resultado.js';
import { ResultadoPaginado } from '../../../application/shared/resultado-paginado.js';
import {
  ESTADOS_SOLICITUD,
  TEMAS_AYUDA,
  type EstadoSolicitud,
  type TemaAyuda,
} from '../../../domain/ayuda/solicitud-ayuda.js';
import { PaginaDto } from '../../shared/paginacion.dto.js';

// Solo documentan en Swagger la salida de los casos de uso.
export class SolicitudAyudaDto implements SolicitudAyudaResultado {
  @ApiProperty({
    format: 'uuid',
    description: 'Con él se consulta y se cancela la solicitud.',
  })
  id!: string;

  @ApiProperty({ example: '12' })
  equipo!: string;

  @ApiProperty({ enum: TEMAS_AYUDA })
  tema!: TemaAyuda;

  @ApiProperty({ enum: ESTADOS_SOLICITUD })
  estado!: EstadoSolicitud;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 2,
    description:
      'Puesto en la cola mientras está PENDIENTE; null cuando ya la atienden o se cerró.',
  })
  posicion!: number | null;

  @ApiProperty()
  creadaEn!: Date;
}

export class AyudaSolicitadaDto
  extends SolicitudAyudaDto
  implements AyudaSolicitada
{
  @ApiProperty({
    description:
      'true: el equipo ya tenía una solicitud activa y se devuelve esa, sin crear otra.',
  })
  yaExistia!: boolean;
}

class GuiaDeSolicitudDto {
  @ApiProperty({ example: 'smishing' })
  slug!: string;

  @ApiProperty({ example: 'Smishing: mensajes falsos por SMS o WhatsApp' })
  titulo!: string;
}

class SolicitudEnColaDto implements SolicitudEnColaResumen {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: '12' })
  equipo!: string;

  @ApiProperty({ enum: TEMAS_AYUDA })
  tema!: TemaAyuda;

  @ApiProperty({ enum: ESTADOS_SOLICITUD })
  estado!: EstadoSolicitud;

  @ApiProperty({
    type: GuiaDeSolicitudDto,
    nullable: true,
    description: 'Guía donde estaba la persona, si pidió ayuda desde una',
  })
  guia!: GuiaDeSolicitudDto | null;

  @ApiProperty({ type: Number, nullable: true, example: 3 })
  paso!: number | null;

  @ApiProperty({ description: 'Para calcular el tiempo de espera' })
  creadaEn!: Date;
}

export class SolicitudesPaginadasDto
  extends PaginaDto
  implements ResultadoPaginado<SolicitudEnColaResumen>
{
  @ApiProperty({ type: [SolicitudEnColaDto] })
  datos!: SolicitudEnColaDto[];
}
