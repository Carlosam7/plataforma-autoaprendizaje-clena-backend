import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { HealthController } from './health.controller.js';
import { PrismaModule } from './infrastructure/database/prisma.module.js';
import { CategoriaModule } from './presentation/categoria/categoria.module.js';
import { ExcepcionesFilter } from './presentation/filters/excepciones.filter.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CategoriaModule,
  ],
  controllers: [HealthController],
  // APP_FILTER (y no useGlobalFilters en main.ts) para que también aplique en los tests e2e.
  providers: [{ provide: APP_FILTER, useClass: ExcepcionesFilter }],
})
export class AppModule {}
