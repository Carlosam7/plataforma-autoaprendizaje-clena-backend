import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { UsuarioAutenticado } from '../../application/auth/validar-sesion.use-case.js';
import { EvaluarRespuestaUseCase } from '../../application/practica/evaluar-respuesta.use-case.js';
import { IniciarIntentoUseCase } from '../../application/practica/iniciar-intento.use-case.js';
import { ObtenerActividadUseCase } from '../../application/practica/obtener-actividad.use-case.js';
import { ResponderPreguntaUseCase } from '../../application/practica/responder-pregunta.use-case.js';
import { SlugGuiaDto } from '../guia/dto/slug-guia.dto.js';
import { Publico } from '../shared/publico.decorator.js';
import { RespuestaErrorDto } from '../shared/respuesta-error.dto.js';
import { Roles } from '../shared/roles.decorator.js';
import { UsuarioActual } from '../shared/usuario-actual.decorator.js';
import {
  ActividadDto,
  IntentoIniciadoDto,
  RespuestaEvaluadaDto,
  RespuestaResultadoDto,
} from './dto/practica.dto.js';
import {
  IdIntentoDto,
  ResponderPreguntaDto,
} from './dto/responder-pregunta.dto.js';

/**
 * HU-21: la actividad de una guía. Sin cuenta se practica con `evaluar-respuesta`, que no
 * guarda nada (Regla D, C-04). Los intentos, que sí se guardan, son solo del usuario público.
 */
@ApiTags('practica')
@ApiBadRequestResponse({ type: RespuestaErrorDto })
@ApiNotFoundResponse({ type: RespuestaErrorDto })
@Controller()
export class PracticaController {
  constructor(
    private readonly obtenerActividad: ObtenerActividadUseCase,
    private readonly evaluarRespuesta: EvaluarRespuestaUseCase,
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

  @Post('guias/:slug/actividad/evaluar-respuesta')
  @Publico()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Responder una pregunta sin cuenta (HU-03, HU-21)',
    description:
      'Dice si acertó, la opción correcta y la explicación, sin guardar nada. El avance y el resultado los lleva el navegador mientras dure la práctica. 404 si la pregunta no es de esta guía; 400 si la opción no es de la pregunta.',
  })
  @ApiOkResponse({ type: RespuestaEvaluadaDto })
  evaluar(
    @Param() { slug }: SlugGuiaDto,
    @Body() { preguntaId, opcionId }: ResponderPreguntaDto,
  ): Promise<RespuestaEvaluadaDto> {
    return this.evaluarRespuesta.ejecutar({
      slugGuia: slug,
      preguntaId,
      opcionId,
    });
  }

  @Post('guias/:slug/actividad/intentos')
  @Roles('USUARIO_PUBLICO')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({
    type: RespuestaErrorDto,
    description: 'Sin sesión',
  })
  @ApiForbiddenResponse({
    type: RespuestaErrorDto,
    description: 'No es un usuario público',
  })
  @ApiOperation({
    summary: 'Empezar o repetir la actividad con cuenta (HU-21, HU-23)',
    description:
      'El intento queda en la cuenta del usuario público y solo él puede responderlo. Sin cuenta se usa evaluar-respuesta.',
  })
  @ApiCreatedResponse({ type: IntentoIniciadoDto })
  iniciar(
    @Param() { slug }: SlugGuiaDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ): Promise<IntentoIniciadoDto> {
    return this.iniciarIntento.ejecutar(slug, usuario.id);
  }

  @Post('intentos/:id/respuestas')
  @Roles('USUARIO_PUBLICO')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({
    type: RespuestaErrorDto,
    description: 'Sin sesión',
  })
  @ApiForbiddenResponse({
    type: RespuestaErrorDto,
    description: 'No es un usuario público',
  })
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
    @UsuarioActual() usuario: UsuarioAutenticado,
  ): Promise<RespuestaResultadoDto> {
    return this.responderPregunta.ejecutar(
      { intentoId: id, preguntaId, opcionId },
      usuario.id,
    );
  }
}
