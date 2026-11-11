import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { HealthController } from './health.controller.js';
import { validarVariablesEntorno } from './infrastructure/config/variables-entorno.js';
import { PrismaModule } from './infrastructure/database/prisma.module.js';
import { AuthModule } from './modules/auth.module.js';
import { SistemaModule } from './modules/sistema.module.js';
import { CategoriaModule } from './presentation/categoria/categoria.module.js';
import { ExcepcionesFilter } from './presentation/filters/excepciones.filter.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Si falta una variable obligatoria o es inválida, la app no arranca y dice cuál.
      validate: validarVariablesEntorno,
      cache: true,
    }),
    PrismaModule,
    SistemaModule,
    CategoriaModule,
    AuthModule,
  ],
  controllers: [HealthController],
  // APP_FILTER (y no useGlobalFilters en main.ts) para que también aplique en los tests e2e.
  providers: [{ provide: APP_FILTER, useClass: ExcepcionesFilter }],
})
export class AppModule {}
