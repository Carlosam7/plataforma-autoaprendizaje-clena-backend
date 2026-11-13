import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { UsuarioAutenticado } from '../../application/auth/validar-sesion.use-case.js';
import { IniciarIntentoUseCase } from '../../application/practica/iniciar-intento.use-case.js';
import { ObtenerActividadUseCase } from '../../application/practica/obtener-actividad.use-case.js';
import { ResponderPreguntaUseCase } from '../../application/practica/responder-pregunta.use-case.js';
import { SlugGuiaDto } from '../guia/dto/slug-guia.dto.js';
import { Publico, SesionOpcional } from '../shared/publico.decorator.js';
import { RespuestaErrorDto } from '../shared/respuesta-error.dto.js';
import { UsuarioOpcional } from '../shared/usuario-actual.decorator.js';
import {
  ActividadDto,
  IntentoIniciadoDto,
  RespuestaResultadoDto,
} from './dto/practica.dto.js';
import {
  IdIntentoDto,
  ResponderPreguntaDto,
} from './dto/responder-pregunta.dto.js';

@ApiTags('practica')
@ApiBadRequestResponse({ type: RespuestaErrorDto })
@ApiNotFoundResponse({ type: RespuestaErrorDto })
@Controller()
export class PracticaController {
  constructor(
    private readonly obtenerActividad: ObtenerActividadUseCase,
    private readonly iniciarIntento: IniciarIntentoUseCase,
    private readonly responderPregunta: ResponderPreguntaUseCase,
  ) {}

  @Get('guias/:slug/actividad')
  @Publico()
  @ApiOperation({
    summary: 'Preguntas de la actividad de una guía (HU-21)',
    description:
      'En orden y sin decir cuál opción es la correcta. 404 si la guía no tiene actividad.',
  })
  @ApiOkResponse({ type: ActividadDto })
  obtener(@Param() { slug }: SlugGuiaDto): Promise<ActividadDto> {
    return this.obtenerActividad.ejecutar(slug);
  }

  @Post('guias/:slug/actividad/intentos')
  @SesionOpcional()
  @ApiOperation({
    summary: 'Empezar o repetir la actividad (HU-21)',
    description:
      'Sin sesión el intento es anónimo. Con el token de un usuario público queda en su cuenta y solo él puede responderlo.',
  })
  @ApiCreatedResponse({ type: IntentoIniciadoDto })
  iniciar(
    @Param() { slug }: SlugGuiaDto,
    @UsuarioOpcional() usuario: UsuarioAutenticado | null,
  ): Promise<IntentoIniciadoDto> {
    return this.iniciarIntento.ejecutar(slug, usuario);
  }

  @Post('intentos/:id/respuestas')
  @SesionOpcional()
  @ApiOperation({
    summary: 'Responder una pregunta y saber al instante si acertó (HU-21)',
    description:
      'Devuelve si acertó, la opción correcta y la explicación. Con la última pregunta trae el resultado de la actividad.',
  })
  @ApiCreatedResponse({ type: RespuestaResultadoDto })
  @ApiConflictResponse({
    type: RespuestaErrorDto,
    description: 'La pregunta ya se respondió o el intento ya terminó',
  })
  responder(
    @Param() { id }: IdIntentoDto,
    @Body() { preguntaId, opcionId }: ResponderPreguntaDto,
    @UsuarioOpcional() usuario: UsuarioAutenticado | null,
  ): Promise<RespuestaResultadoDto> {
    return this.responderPregunta.ejecutar(
      { intentoId: id, preguntaId, opcionId },
      usuario,
    );
  }
}
