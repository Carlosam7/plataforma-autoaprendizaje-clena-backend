import { Injectable } from '@nestjs/common';
import { TemaAyuda } from '../../../domain/ayuda/solicitud-ayuda.js';
import {
  Agregados,
  ConsultasDeCategoria,
  ConsultasDeGuia,
  EstadisticaRepository,
} from '../../../domain/estadistica/estadistica.repository.js';
import { PrismaService } from '../prisma.service.js';

/**
 * Todo se cuenta en PostgreSQL (GROUP BY), nunca trayendo cada evento a Node. Las
 * consultas usan consulta_guia_consultada_en_idx y las solicitudes
 * solicitud_ayuda_creada_en_tema_idx. Los ${} de $queryRaw son parámetros, no texto.
 */
@Injectable()
export class PrismaEstadisticaRepository implements EstadisticaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async agregar(
    inicio: Date,
    fin: Date,
    limiteTop: number,
  ): Promise<Agregados> {
    const enPeriodo = { gte: inicio, lt: fin };
    const [consultasGuias, topGuias, consultasPorCategoria, porTema] =
      await this.prisma.$transaction([
        this.prisma.consultaGuia.count({ where: { consultadaEn: enPeriodo } }),
        // Sin filtrar por estado: una guía oculta conserva sus consultas históricas.
        this.prisma.$queryRaw<ConsultasDeGuia[]>`
          SELECT g.slug, g.titulo, count(*)::int AS consultas
          FROM consulta_guia c
          JOIN guia g ON g.id = c.guia_id
          WHERE c.consultada_en >= ${inicio} AND c.consultada_en < ${fin}
          GROUP BY g.id, g.slug, g.titulo
          ORDER BY consultas DESC, g.slug ASC
          LIMIT ${limiteTop}`,
        this.prisma.$queryRaw<ConsultasDeCategoria[]>`
          SELECT cat.slug, cat.nombre, count(*)::int AS consultas
          FROM consulta_guia c
          JOIN guia g ON g.id = c.guia_id
          JOIN categoria cat ON cat.id = g.categoria_id
          WHERE c.consultada_en >= ${inicio} AND c.consultada_en < ${fin}
          GROUP BY cat.id, cat.slug, cat.nombre
          ORDER BY consultas DESC, cat.slug ASC`,
        this.prisma.$queryRaw<{ tema: TemaAyuda; cantidad: number }[]>`
          SELECT tema::text AS tema, count(*)::int AS cantidad
          FROM solicitud_ayuda
          WHERE creada_en >= ${inicio} AND creada_en < ${fin}
          GROUP BY tema
          ORDER BY cantidad DESC, tema::text ASC`,
      ]);
    return {
      consultasGuias,
      solicitudesAyuda: porTema.reduce((total, t) => total + t.cantidad, 0),
      topGuias,
      consultasPorCategoria,
      solicitudesPorTema: porTema,
    };
  }
}
