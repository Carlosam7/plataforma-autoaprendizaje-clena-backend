import { Module } from '@nestjs/common';
import { ListarCategoriasUseCase } from '../application/categoria/listar-categorias.use-case.js';
import { CategoriaRepository } from '../domain/categoria/categoria.repository.js';
import { PrismaCategoriaRepository } from '../infrastructure/database/repositories/prisma-categoria.repository.js';
import { CategoriaController } from '../presentation/categoria/categoria.controller.js';

// Composition root: el único sitio que conoce todas las capas. Une el puerto del
// dominio (token CategoriaRepository) con su implementación Prisma y construye el caso de uso.
@Module({
  controllers: [CategoriaController],
  providers: [
    { provide: CategoriaRepository, useClass: PrismaCategoriaRepository },
    {
      provide: ListarCategoriasUseCase,
      useFactory: (categorias: CategoriaRepository) =>
        new ListarCategoriasUseCase(categorias),
      inject: [CategoriaRepository],
    },
  ],
})
export class CategoriaModule {}
