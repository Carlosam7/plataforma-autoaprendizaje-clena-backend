import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiGoneResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import type { UsuarioAutenticado } from '../../application/auth/validar-sesion.use-case.js';
import { CambiarPasswordInicialUseCase } from '../../application/personal/cambiar-password-inicial.use-case.js';
import { SolicitarCodigoPasswordInicialUseCase } from '../../application/personal/solicitar-codigo-password-inicial.use-case.js';
import { RespuestaErrorDto } from '../shared/respuesta-error.dto.js';
import { Roles } from '../shared/roles.decorator.js';
import { UsuarioActual } from '../shared/usuario-actual.decorator.js';
import { CambiarPasswordInicialDto } from './dto/cambiar-password-inicial.dto.js';
import { CodigoPasswordEnviadoDto } from './dto/personal.response.dto.js';

/** HU-04: cambio obligatorio de la contraseña temporal, verificando la identidad por correo. */
@ApiTags('Personal')
@ApiBearerAuth()
@Roles('PERSONAL', 'ADMINISTRADOR')
@Controller('personal/yo/password')
export class PasswordInicialController {
  constructor(
    private readonly solicitarCodigo: SolicitarCodigoPasswordInicialUseCase,
    private readonly cambiarPassword: CambiarPasswordInicialUseCase,
  ) {}

  @Post('codigo')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Enviar el código para cambiar la contraseña temporal (HU-04)',
  })
  @ApiAcceptedResponse({ type: CodigoPasswordEnviadoDto })
  @ApiConflictResponse({
    type: RespuestaErrorDto,
    description: 'La contraseña ya se cambió',
  })
  @ApiTooManyRequestsResponse({ type: RespuestaErrorDto })
  async codigo(
    @UsuarioActual() yo: UsuarioAutenticado,
  ): Promise<CodigoPasswordEnviadoDto> {
    const enviado = await this.solicitarCodigo.ejecutar(yo.id);
    return {
      ...enviado,
      mensaje: `Te enviamos un código a ${enviado.destino}. Escríbelo para cambiar tu contraseña.`,
    };
  }

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Cambiar la contraseña temporal con el código (HU-04)',
  })
  @ApiNoContentResponse({ description: 'Contraseña cambiada' })
  @ApiBadRequestResponse({
    type: RespuestaErrorDto,
    description: 'Código incorrecto o contraseña débil',
  })
  @ApiGoneResponse({ type: RespuestaErrorDto, description: 'El código venció' })
  @ApiTooManyRequestsResponse({ type: RespuestaErrorDto })
  @ApiConflictResponse({ type: RespuestaErrorDto })
  async cambiar(
    @UsuarioActual() yo: UsuarioAutenticado,
    @Body() dto: CambiarPasswordInicialDto,
  ): Promise<void> {
    await this.cambiarPassword.ejecutar(yo.id, dto);
  }
}
