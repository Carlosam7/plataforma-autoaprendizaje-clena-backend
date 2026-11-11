import { Module } from '@nestjs/common';
import { CategoriaController } from './categoria.controller.js';
import { ListarCategoriasUseCase } from '../../application/categoria/listar-categorias.use-case.js';
import { CategoriaRepository } from '../../domain/categoria/categoria.repository.js';
import { PrismaCategoriaRepository } from '../../infrastructure/database/repositories/prisma-categoria.repository.js';

@Module({
  controllers: [CategoriaController],
  providers: [
    ListarCategoriasUseCase,
    { provide: CategoriaRepository, useClass: PrismaCategoriaRepository },
  ],
})
export class CategoriaModule {}
