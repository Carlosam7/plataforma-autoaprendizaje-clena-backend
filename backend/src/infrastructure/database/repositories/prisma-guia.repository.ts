import { Injectable } from '@nestjs/common';
import { ContenidoPaso } from '../../../domain/guia/contenido-paso.js';
import { Guia } from '../../../domain/guia/guia.js';
import {
  CriterioGuiasPublicadas,
  DetalleGuia,
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
    return { elementos: filas.map(aGuia), total };
  }

  async buscarPublicada(slug: string): Promise<DetalleGuia | null> {
    const fila = await this.prisma.guia.findFirst({
      where: { slug, estado: 'PUBLICADA' },
      include: {
        categoria: { select: { slug: true } },
        pasos: { orderBy: { orden: 'asc' } },
        actividad: { select: { _count: { select: { preguntas: true } } } },
      },
    });
    if (!fila) return null;
    return {
      guia: aGuia(fila),
      pasos: fila.pasos.map((p) => ({
        orden: p.orden,
        titulo: p.titulo,
        contenido: ContenidoPaso.desdeJson(p.contenido),
      })),
      // Una actividad sin preguntas todavía no se puede hacer (HU-21).
      tieneActividad: (fila.actividad?._count.preguntas ?? 0) > 0,
    };
  }

  async buscarIdPublicada(slug: string): Promise<string | null> {
    const fila = await this.prisma.guia.findFirst({
      where: { slug, estado: 'PUBLICADA' },
      select: { id: true },
    });
    return fila?.id ?? null;
  }
}

function aGuia(
  f: Prisma.GuiaGetPayload<{
    include: { categoria: { select: { slug: true } } };
  }>,
): Guia {
  return new Guia(
    f.id,
    f.slug,
    f.categoria.slug,
    f.titulo,
    f.objetivo,
    f.nivel,
    f.duracionEstimadaMin,
    f.estado,
  );
}
