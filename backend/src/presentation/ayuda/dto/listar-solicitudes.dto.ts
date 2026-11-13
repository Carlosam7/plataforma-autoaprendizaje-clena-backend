import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import {
  ESTADOS_SOLICITUD,
  TEMAS_AYUDA,
  type EstadoSolicitud,
  type TemaAyuda,
} from '../../../domain/ayuda/solicitud-ayuda.js';
import {
  CAMPOS_ORDEN_SOLICITUD,
  CriterioSolicitudes,
} from '../../../domain/ayuda/solicitud-ayuda.repository.js';
import { PaginacionDto } from '../../shared/paginacion.dto.js';

export class ListarSolicitudesDto
  extends PaginacionDto
  implements CriterioSolicitudes
{
  @ApiPropertyOptional({
    enum: ESTADOS_SOLICITUD,
    description: 'Sin él, todas. La cola del monitor es estado=PENDIENTE.',
  })
  @IsOptional()
  @IsIn(ESTADOS_SOLICITUD, {
    message: 'El estado debe ser PENDIENTE, EN_ATENCION, RESUELTA o CANCELADA.',
  })
  estado?: EstadoSolicitud;

  @ApiPropertyOptional({ enum: TEMAS_AYUDA })
  @IsOptional()
  @IsIn(TEMAS_AYUDA, { message: 'Elige un tema de la lista.' })
  tema?: TemaAyuda;

  // Solo campos permitidos: nunca se ordena por un campo que elija el cliente libremente.
  @ApiPropertyOptional({ enum: CAMPOS_ORDEN_SOLICITUD, default: 'creadaEn' })
  @IsIn(CAMPOS_ORDEN_SOLICITUD, {
    message: 'Solo se puede ordenar por creadaEn.',
  })
  ordenarPor: CriterioSolicitudes['ordenarPor'] = 'creadaEn';

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    default: 'asc',
    description: 'asc: de la más antigua a la más reciente',
  })
  @IsIn(['asc', 'desc'], { message: 'La dirección debe ser asc o desc.' })
  direccion: CriterioSolicitudes['direccion'] = 'asc';
}
