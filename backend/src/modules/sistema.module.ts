import { Global, Module } from '@nestjs/common';
import { GeneradorId } from '../application/shared/generador-id.port.js';
import { Reloj } from '../application/shared/reloj.port.js';
import { EstadoBaseDatos } from '../application/sistema/estado-base-datos.port.js';
import { VerificarSaludUseCase } from '../application/sistema/verificar-salud.use-case.js';
import { PrismaEstadoBaseDatos } from '../infrastructure/database/prisma-estado-base-datos.js';
import { GeneradorUuid, RelojSistema } from '../infrastructure/sistema.js';
import { HealthController } from '../presentation/health/health.controller.js';

// Servicios del sistema (hora actual, ids) que usan varios casos de uso, y el healthcheck.
@Global()
@Module({
  controllers: [HealthController],
  providers: [
    { provide: Reloj, useClass: RelojSistema },
    { provide: GeneradorId, useClass: GeneradorUuid },
    { provide: EstadoBaseDatos, useClass: PrismaEstadoBaseDatos },
    {
      provide: VerificarSaludUseCase,
      useFactory: (
        ...deps: ConstructorParameters<typeof VerificarSaludUseCase>
      ) => new VerificarSaludUseCase(...deps),
      inject: [EstadoBaseDatos, Reloj],
    },
  ],
  exports: [Reloj, GeneradorId],
})
export class SistemaModule {}
