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
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiGoneResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { ConfirmarEliminacionCuentaUseCase } from '../../application/auth/confirmar-eliminacion-cuenta.use-case.js';
import { SolicitarEliminacionCuentaUseCase } from '../../application/auth/solicitar-eliminacion-cuenta.use-case.js';
import type { UsuarioAutenticado } from '../../application/auth/validar-sesion.use-case.js';
import { RespuestaErrorDto } from '../shared/respuesta-error.dto.js';
import { Roles } from '../shared/roles.decorator.js';
import { UsuarioActual } from '../shared/usuario-actual.decorator.js';
import { borrarCookieRefresh } from './cookie-refresh.js';
import {
  ConfirmarEliminacionCuentaDto,
  EliminacionSolicitadaDto,
  SolicitarEliminacionCuentaDto,
} from './dto/eliminacion-cuenta.dto.js';

/**
 * HU-05: derecho de supresión (Ley 1581). Solo el usuario público, sobre su propia cuenta:
 * la cuenta sale de la sesión, nunca de un dato que envíe el cliente.
 */
@ApiTags('Cuenta')
@ApiBearerAuth()
@Roles('USUARIO_PUBLICO')
// ThrottlerGuard limita las peticiones por IP (abuso del envío de códigos y fuerza bruta).
@UseGuards(ThrottlerGuard)
@ApiUnauthorizedResponse({ type: RespuestaErrorDto, description: 'Sin sesión' })
@ApiForbiddenResponse({
  type: RespuestaErrorDto,
  description: 'No es un usuario público',
})
@ApiTooManyRequestsResponse({
  type: RespuestaErrorDto,
  description: 'Demasiadas solicitudes seguidas o código pedido hace muy poco',
})
@Controller('auth/cuenta')
export class CuentaController {
  constructor(
    private readonly solicitarEliminacion: SolicitarEliminacionCuentaUseCase,
    private readonly confirmarEliminacion: ConfirmarEliminacionCuentaUseCase,
  ) {}

  @Post('eliminacion')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Pedir la eliminación de mi cuenta (HU-05)',
    description:
      'Envía un código de 6 dígitos al correo o al celular de la cuenta. Todavía no se borra nada. Llamarlo otra vez reenvía el código.',
  })
  @ApiAcceptedResponse({ type: EliminacionSolicitadaDto })
  @ApiBadRequestResponse({
    type: RespuestaErrorDto,
    description: 'La cuenta no tiene confirmado ese contacto',
  })
  async solicitar(
    @Body() { canal }: SolicitarEliminacionCuentaDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ): Promise<EliminacionSolicitadaDto> {
    const resultado = await this.solicitarEliminacion.ejecutar(
      usuario.id,
      canal,
    );
    const medio =
      resultado.canal === 'CORREO' ? 'a' : 'por mensaje de texto al';
    return {
      ...resultado,
      mensaje: `Te enviamos un código ${medio} ${resultado.destino}. Escríbelo para confirmar que quieres eliminar tu cuenta.`,
    };
  }

  @Post('eliminacion/confirmar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Confirmar con el código y eliminar mi cuenta (HU-05)',
    description:
      'Borra los datos personales, las sesiones, el progreso y los intentos. Las consultas de guías, las solicitudes de ayuda y las calificaciones se conservan sin referencia a la persona. No se puede deshacer.',
  })
  @ApiNoContentResponse({
    description: 'Cuenta eliminada; la sesión queda cerrada',
  })
  @ApiBadRequestResponse({
    type: RespuestaErrorDto,
    description: 'Código incorrecto',
  })
  @ApiNotFoundResponse({ type: RespuestaErrorDto })
  @ApiGoneResponse({ type: RespuestaErrorDto, description: 'El código venció' })
  async confirmar(
    @Body() dto: ConfirmarEliminacionCuentaDto,
    @UsuarioActual() usuario: UsuarioAutenticado,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.confirmarEliminacion.ejecutar(usuario.id, dto);
    borrarCookieRefresh(res);
  }
}
