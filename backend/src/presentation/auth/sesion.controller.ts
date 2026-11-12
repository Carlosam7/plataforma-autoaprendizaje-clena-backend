import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiGoneResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CerrarSesionUseCase } from '../../application/auth/cerrar-sesion.use-case.js';
import { RenovarSesionUseCase } from '../../application/auth/renovar-sesion.use-case.js';
import { SolicitarInicioSesionUseCase } from '../../application/auth/solicitar-inicio-sesion.use-case.js';
import { VerificarInicioSesionUseCase } from '../../application/auth/verificar-inicio-sesion.use-case.js';
import { SesionInvalidaError } from '../../domain/auth/errores.js';
import {
  borrarCookieRefresh,
  COOKIE_REFRESH,
  leerCookieRefresh,
  ponerCookieRefresh,
} from './cookie-refresh.js';
import { Publico } from '../shared/publico.decorator.js';
import { RespuestaErrorDto } from '../shared/respuesta-error.dto.js';
import {
  InicioSesionSolicitadoResponseDto,
  SesionRenovadaResponseDto,
  SolicitarInicioSesionRequestDto,
  VerificarInicioSesionRequestDto,
} from './dto/inicio-sesion.dto.js';
import { SesionIniciadaResponseDto } from './dto/registro.response.dto.js';

// Público: quien inicia sesión o renueva su access token todavía no tiene uno válido.
// ThrottlerGuard limita las peticiones por IP (fuerza bruta y abuso del envío de códigos).
@ApiTags('Sesión')
@Publico()
@UseGuards(ThrottlerGuard)
@ApiTooManyRequestsResponse({
  type: RespuestaErrorDto,
  description: 'Demasiadas solicitudes seguidas o código pedido hace muy poco',
})
@Controller('auth')
export class SesionController {
  constructor(
    private readonly solicitarInicio: SolicitarInicioSesionUseCase,
    private readonly verificarInicio: VerificarInicioSesionUseCase,
    private readonly renovarSesion: RenovarSesionUseCase,
    private readonly cerrarSesion: CerrarSesionUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Iniciar sesión (HU-02)',
    description:
      'Con el número de identificación y el correo o celular de la cuenta, envía un código de 6 dígitos a ese contacto. Llamarlo otra vez reenvía el código.',
  })
  @ApiAcceptedResponse({ type: InicioSesionSolicitadoResponseDto })
  @ApiBadRequestResponse({ type: RespuestaErrorDto })
  @ApiUnauthorizedResponse({
    type: RespuestaErrorDto,
    description: '«Credenciales inválidas», sin decir cuál dato falló',
  })
  async login(
    @Body() dto: SolicitarInicioSesionRequestDto,
  ): Promise<InicioSesionSolicitadoResponseDto> {
    const resultado = await this.solicitarInicio.ejecutar(dto);
    const medio =
      resultado.canal === 'CORREO' ? 'a' : 'por mensaje de texto al';
    return {
      ...resultado,
      mensaje: `Te enviamos un código ${medio} ${resultado.destino}. Escríbelo para entrar.`,
    };
  }

  @Post('login/verificar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar el código e iniciar sesión (HU-02)',
    description: 'Devuelve el access token y el refresh token.',
  })
  @ApiOkResponse({ type: SesionIniciadaResponseDto })
  @ApiBadRequestResponse({
    type: RespuestaErrorDto,
    description: 'Código incorrecto',
  })
  @ApiNotFoundResponse({ type: RespuestaErrorDto })
  @ApiGoneResponse({ type: RespuestaErrorDto, description: 'El código venció' })
  async verificar(
    @Body() dto: VerificarInicioSesionRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SesionIniciadaResponseDto> {
    const { usuario, sesion } = await this.verificarInicio.ejecutar(dto);
    return { usuario, ...ponerCookieRefresh(res, sesion) };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovar la sesión (HU-02)',
    description: `Lee el refresh token de la cookie ${COOKIE_REFRESH} y lo cambia por un access token nuevo y una cookie nueva. Cada refresh token sirve una sola vez: si se reutiliza uno ya cambiado, se cierran todas las sesiones de esa persona.`,
  })
  @ApiOkResponse({ type: SesionRenovadaResponseDto })
  @ApiUnauthorizedResponse({
    type: RespuestaErrorDto,
    description: 'Refresh token vencido, cerrado o desconocido',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SesionRenovadaResponseDto> {
    const refreshToken = leerCookieRefresh(req);
    if (!refreshToken) throw new SesionInvalidaError();
    return ponerCookieRefresh(
      res,
      await this.renovarSesion.ejecutar(refreshToken),
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Cerrar sesión (HU-02)',
    description: `Invalida el refresh token de la cookie ${COOKIE_REFRESH} y la borra; el access token de esa sesión deja de servir de inmediato.`,
  })
  @ApiNoContentResponse()
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken = leerCookieRefresh(req);
    if (refreshToken) await this.cerrarSesion.ejecutar(refreshToken);
    borrarCookieRefresh(res);
  }
}
