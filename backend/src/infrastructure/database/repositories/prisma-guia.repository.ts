import { Injectable } from '@nestjs/common';
import { Guia } from '../../../domain/guia/guia.js';
import {
  CriterioGuiasPublicadas,
  GuiaRepository,
} from '../../../domain/guia/guia.repository.js';
import { Pagina } from '../../../domain/shared/pagina.js';
import { Prisma } from '../prisma/generated/client.js';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class PrismaGuiaRepository implements GuiaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listarPublicadas({
    categoria,
    ordenarPor,
    direccion,
    pagina,
    limite,
  }: CriterioGuiasPublicadas): Promise<Pagina<Guia>> {
    const where: Prisma.GuiaWhereInput = {
      estado: 'PUBLICADA',
      ...(categoria ? { categoria: { slug: categoria } } : {}),
    };
    // Una transacción para que la página y el total vean los mismos datos.
    const [filas, total] = await this.prisma.$transaction([
      this.prisma.guia.findMany({
        where,
        include: { categoria: { select: { slug: true } } },
        // El id desempata para que la paginación sea estable.
        orderBy: [{ [ordenarPor]: direccion }, { id: 'asc' }],
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      this.prisma.guia.count({ where }),
    ]);
    return {
      elementos: filas.map(
        (f) =>
          new Guia(
            f.id,
            f.slug,
            f.categoria.slug,
            f.titulo,
            f.objetivo,
            f.nivel,
            f.duracionEstimadaMin,
            f.estado,
          ),
      ),
      total,
    };
  }
}
