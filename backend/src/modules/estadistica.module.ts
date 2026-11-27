import { Module } from '@nestjs/common';
import { VerResumenEstadisticasUseCase } from '../application/estadistica/ver-resumen-estadisticas.use-case.js';
import { Reloj } from '../application/shared/reloj.port.js';
import { EstadisticaRepository } from '../domain/estadistica/estadistica.repository.js';
import { PrismaEstadisticaRepository } from '../infrastructure/database/repositories/prisma-estadistica.repository.js';
import { EstadisticaController } from '../presentation/estadistica/estadistica.controller.js';

// Composition root del panel de estadísticas (HU-31).
@Module({
  controllers: [EstadisticaController],
  providers: [
    { provide: EstadisticaRepository, useClass: PrismaEstadisticaRepository },
    {
      provide: VerResumenEstadisticasUseCase,
      useFactory: (
        ...deps: ConstructorParameters<typeof VerResumenEstadisticasUseCase>
      ) => new VerResumenEstadisticasUseCase(...deps),
      inject: [EstadisticaRepository, Reloj],
    },
  ],
})
export class EstadisticaModule {}
