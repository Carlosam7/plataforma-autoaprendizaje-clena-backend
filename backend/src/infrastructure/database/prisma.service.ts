import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './prisma/generated/client.js';

// Solo los repositorios de infraestructura lo inyectan; dominio y aplicación
// dependen de puertos (interfaces), nunca de este cliente ni de sus tipos.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(config: ConfigService) {
    super({
      adapter: new PrismaPg({
        connectionString: config.getOrThrow<string>('DATABASE_URL'),
      }),
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
