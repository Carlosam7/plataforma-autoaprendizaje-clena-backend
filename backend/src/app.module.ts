import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validarVariablesEntorno } from './config/variables-entorno.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module.js';
import { SharedModule } from './shared/shared.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validarVariablesEntorno,
      cache: true,
    }),
    PrismaModule,
    SharedModule,
    HealthModule,
    AuthModule,
  ],
})
export class AppModule {}
