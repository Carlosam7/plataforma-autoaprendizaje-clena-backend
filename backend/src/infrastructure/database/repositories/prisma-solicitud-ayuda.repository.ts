import { Injectable } from '@nestjs/common';
import { SolicitudAyuda } from '../../../domain/ayuda/solicitud-ayuda.js';
import {
  CriterioSolicitudes,
  SolicitudAyudaRepository,
  SolicitudEnCola,
} from '../../../domain/ayuda/solicitud-ayuda.repository.js';
import { Pagina } from '../../../domain/shared/pagina.js';
import { descripcionConflictoUnicidad } from '../errores-prisma.js';
import { Prisma } from '../prisma/generated/client.js';
import { PrismaService } from '../prisma.service.js';

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

  async guardar(solicitud: SolicitudAyuda): Promise<void> {
    await this.prisma.solicitudAyuda.update({
      where: { id: solicitud.id },
      data: { estado: solicitud.estado, canceladaEn: solicitud.canceladaEn },
    });
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
        include: {
          guia: { select: { slug: true, titulo: true } },
          paso: { select: { orden: true } },
        },
        // El id desempata para que la paginación sea estable.
        orderBy: [{ [ordenarPor]: direccion }, { id: 'asc' }],
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      this.prisma.solicitudAyuda.count({ where }),
    ]);
    return {
      elementos: filas.map((f) => ({
        solicitud: aSolicitud(f),
        guia: f.guia,
        pasoOrden: f.paso?.orden ?? null,
      })),
      total,
    };
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
    canceladaEn: f.canceladaEn,
  });
}
