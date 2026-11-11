import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiGoneResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { RespuestaErrorDto } from '../shared/respuesta-error.dto.js';
import { Publico } from '../shared/publico.decorator.js';
import { CodigoEnviadoResultado } from '../../application/auth/codigo-enviado.js';
import { ReenviarCodigoRegistroUseCase } from '../../application/auth/reenviar-codigo-registro.use-case.js';
import { SolicitarRegistroUseCase } from '../../application/auth/solicitar-registro.use-case.js';
import { VerificarRegistroUseCase } from '../../application/auth/verificar-registro.use-case.js';
import {
  CodigoEnviadoResponseDto,
  SesionIniciadaResponseDto,
} from './dto/registro.response.dto.js';
import { SolicitarRegistroRequestDto } from './dto/solicitar-registro.request.dto.js';
import {
  RegistroIdRequestDto,
  VerificarRegistroRequestDto,
} from './dto/verificar-registro.request.dto.js';

@ApiTags('Registro')
@Publico()
@Controller('auth/registro')
export class RegistroController {
  constructor(
    private readonly solicitarRegistro: SolicitarRegistroUseCase,
    private readonly verificarRegistro: VerificarRegistroUseCase,
    private readonly reenviarCodigo: ReenviarCodigoRegistroUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Solicitar registro (HU-01)',
    description:
      'Valida los datos y el consentimiento, y envía un código de 6 dígitos al correo o al celular. La cuenta se crea al verificar el código.',
  })
  @ApiAcceptedResponse({ type: CodigoEnviadoResponseDto })
  @ApiBadRequestResponse({
    type: RespuestaErrorDto,
    description: 'Datos inválidos o aviso de privacidad no aceptado',
  })
  @ApiConflictResponse({
    type: RespuestaErrorDto,
    description: 'Identificación, teléfono o correo ya registrados',
  })
  @ApiTooManyRequestsResponse({
    type: RespuestaErrorDto,
    description: 'Se pidió un código hace muy poco',
  })
  async solicitar(
    @Body() dto: SolicitarRegistroRequestDto,
  ): Promise<CodigoEnviadoResponseDto> {
    return aRespuesta(await this.solicitarRegistro.ejecutar(dto));
  }

  @Post('verificar')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Verificar código y crear la cuenta (HU-01)',
    description:
      'Crea la cuenta con rol de usuario público y devuelve la sesión iniciada.',
  })
  @ApiCreatedResponse({ type: SesionIniciadaResponseDto })
  @ApiBadRequestResponse({
    type: RespuestaErrorDto,
    description: 'Código incorrecto',
  })
  @ApiNotFoundResponse({
    type: RespuestaErrorDto,
    description: 'La solicitud de registro no existe',
  })
  @ApiGoneResponse({ type: RespuestaErrorDto, description: 'El código venció' })
  @ApiTooManyRequestsResponse({
    type: RespuestaErrorDto,
    description: 'Se agotaron los intentos',
  })
  @ApiConflictResponse({
    type: RespuestaErrorDto,
    description: 'Otra cuenta tomó los datos mientras tanto',
  })
  async verificar(
    @Body() dto: VerificarRegistroRequestDto,
  ): Promise<SesionIniciadaResponseDto> {
    const { usuario, sesion } = await this.verificarRegistro.ejecutar(dto);
    return { usuario, ...sesion };
  }

  @Post('reenviar-codigo')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Enviar un código nuevo (HU-01)' })
  @ApiAcceptedResponse({ type: CodigoEnviadoResponseDto })
  @ApiNotFoundResponse({ type: RespuestaErrorDto })
  @ApiTooManyRequestsResponse({ type: RespuestaErrorDto })
  async reenviar(
    @Body() dto: RegistroIdRequestDto,
  ): Promise<CodigoEnviadoResponseDto> {
    return aRespuesta(await this.reenviarCodigo.ejecutar(dto));
  }
}

function aRespuesta(
  resultado: CodigoEnviadoResultado,
): CodigoEnviadoResponseDto {
  const medio = resultado.canal === 'CORREO' ? 'a' : 'por mensaje de texto al';
  return {
    ...resultado,
    mensaje: `Te enviamos un código ${medio} ${resultado.destino}. Escríbelo para terminar tu registro.`,
  };
}
