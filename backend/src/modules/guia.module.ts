import { Module } from '@nestjs/common';
import { ListarGuiasUseCase } from '../application/guia/listar-guias.use-case.js';
import { GuiaRepository } from '../domain/guia/guia.repository.js';
import { PrismaGuiaRepository } from '../infrastructure/database/repositories/prisma-guia.repository.js';
import { GuiaController } from '../presentation/guia/guia.controller.js';

// Composition root del catálogo de guías (HU-09).
@Module({
  controllers: [GuiaController],
  providers: [
    { provide: GuiaRepository, useClass: PrismaGuiaRepository },
    {
      provide: ListarGuiasUseCase,
      useFactory: (guias: GuiaRepository) => new ListarGuiasUseCase(guias),
      inject: [GuiaRepository],
    },
  ],
})
export class GuiaModule {}
