import { Module } from '@nestjs/common';
import { IniciarIntentoUseCase } from '../application/practica/iniciar-intento.use-case.js';
import { ObtenerActividadUseCase } from '../application/practica/obtener-actividad.use-case.js';
import { ResponderPreguntaUseCase } from '../application/practica/responder-pregunta.use-case.js';
import { SincronizarProgresoUseCase } from '../application/progreso/sincronizar-progreso.use-case.js';
import { GeneradorId } from '../application/shared/generador-id.port.js';
import { Reloj } from '../application/shared/reloj.port.js';
import { ActividadRepository } from '../domain/practica/actividad.repository.js';
import { IntentoRepository } from '../domain/practica/intento.repository.js';
import { PrismaActividadRepository } from '../infrastructure/database/repositories/prisma-actividad.repository.js';
import { PrismaIntentoRepository } from '../infrastructure/database/repositories/prisma-intento.repository.js';
import { PracticaController } from '../presentation/practica/practica.controller.js';
import { ProgresoModule } from './progreso.module.js';

// Composition root de la práctica con preguntas (HU-21).
@Module({
  // HU-23: aprobar una actividad puede completar la guía.
  imports: [ProgresoModule],
  controllers: [PracticaController],
  providers: [
    { provide: ActividadRepository, useClass: PrismaActividadRepository },
    { provide: IntentoRepository, useClass: PrismaIntentoRepository },
    {
      provide: ObtenerActividadUseCase,
      useFactory: (actividades: ActividadRepository) =>
        new ObtenerActividadUseCase(actividades),
      inject: [ActividadRepository],
    },
    {
      provide: IniciarIntentoUseCase,
      useFactory: (
        ...deps: ConstructorParameters<typeof IniciarIntentoUseCase>
      ) => new IniciarIntentoUseCase(...deps),
      inject: [ActividadRepository, IntentoRepository, GeneradorId, Reloj],
    },
    {
      provide: ResponderPreguntaUseCase,
      useFactory: (
        ...deps: ConstructorParameters<typeof ResponderPreguntaUseCase>
      ) => new ResponderPreguntaUseCase(...deps),
      inject: [IntentoRepository, Reloj, SincronizarProgresoUseCase],
    },
  ],
})
export class PracticaModule {}
