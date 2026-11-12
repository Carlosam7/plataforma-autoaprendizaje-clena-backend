import { Controller, Get } from '@nestjs/common';
import { Publico } from '../shared/publico.decorator.js';

@Publico()
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'clena-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
