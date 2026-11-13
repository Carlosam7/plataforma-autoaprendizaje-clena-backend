import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiGoneResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { SolicitarInicioSesionPersonalUseCase } from '../../application/personal/solicitar-inicio-sesion-personal.use-case.js';
import { VerificarInicioSesionPersonalUseCase } from '../../application/personal/verificar-inicio-sesion-personal.use-case.js';
import { ponerCookieRefresh } from '../auth/cookie-refresh.js';
import {
  InicioSesionSolicitadoResponseDto,
  VerificarInicioSesionRequestDto,
} from '../auth/dto/inicio-sesion.dto.js';
import { Publico } from '../shared/publico.decorator.js';
import { RespuestaErrorDto } from '../shared/respuesta-error.dto.js';
import {
  SesionPersonalIniciadaResponseDto,
  SolicitarInicioSesionPersonalDto,
} from './dto/inicio-sesion-personal.dto.js';

// Público: quien inicia sesión todavía no tiene token. Renovar y cerrar la sesión usan las
// mismas rutas que el usuario público (POST /auth/refresh y /auth/logout).
// ThrottlerGuard limita las peticiones por IP (fuerza bruta sobre la contraseña y el código).
@ApiTags('Sesión')
@Publico()
@UseGuards(ThrottlerGuard)
@ApiTooManyRequestsResponse({
  type: RespuestaErrorDto,
  description: 'Demasiadas solicitudes seguidas o código pedido hace muy poco',
})
@Controller('auth/personal')
export class SesionPersonalController {
  constructor(
    private readonly solicitarInicio: SolicitarInicioSesionPersonalUseCase,
    private readonly verificarInicio: VerificarInicioSesionPersonalUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Iniciar sesión como personal del CLENA (HU-06)',
    description:
      'Con el correo y la contraseña, envía un código de 6 dígitos al correo. Llamarlo otra vez reenvía el código.',
  })
  @ApiAcceptedResponse({ type: InicioSesionSolicitadoResponseDto })
  @ApiBadRequestResponse({ type: RespuestaErrorDto })
  @ApiUnauthorizedResponse({
    type: RespuestaErrorDto,
    description: '«Credenciales incorrectas», sin decir cuál dato falló',
  })
  async login(
    @Body() dto: SolicitarInicioSesionPersonalDto,
  ): Promise<InicioSesionSolicitadoResponseDto> {
    const resultado = await this.solicitarInicio.ejecutar(dto);
    return {
      ...resultado,
      mensaje: `Te enviamos un código a ${resultado.destino}. Escríbelo para entrar.`,
    };
  }

  @Post('login/verificar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar el código e iniciar sesión como personal (HU-06)',
    description:
      'Devuelve el access token; el refresh token llega en la cookie httpOnly.',
  })
  @ApiOkResponse({ type: SesionPersonalIniciadaResponseDto })
  @ApiBadRequestResponse({
    type: RespuestaErrorDto,
    description: 'Código incorrecto',
  })
  @ApiNotFoundResponse({ type: RespuestaErrorDto })
  @ApiGoneResponse({ type: RespuestaErrorDto, description: 'El código venció' })
  async verificar(
    @Body() dto: VerificarInicioSesionRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SesionPersonalIniciadaResponseDto> {
    const { usuario, sesion } = await this.verificarInicio.ejecutar(dto);
    return { usuario, ...ponerCookieRefresh(res, sesion) };
  }
}
