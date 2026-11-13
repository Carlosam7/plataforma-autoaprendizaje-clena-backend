import { Injectable } from '@nestjs/common';
import {
  EstadoSolicitud,
  SolicitudAyuda,
} from '../../../domain/ayuda/solicitud-ayuda.js';
import {
  CriterioSolicitudes,
  SolicitudAyudaRepository,
  SolicitudEnCola,
} from '../../../domain/ayuda/solicitud-ayuda.repository.js';
import { Pagina } from '../../../domain/shared/pagina.js';
import { descripcionConflictoUnicidad } from '../errores-prisma.js';
import { Prisma } from '../prisma/generated/client.js';
import { PrismaService } from '../prisma.service.js';

/** Lo que el monitor ve junto a la solicitud: la guía, el paso y quién la atiende. */
const INCLUIR_EN_COLA = {
  guia: { select: { slug: true, titulo: true } },
  paso: { select: { orden: true } },
  atendidaPor: { select: { nombre: true } },
} satisfies Prisma.SolicitudAyudaInclude;

@Injectable()
export class PrismaSolicitudAyudaRepository implements SolicitudAyudaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crear(solicitud: SolicitudAyuda): Promise<boolean> {
    try {
      await this.prisma.solicitudAyuda.create({
        data: {
          id: solicitud.id,
          equipo: solicitud.equipo,
          tema: solicitud.tema,
          estado: solicitud.estado,
          guiaId: solicitud.guiaId,
          pasoId: solicitud.pasoId,
          usuarioId: solicitud.usuarioId,
          creadaEn: solicitud.creadaEn,
        },
      });
      return true;
    } catch (error) {
      // La única unicidad que puede chocar es solicitud_ayuda_equipo_activa_idx (migración
      // inicial): el equipo ya tiene una solicitud activa.
      if (descripcionConflictoUnicidad(error) === null) throw error;
      return false;
    }
  }

  async buscarActivaDeEquipo(equipo: string): Promise<SolicitudAyuda | null> {
    // La misma expresión del índice único parcial; Prisma no sabe escribir lower(trim()).
    const [activa] = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM solicitud_ayuda
      WHERE lower(trim(equipo)) = lower(trim(${equipo}))
        AND estado IN ('PENDIENTE', 'EN_ATENCION')
      LIMIT 1`;
    return activa ? this.buscarPorId(activa.id) : null;
  }

  async buscarPorId(id: string): Promise<SolicitudAyuda | null> {
    const fila = await this.prisma.solicitudAyuda.findUnique({ where: { id } });
    return fila && aSolicitud(fila);
  }

  async buscarEnCola(id: string): Promise<SolicitudEnCola | null> {
    const fila = await this.prisma.solicitudAyuda.findUnique({
      where: { id },
      include: INCLUIR_EN_COLA,
    });
    return fila && aEnCola(fila);
  }

  async guardar(
    solicitud: SolicitudAyuda,
    estadoAnterior: EstadoSolicitud,
  ): Promise<boolean> {
    // El estado anterior va en el WHERE: es una sola operación en la base de datos, así
    // que de dos monitores que toman la misma solicitud a la vez solo uno la cambia.
    const { count } = await this.prisma.solicitudAyuda.updateMany({
      where: { id: solicitud.id, estado: estadoAnterior },
      data: {
        estado: solicitud.estado,
        atendidaPorId: solicitud.atendidaPorId,
        tomadaEn: solicitud.tomadaEn,
        resueltaEn: solicitud.resueltaEn,
        comentarioResolucion: solicitud.comentarioResolucion,
        canceladaEn: solicitud.canceladaEn,
      },
    });
    return count > 0;
  }

  async posicionEnCola(solicitud: SolicitudAyuda): Promise<number> {
    const antes = await this.prisma.solicitudAyuda.count({
      where: { estado: 'PENDIENTE', creadaEn: { lt: solicitud.creadaEn } },
    });
    return antes + 1;
  }

  async buscarContexto(
    guiaSlug: string,
    pasoOrden?: number,
  ): Promise<{ guiaId: string; pasoId: string | null } | null> {
    const guia = await this.prisma.guia.findFirst({
      where: { slug: guiaSlug, estado: 'PUBLICADA' },
      select: {
        id: true,
        // Los pasos se numeran desde 1: con 0 no trae ninguno.
        pasos: { where: { orden: pasoOrden ?? 0 }, select: { id: true } },
      },
    });
    return guia && { guiaId: guia.id, pasoId: guia.pasos[0]?.id ?? null };
  }

  async listar({
    estado,
    tema,
    ordenarPor,
    direccion,
    pagina,
    limite,
  }: CriterioSolicitudes): Promise<Pagina<SolicitudEnCola>> {
    const where: Prisma.SolicitudAyudaWhereInput = { estado, tema };
    // Una transacción para que la página y el total vean los mismos datos.
    const [filas, total] = await this.prisma.$transaction([
      this.prisma.solicitudAyuda.findMany({
        where,
        include: INCLUIR_EN_COLA,
        // El id desempata para que la paginación sea estable.
        orderBy: [{ [ordenarPor]: direccion }, { id: 'asc' }],
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      this.prisma.solicitudAyuda.count({ where }),
    ]);
    return { elementos: filas.map(aEnCola), total };
  }
}

function aSolicitud(
  f: Prisma.SolicitudAyudaGetPayload<object>,
): SolicitudAyuda {
  return SolicitudAyuda.reconstituir({
    id: f.id,
    equipo: f.equipo,
    tema: f.tema,
    estado: f.estado,
    guiaId: f.guiaId,
    pasoId: f.pasoId,
    usuarioId: f.usuarioId,
    creadaEn: f.creadaEn,
    atendidaPorId: f.atendidaPorId,
    tomadaEn: f.tomadaEn,
    resueltaEn: f.resueltaEn,
    comentarioResolucion: f.comentarioResolucion,
    canceladaEn: f.canceladaEn,
  });
}

function aEnCola(
  f: Prisma.SolicitudAyudaGetPayload<{ include: typeof INCLUIR_EN_COLA }>,
): SolicitudEnCola {
  return {
    solicitud: aSolicitud(f),
    guia: f.guia,
    pasoOrden: f.paso?.orden ?? null,
    atendidaPor: f.atendidaPor?.nombre ?? null,
  };
}
