import { Module } from '@nestjs/common';
import {
  OcultarGuiaUseCase,
  PublicarGuiaUseCase,
} from '../application/guia/cambiar-estado-guia.use-cases.js';
import {
  ListarGuiasGestionUseCase,
  ObtenerGuiaGestionUseCase,
} from '../application/guia/consultar-guias-gestion.use-cases.js';
import { CrearGuiaUseCase } from '../application/guia/crear-guia.use-case.js';
import { EditarGuiaUseCase } from '../application/guia/editar-guia.use-case.js';
import { ListarGuiasUseCase } from '../application/guia/listar-guias.use-case.js';
import { ObtenerGuiaUseCase } from '../application/guia/obtener-guia.use-case.js';
import { RegistrarConsultaGuiaUseCase } from '../application/guia/registrar-consulta-guia.use-case.js';
import { GeneradorId } from '../application/shared/generador-id.port.js';
import { Reloj } from '../application/shared/reloj.port.js';
import { ConsultaGuiaRepository } from '../domain/guia/consulta-guia.repository.js';
import { GuiaGestionRepository } from '../domain/guia/guia-gestion.repository.js';
import { GuiaRepository } from '../domain/guia/guia.repository.js';
import { ImagenRepository } from '../domain/imagen/imagen.repository.js';
import { PrismaConsultaGuiaRepository } from '../infrastructure/database/repositories/prisma-consulta-guia.repository.js';
import { PrismaGuiaGestionRepository } from '../infrastructure/database/repositories/prisma-guia-gestion.repository.js';
import { PrismaGuiaRepository } from '../infrastructure/database/repositories/prisma-guia.repository.js';
import { PrismaImagenRepository } from '../infrastructure/database/repositories/prisma-imagen.repository.js';
import { GestionGuiaController } from '../presentation/guia/gestion-guia.controller.js';
import { GuiaController } from '../presentation/guia/guia.controller.js';

// Composition root del catálogo de guías (HU-09, HU-10, HU-11) y de su gestión (HU-13, HU-15).
@Module({
  controllers: [GuiaController, GestionGuiaController],
  providers: [
    { provide: GuiaRepository, useClass: PrismaGuiaRepository },
    { provide: ImagenRepository, useClass: PrismaImagenRepository },
    { provide: GuiaGestionRepository, useClass: PrismaGuiaGestionRepository },
    {
      provide: ListarGuiasGestionUseCase,
      useFactory: (guias: GuiaGestionRepository) =>
        new ListarGuiasGestionUseCase(guias),
      inject: [GuiaGestionRepository],
    },
    {
      provide: ObtenerGuiaGestionUseCase,
      useFactory: (
        ...deps: ConstructorParameters<typeof ObtenerGuiaGestionUseCase>
      ) => new ObtenerGuiaGestionUseCase(...deps),
      inject: [GuiaGestionRepository, ImagenRepository],
    },
    {
      provide: CrearGuiaUseCase,
      useFactory: (...deps: ConstructorParameters<typeof CrearGuiaUseCase>) =>
        new CrearGuiaUseCase(...deps),
      inject: [GuiaGestionRepository, ImagenRepository, GeneradorId],
    },
    {
      provide: EditarGuiaUseCase,
      useFactory: (...deps: ConstructorParameters<typeof EditarGuiaUseCase>) =>
        new EditarGuiaUseCase(...deps),
      inject: [GuiaGestionRepository, ImagenRepository, GeneradorId],
    },
    {
      provide: PublicarGuiaUseCase,
      useFactory: (
        ...deps: ConstructorParameters<typeof PublicarGuiaUseCase>
      ) => new PublicarGuiaUseCase(...deps),
      inject: [GuiaGestionRepository, ImagenRepository, Reloj],
    },
    {
      provide: OcultarGuiaUseCase,
      useFactory: (...deps: ConstructorParameters<typeof OcultarGuiaUseCase>) =>
        new OcultarGuiaUseCase(...deps),
      inject: [GuiaGestionRepository, ImagenRepository],
    },
    {
      provide: ConsultaGuiaRepository,
      useClass: PrismaConsultaGuiaRepository,
    },
    {
      provide: ListarGuiasUseCase,
      useFactory: (guias: GuiaRepository) => new ListarGuiasUseCase(guias),
      inject: [GuiaRepository],
    },
    {
      provide: ObtenerGuiaUseCase,
      useFactory: (guias: GuiaRepository, imagenes: ImagenRepository) =>
        new ObtenerGuiaUseCase(guias, imagenes),
      inject: [GuiaRepository, ImagenRepository],
    },
    {
      provide: RegistrarConsultaGuiaUseCase,
      useFactory: (
        ...deps: ConstructorParameters<typeof RegistrarConsultaGuiaUseCase>
      ) => new RegistrarConsultaGuiaUseCase(...deps),
      inject: [GuiaRepository, ConsultaGuiaRepository, Reloj],
    },
  ],
})
export class GuiaModule {}
