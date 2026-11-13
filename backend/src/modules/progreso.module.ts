import { Module } from '@nestjs/common';
import { MarcarPasoLeidoUseCase } from '../application/progreso/marcar-paso-leido.use-case.js';
import { SincronizarProgresoUseCase } from '../application/progreso/sincronizar-progreso.use-case.js';
import { VerMiProgresoUseCase } from '../application/progreso/ver-mi-progreso.use-case.js';
import { Reloj } from '../application/shared/reloj.port.js';
import { ProgresoRepository } from '../domain/progreso/progreso.repository.js';
import { PrismaProgresoRepository } from '../infrastructure/database/repositories/prisma-progreso.repository.js';
import { ProgresoController } from '../presentation/progreso/progreso.controller.js';

// Composition root del progreso del usuario (HU-23).
@Module({
  controllers: [ProgresoController],
  providers: [
    { provide: ProgresoRepository, useClass: PrismaProgresoRepository },
    {
      provide: SincronizarProgresoUseCase,
      useFactory: (
        ...deps: ConstructorParameters<typeof SincronizarProgresoUseCase>
      ) => new SincronizarProgresoUseCase(...deps),
      inject: [ProgresoRepository, Reloj],
    },
    {
      provide: MarcarPasoLeidoUseCase,
      useFactory: (
        ...deps: ConstructorParameters<typeof MarcarPasoLeidoUseCase>
      ) => new MarcarPasoLeidoUseCase(...deps),
      inject: [ProgresoRepository, SincronizarProgresoUseCase, Reloj],
    },
    {
      provide: VerMiProgresoUseCase,
      useFactory: (progresos: ProgresoRepository) =>
        new VerMiProgresoUseCase(progresos),
      inject: [ProgresoRepository],
    },
  ],
  // La práctica avisa aquí cuando alguien aprueba una actividad (HU-21).
  exports: [SincronizarProgresoUseCase],
})
export class ProgresoModule {}
