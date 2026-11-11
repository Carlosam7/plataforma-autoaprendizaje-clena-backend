import { Injectable } from '@nestjs/common';
import { Categoria } from '../../../domain/categoria/categoria.js';
import {
  CategoriaRepository,
  CriterioCategorias,
} from '../../../domain/categoria/categoria.repository.js';
import { Pagina } from '../../../domain/shared/pagina.js';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class PrismaCategoriaRepository implements CategoriaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listar({
    q,
    ordenarPor,
    direccion,
    pagina,
    limite,
  }: CriterioCategorias): Promise<Pagina<Categoria>> {
    // También en el slug: no lleva tildes, así "busqueda" encuentra "Búsqueda en internet".
    const where = q
      ? {
          OR: [
            { nombre: { contains: q, mode: 'insensitive' as const } },
            { slug: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // Una transacción para que la página y el total vean los mismos datos.
    const [filas, total] = await this.prisma.$transaction([
      this.prisma.categoria.findMany({
        where,
        orderBy: { [ordenarPor]: direccion },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      this.prisma.categoria.count({ where }),
    ]);
    return {
      elementos: filas.map(
        (f) => new Categoria(f.id, f.slug, f.nombre, f.icono, f.orden),
      ),
      total,
    };
  }
}
