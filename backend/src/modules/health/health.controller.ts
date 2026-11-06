import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service.js';
import { Publico } from '../../shared/presentation/publico.decorator.js';

@ApiTags('Salud')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Publico()
  @Get()
  @ApiOkResponse({ schema: { example: { estado: 'ok', baseDeDatos: 'ok' } } })
  async verificar(): Promise<{ estado: string; baseDeDatos: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { estado: 'ok', baseDeDatos: 'ok' };
    } catch {
      throw new ServiceUnavailableException({
        codigo: 'SERVICIO_NO_DISPONIBLE',
        mensaje: 'La plataforma no está disponible en este momento.',
        detalles: { baseDeDatos: 'sin conexión' },
      });
    }
  }
}
