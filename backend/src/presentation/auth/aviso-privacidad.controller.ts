import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ObtenerAvisoPrivacidadUseCase } from '../../application/auth/obtener-aviso-privacidad.use-case.js';
import { Publico } from '../shared/publico.decorator.js';
import { RespuestaErrorDto } from '../shared/respuesta-error.dto.js';
import { AvisoPrivacidadResponseDto } from './dto/aviso-privacidad.response.dto.js';

@ApiTags('Registro')
@Publico()
@Controller('aviso-privacidad')
export class AvisoPrivacidadController {
  constructor(private readonly obtenerAviso: ObtenerAvisoPrivacidadUseCase) {}

  @Get('vigente')
  @ApiOperation({
    summary: 'Aviso de privacidad vigente (HU-01, Ley 1581)',
    description:
      'Texto que la pantalla de registro muestra antes de pedir el consentimiento.',
  })
  @ApiOkResponse({ type: AvisoPrivacidadResponseDto })
  @ApiServiceUnavailableResponse({ type: RespuestaErrorDto })
  vigente(): Promise<AvisoPrivacidadResponseDto> {
    return this.obtenerAviso.ejecutar();
  }
}
