import { Injectable } from '@nestjs/common';
import { Actividad } from '../../../domain/practica/actividad.js';
import { ActividadRepository } from '../../../domain/practica/actividad.repository.js';
import { Prisma } from '../prisma/generated/client.js';
import { PrismaService } from '../prisma.service.js';

/** La actividad con sus preguntas y opciones en orden (lo comparten los dos repositorios). */
export const INCLUIR_PREGUNTAS = {
  preguntas: {
    orderBy: { orden: 'asc' },
    include: { opciones: { orderBy: { orden: 'asc' } } },
  },
} satisfies Prisma.ActividadInclude;

export function aActividad(
  f: Prisma.ActividadGetPayload<{ include: typeof INCLUIR_PREGUNTAS }>,
): Actividad {
  return {
    id: f.id,
    titulo: f.titulo,
    porcentajeAprobacion: f.porcentajeAprobacion,
    preguntas: f.preguntas.map((p) => ({
      id: p.id,
      enunciado: p.enunciado,
      explicacion: p.explicacion,
      opciones: p.opciones.map(({ id, texto, esCorrecta }) => ({
        id,
        texto,
        esCorrecta,
      })),
    })),
  };
}

@Injectable()
export class PrismaActividadRepository implements ActividadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarDeGuiaPublicada(slug: string): Promise<Actividad | null> {
    const fila = await this.prisma.actividad.findFirst({
      where: {
        guia: { slug, estado: 'PUBLICADA' },
        preguntas: { some: {} },
      },
      include: INCLUIR_PREGUNTAS,
    });
    return fila && aActividad(fila);
  }
}
