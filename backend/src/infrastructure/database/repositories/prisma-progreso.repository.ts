import { Injectable } from '@nestjs/common';
import { AvanceGuia } from '../../../domain/progreso/avance-guia.js';
import {
  CriterioProgreso,
  ProgresoRepository,
} from '../../../domain/progreso/progreso.repository.js';
import { Pagina } from '../../../domain/shared/pagina.js';
import { Prisma } from '../prisma/generated/client.js';
import { PrismaService } from '../prisma.service.js';

/** La guía junto con lo que ese usuario lleva en ella. */
function conAvanceDe(usuarioId: string) {
  return {
    categoria: { select: { slug: true } },
    pasos: {
      select: { lecturas: { where: { usuarioId }, select: { pasoId: true } } },
    },
    actividad: {
      select: {
        _count: { select: { preguntas: true } },
        // Con un intento aprobado basta.
        intentos: {
          where: { usuarioId, aprobado: true },
          select: { id: true },
          take: 1,
        },
      },
    },
    progresos: {
      where: { usuarioId },
      select: { completadaEn: true, ultimoPaso: { select: { orden: true } } },
    },
  } satisfies Prisma.GuiaInclude;
}

type FilaAvance = Prisma.GuiaGetPayload<{
  include: ReturnType<typeof conAvanceDe>;
}>;

@Injectable()
export class PrismaProgresoRepository implements ProgresoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listar(
    usuarioId: string,
    { categoria, ordenarPor, direccion, pagina, limite }: CriterioProgreso,
  ): Promise<Pagina<AvanceGuia>> {
    const where: Prisma.GuiaWhereInput = {
      estado: 'PUBLICADA',
      ...(categoria ? { categoria: { slug: categoria } } : {}),
    };
    // Una transacción para que la página y el total vean los mismos datos.
    const [filas, total] = await this.prisma.$transaction([
      this.prisma.guia.findMany({
        where,
        include: conAvanceDe(usuarioId),
        // El id desempata para que la paginación sea estable.
        orderBy: [{ [ordenarPor]: direccion }, { id: 'asc' }],
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      this.prisma.guia.count({ where }),
    ]);
    return { elementos: filas.map(aAvance), total };
  }

  async avance(usuarioId: string, guiaId: string): Promise<AvanceGuia | null> {
    const fila = await this.prisma.guia.findUnique({
      where: { id: guiaId },
      include: conAvanceDe(usuarioId),
    });
    return fila && aAvance(fila);
  }

  async buscarPaso(
    guiaSlug: string,
    orden: number,
  ): Promise<{ guiaId: string; pasoId: string } | null> {
    const paso = await this.prisma.paso.findFirst({
      where: { orden, guia: { slug: guiaSlug, estado: 'PUBLICADA' } },
      select: { id: true, guiaId: true },
    });
    return paso && { guiaId: paso.guiaId, pasoId: paso.id };
  }

  async registrarLectura({
    usuarioId,
    guiaId,
    pasoId,
    leidoEn,
  }: {
    usuarioId: string;
    guiaId: string;
    pasoId: string;
    leidoEn: Date;
  }): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.pasoLeido.upsert({
        where: { usuarioId_pasoId: { usuarioId, pasoId } },
        create: { usuarioId, pasoId, leidoEn },
        // Ya lo había leído: se conserva la fecha de la primera vez.
        update: {},
      }),
      this.prisma.progresoGuia.upsert({
        where: { usuarioId_guiaId: { usuarioId, guiaId } },
        create: { usuarioId, guiaId, ultimoPasoId: pasoId },
        update: { ultimoPasoId: pasoId },
      }),
    ]);
  }

  async marcarCompletada(
    usuarioId: string,
    guiaId: string,
    completadaEn: Date,
  ): Promise<void> {
    const completada = { completada: true, completadaEn };
    await this.prisma.progresoGuia.upsert({
      where: { usuarioId_guiaId: { usuarioId, guiaId } },
      create: { usuarioId, guiaId, ...completada },
      update: completada,
    });
  }

  async guiaDeActividad(actividadId: string): Promise<string | null> {
    const actividad = await this.prisma.actividad.findUnique({
      where: { id: actividadId },
      select: { guiaId: true },
    });
    return actividad?.guiaId ?? null;
  }
}

function aAvance(f: FilaAvance): AvanceGuia {
  const [progreso] = f.progresos;
  return new AvanceGuia({
    guiaId: f.id,
    slug: f.slug,
    categoriaSlug: f.categoria.slug,
    titulo: f.titulo,
    nivel: f.nivel,
    totalPasos: f.pasos.length,
    pasosLeidos: f.pasos.filter((p) => p.lecturas.length > 0).length,
    tieneActividad: (f.actividad?._count.preguntas ?? 0) > 0,
    actividadAprobada: (f.actividad?.intentos.length ?? 0) > 0,
    ultimoPaso: progreso?.ultimoPaso?.orden ?? null,
    completadaEn: progreso?.completadaEn ?? null,
  });
}
