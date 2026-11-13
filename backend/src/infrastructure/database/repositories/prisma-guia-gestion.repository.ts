import { Injectable } from '@nestjs/common';
import { ContenidoPaso } from '../../../domain/guia/contenido-paso.js';
import { GuiaEditable } from '../../../domain/guia/guia-editable.js';
import {
  CriterioGestionGuias,
  GuiaGestionada,
  GuiaGestionRepository,
} from '../../../domain/guia/guia-gestion.repository.js';
import { Pagina } from '../../../domain/shared/pagina.js';
import { Prisma } from '../prisma/generated/client.js';
import { PrismaService } from '../prisma.service.js';

const INCLUIR = {
  categoria: { select: { slug: true } },
  pasos: { orderBy: { orden: 'asc' } },
  creadaPor: { select: { nombre: true } },
  actualizadaPor: { select: { nombre: true } },
} satisfies Prisma.GuiaInclude;

@Injectable()
export class PrismaGuiaGestionRepository implements GuiaGestionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listar({
    estado,
    categoria,
    ordenarPor,
    direccion,
    pagina,
    limite,
  }: CriterioGestionGuias): Promise<Pagina<GuiaGestionada>> {
    const where: Prisma.GuiaWhereInput = {
      estado,
      ...(categoria ? { categoria: { slug: categoria } } : {}),
    };
    // Una transacción para que la página y el total vean los mismos datos.
    const [filas, total] = await this.prisma.$transaction([
      this.prisma.guia.findMany({
        where,
        include: INCLUIR,
        // El id desempata para que la paginación sea estable.
        orderBy: [{ [ordenarPor]: direccion }, { id: 'asc' }],
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      this.prisma.guia.count({ where }),
    ]);
    return { elementos: filas.map(aGestionada), total };
  }

  async buscar(slug: string): Promise<GuiaGestionada | null> {
    const fila = await this.prisma.guia.findUnique({
      where: { slug },
      include: INCLUIR,
    });
    return fila && aGestionada(fila);
  }

  async existeSlug(slug: string): Promise<boolean> {
    return (await this.prisma.guia.count({ where: { slug } })) > 0;
  }

  async existeCategoria(slug: string): Promise<boolean> {
    return (await this.prisma.categoria.count({ where: { slug } })) > 0;
  }

  async guardar(guia: GuiaEditable): Promise<void> {
    const { categoriaSlug, ...datos } = guia.datos;
    const cambios = {
      ...datos,
      estado: guia.estado,
      publicadaEn: guia.publicadaEn,
      categoria: { connect: { slug: categoriaSlug } },
      actualizadaPor: { connect: { id: guia.actualizadaPorId } },
    };
    await this.prisma.$transaction(async (tx) => {
      await tx.guia.upsert({
        where: { id: guia.id },
        create: {
          id: guia.id,
          slug: guia.slug,
          ...cambios,
          creadaPor: { connect: { id: guia.creadaPorId } },
        },
        update: cambios,
      });
      await tx.paso.deleteMany({
        where: { guiaId: guia.id, id: { notIn: guia.pasos.map((p) => p.id) } },
      });
      // Al reordenar, dos pasos comparten `orden` por un momento. No falla porque la
      // UNIQUE (guia_id, orden) es diferible: se comprueba al terminar la transacción.
      for (const [i, paso] of guia.pasos.entries()) {
        const datosPaso = {
          orden: i + 1,
          titulo: paso.titulo,
          contenido: paso.contenido.aJson(),
        };
        await tx.paso.upsert({
          where: { id: paso.id },
          create: { id: paso.id, guiaId: guia.id, ...datosPaso },
          update: datosPaso,
        });
      }
    });
  }
}

function aGestionada(
  f: Prisma.GuiaGetPayload<{ include: typeof INCLUIR }>,
): GuiaGestionada {
  return {
    guia: GuiaEditable.reconstituir({
      id: f.id,
      slug: f.slug,
      titulo: f.titulo,
      objetivo: f.objetivo,
      descripcion: f.descripcion,
      categoriaSlug: f.categoria.slug,
      nivel: f.nivel,
      duracionEstimadaMin: f.duracionEstimadaMin,
      palabrasClave: f.palabrasClave,
      estado: f.estado,
      publicadaEn: f.publicadaEn,
      creadaPorId: f.creadaPorId,
      actualizadaPorId: f.actualizadaPorId,
      pasos: f.pasos.map((p) => ({
        id: p.id,
        titulo: p.titulo,
        contenido: ContenidoPaso.desdeJson(p.contenido),
      })),
    }),
    creadaPor: f.creadaPor.nombre,
    actualizadaPor: f.actualizadaPor.nombre,
    creadoEn: f.creadoEn,
    actualizadoEn: f.actualizadoEn,
  };
}
