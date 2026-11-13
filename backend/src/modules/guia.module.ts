import { Module } from '@nestjs/common';
import { ListarGuiasUseCase } from '../application/guia/listar-guias.use-case.js';
import { ObtenerGuiaUseCase } from '../application/guia/obtener-guia.use-case.js';
import { RegistrarConsultaGuiaUseCase } from '../application/guia/registrar-consulta-guia.use-case.js';
import { Reloj } from '../application/shared/reloj.port.js';
import { ConsultaGuiaRepository } from '../domain/guia/consulta-guia.repository.js';
import { GuiaRepository } from '../domain/guia/guia.repository.js';
import { ImagenRepository } from '../domain/imagen/imagen.repository.js';
import { PrismaConsultaGuiaRepository } from '../infrastructure/database/repositories/prisma-consulta-guia.repository.js';
import { PrismaGuiaRepository } from '../infrastructure/database/repositories/prisma-guia.repository.js';
import { PrismaImagenRepository } from '../infrastructure/database/repositories/prisma-imagen.repository.js';
import { GuiaController } from '../presentation/guia/guia.controller.js';

// Composition root del catálogo de guías (HU-09, HU-10).
@Module({
  controllers: [GuiaController],
  providers: [
    { provide: GuiaRepository, useClass: PrismaGuiaRepository },
    { provide: ImagenRepository, useClass: PrismaImagenRepository },
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
