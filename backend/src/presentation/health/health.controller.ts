import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import {
  Salud,
  VerificarSaludUseCase,
} from '../../application/sistema/verificar-salud.use-case.js';
import { Publico } from '../shared/publico.decorator.js';

@ApiTags('sistema')
@Publico()
@Controller('health')
export class HealthController {
  constructor(private readonly verificarSalud: VerificarSaludUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'Estado de la API y de la base de datos (BE-09)',
    description:
      'Lo usa el healthcheck de Docker. 200 si la base de datos responde; 503 si no, con el mismo cuerpo.',
  })
  @ApiOkResponse({
    schema: {
      example: {
        status: 'ok',
        service: 'clena-backend',
        baseDatos: 'ok',
        timestamp: '2026-11-27T15:00:00.000Z',
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'La base de datos no responde',
  })
  async check(@Res({ passthrough: true }) res: Response): Promise<Salud> {
    const salud = await this.verificarSalud.ejecutar();
    if (salud.status !== 'ok') res.status(HttpStatus.SERVICE_UNAVAILABLE);
    return salud;
  }
}
