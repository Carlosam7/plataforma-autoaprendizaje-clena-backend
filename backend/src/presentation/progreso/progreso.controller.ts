import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { UsuarioAutenticado } from '../../application/auth/validar-sesion.use-case.js';
import { MarcarPasoLeidoUseCase } from '../../application/progreso/marcar-paso-leido.use-case.js';
import { VerMiProgresoUseCase } from '../../application/progreso/ver-mi-progreso.use-case.js';
import { RespuestaErrorDto } from '../shared/respuesta-error.dto.js';
import { Roles } from '../shared/roles.decorator.js';
import { UsuarioActual } from '../shared/usuario-actual.decorator.js';
import {
  PasoDeGuiaDto,
  ProgresoGuiaDto,
  ProgresoPaginadoDto,
  VerMiProgresoDto,
} from './dto/progreso.dto.js';

/**
 * HU-23: el progreso es de quien tiene cuenta. Sin sesión responde 401 y el frontend
 * invita a crear una cuenta.
 */
@ApiTags('progreso')
@ApiBearerAuth()
@Roles('USUARIO_PUBLICO')
@ApiBadRequestResponse({ type: RespuestaErrorDto })
@ApiUnauthorizedResponse({ type: RespuestaErrorDto, description: 'Sin sesión' })
@ApiForbiddenResponse({
  type: RespuestaErrorDto,
  description: 'No es un usuario público',
})
@Controller()
export class ProgresoController {
  constructor(
    private readonly verMiProgreso: VerMiProgresoUseCase,
    private readonly marcarPasoLeido: MarcarPasoLeidoUseCase,
  ) {}

  @Get('progreso')
  @ApiOperation({
    summary: 'Mi progreso en cada guía (HU-23)',
    description:
      'Todas las guías publicadas con el porcentaje completado; las que no ha empezado salen en 0 %.',
  })
  @ApiOkResponse({ type: ProgresoPaginadoDto })
  ver(
    @Query() criterio: VerMiProgresoDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ): Promise<ProgresoPaginadoDto> {
    return this.verMiProgreso.ejecutar(usuario.id, criterio);
  }

  @Post('guias/:slug/pasos/:orden/lectura')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Anotar que leí un paso de una guía (HU-23)',
    description:
      'El frontend lo llama cada vez que un usuario con sesión abre un paso. Repetirlo no cambia nada. Devuelve el progreso de la guía ya actualizado.',
  })
  @ApiOkResponse({ type: ProgresoGuiaDto })
  @ApiNotFoundResponse({
    type: RespuestaErrorDto,
    description: 'La guía no está publicada o no tiene ese paso',
  })
  marcar(
    @Param() { slug, orden }: PasoDeGuiaDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ): Promise<ProgresoGuiaDto> {
    return this.marcarPasoLeido.ejecutar(usuario.id, slug, orden);
  }
}
