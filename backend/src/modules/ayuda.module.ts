import { Module } from '@nestjs/common';
import {
  ResolverSolicitudAyudaUseCase,
  TomarSolicitudAyudaUseCase,
} from '../application/ayuda/atender-solicitud-ayuda.use-cases.js';
import { CancelarSolicitudAyudaUseCase } from '../application/ayuda/cancelar-solicitud-ayuda.use-case.js';
import { ListarSolicitudesAyudaUseCase } from '../application/ayuda/listar-solicitudes-ayuda.use-case.js';
import { ObtenerSolicitudAyudaUseCase } from '../application/ayuda/obtener-solicitud-ayuda.use-case.js';
import { LlavesSolicitudAyuda } from '../application/ayuda/llaves-solicitud-ayuda.port.js';
import { SolicitarAyudaUseCase } from '../application/ayuda/solicitar-ayuda.use-case.js';
import { GeneradorId } from '../application/shared/generador-id.port.js';
import { Reloj } from '../application/shared/reloj.port.js';
import { SolicitudAyudaRepository } from '../domain/ayuda/solicitud-ayuda.repository.js';
import { PrismaSolicitudAyudaRepository } from '../infrastructure/database/repositories/prisma-solicitud-ayuda.repository.js';
import { LlavesSolicitudAyudaAleatorias } from '../infrastructure/seguridad/llaves-solicitud-ayuda.js';
import { SolicitudAyudaController } from '../presentation/ayuda/solicitud-ayuda.controller.js';

// Composition root de la ayuda presencial (HU-29, HU-30).
@Module({
  controllers: [SolicitudAyudaController],
  providers: [
    {
      provide: SolicitudAyudaRepository,
      useClass: PrismaSolicitudAyudaRepository,
    },
    { provide: LlavesSolicitudAyuda, useClass: LlavesSolicitudAyudaAleatorias },
    {
      provide: SolicitarAyudaUseCase,
      useFactory: (
        ...deps: ConstructorParameters<typeof SolicitarAyudaUseCase>
      ) => new SolicitarAyudaUseCase(...deps),
      inject: [
        SolicitudAyudaRepository,
        GeneradorId,
        Reloj,
        LlavesSolicitudAyuda,
      ],
    },
    {
      provide: ObtenerSolicitudAyudaUseCase,
      useFactory: (
        ...deps: ConstructorParameters<typeof ObtenerSolicitudAyudaUseCase>
      ) => new ObtenerSolicitudAyudaUseCase(...deps),
      inject: [SolicitudAyudaRepository, LlavesSolicitudAyuda],
    },
    {
      provide: CancelarSolicitudAyudaUseCase,
      useFactory: (
        ...deps: ConstructorParameters<typeof CancelarSolicitudAyudaUseCase>
      ) => new CancelarSolicitudAyudaUseCase(...deps),
      inject: [SolicitudAyudaRepository, Reloj, LlavesSolicitudAyuda],
    },
    {
      provide: TomarSolicitudAyudaUseCase,
      useFactory: (
        ...deps: ConstructorParameters<typeof TomarSolicitudAyudaUseCase>
      ) => new TomarSolicitudAyudaUseCase(...deps),
      inject: [SolicitudAyudaRepository, Reloj],
    },
    {
      provide: ResolverSolicitudAyudaUseCase,
      useFactory: (
        ...deps: ConstructorParameters<typeof ResolverSolicitudAyudaUseCase>
      ) => new ResolverSolicitudAyudaUseCase(...deps),
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
