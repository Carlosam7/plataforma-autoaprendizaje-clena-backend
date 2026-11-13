import { Module } from '@nestjs/common';
import { CancelarSolicitudAyudaUseCase } from '../application/ayuda/cancelar-solicitud-ayuda.use-case.js';
import { ListarSolicitudesAyudaUseCase } from '../application/ayuda/listar-solicitudes-ayuda.use-case.js';
import { ObtenerSolicitudAyudaUseCase } from '../application/ayuda/obtener-solicitud-ayuda.use-case.js';
import { SolicitarAyudaUseCase } from '../application/ayuda/solicitar-ayuda.use-case.js';
import { GeneradorId } from '../application/shared/generador-id.port.js';
import { Reloj } from '../application/shared/reloj.port.js';
import { SolicitudAyudaRepository } from '../domain/ayuda/solicitud-ayuda.repository.js';
import { PrismaSolicitudAyudaRepository } from '../infrastructure/database/repositories/prisma-solicitud-ayuda.repository.js';
import { SolicitudAyudaController } from '../presentation/ayuda/solicitud-ayuda.controller.js';

// Composition root de la ayuda presencial (HU-29).
@Module({
  controllers: [SolicitudAyudaController],
  providers: [
    {
      provide: SolicitudAyudaRepository,
      useClass: PrismaSolicitudAyudaRepository,
    },
    {
      provide: SolicitarAyudaUseCase,
      useFactory: (
        ...deps: ConstructorParameters<typeof SolicitarAyudaUseCase>
      ) => new SolicitarAyudaUseCase(...deps),
      inject: [SolicitudAyudaRepository, GeneradorId, Reloj],
    },
    {
      provide: ObtenerSolicitudAyudaUseCase,
      useFactory: (solicitudes: SolicitudAyudaRepository) =>
        new ObtenerSolicitudAyudaUseCase(solicitudes),
      inject: [SolicitudAyudaRepository],
    },
    {
      provide: CancelarSolicitudAyudaUseCase,
      useFactory: (
        ...deps: ConstructorParameters<typeof CancelarSolicitudAyudaUseCase>
      ) => new CancelarSolicitudAyudaUseCase(...deps),
      inject: [SolicitudAyudaRepository, Reloj],
    },
    {
      provide: ListarSolicitudesAyudaUseCase,
      useFactory: (solicitudes: SolicitudAyudaRepository) =>
        new ListarSolicitudesAyudaUseCase(solicitudes),
      inject: [SolicitudAyudaRepository],
    },
  ],
})
export class AyudaModule {}
