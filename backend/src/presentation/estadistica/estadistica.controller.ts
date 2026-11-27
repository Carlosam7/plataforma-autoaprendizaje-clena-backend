import { Controller, Get, Header, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { VerResumenEstadisticasUseCase } from '../../application/estadistica/ver-resumen-estadisticas.use-case.js';
import { RespuestaErrorDto } from '../shared/respuesta-error.dto.js';
import { Roles } from '../shared/roles.decorator.js';
import {
  ResumenEstadisticasDto,
  ResumenEstadisticasQueryDto,
} from './dto/resumen-estadisticas.dto.js';

/** HU-31: panel de estadísticas del personal (C-11). */
@ApiTags('estadisticas')
@ApiBearerAuth()
@Roles('PERSONAL', 'ADMINISTRADOR')
@ApiUnauthorizedResponse({ type: RespuestaErrorDto, description: 'Sin sesión' })
@ApiForbiddenResponse({
  type: RespuestaErrorDto,
  description: 'No es del personal',
})
@Controller('gestion/estadisticas')
export class EstadisticaController {
  constructor(private readonly verResumen: VerResumenEstadisticasUseCase) {}

  @Get('resumen')
  // Las cifras cambian con cada consulta: el navegador no debe guardarlas.
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary:
      'Consultas de guías y solicitudes de ayuda en un rango de días (HU-31)',
    description:
      'Rango de días de calendario en hora de Bogotá, con `desde` y `hasta` incluidos; por defecto los últimos 7 días contando hoy. Máximo 366 días. Cuenta las consultas sin cuenta y las de guías ocultas; nunca devuelve datos de personas.',
  })
  @ApiOkResponse({ type: ResumenEstadisticasDto })
  @ApiBadRequestResponse({
    type: RespuestaErrorDto,
    description:
      'DATOS_INVALIDOS (formato) o RANGO_FECHAS_INVALIDO (fecha inexistente, desde > hasta o más de 366 días)',
  })
  resumen(
    @Query() criterio: ResumenEstadisticasQueryDto,
  ): Promise<ResumenEstadisticasDto> {
    return this.verResumen.ejecutar(criterio);
  }
}
