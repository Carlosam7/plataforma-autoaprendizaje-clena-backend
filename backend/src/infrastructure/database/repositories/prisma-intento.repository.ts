import { Injectable } from '@nestjs/common';
import { Intento } from '../../../domain/practica/intento.js';
import { IntentoRepository } from '../../../domain/practica/intento.repository.js';
import { PrismaService } from '../prisma.service.js';
import {
  aActividad,
  INCLUIR_PREGUNTAS,
} from './prisma-actividad.repository.js';

@Injectable()
export class PrismaIntentoRepository implements IntentoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crear(intento: Intento): Promise<void> {
    await this.prisma.intento.create({
      data: {
        id: intento.id,
        actividadId: intento.actividadId,
        usuarioId: intento.usuarioId,
        totalPreguntas: intento.totalPreguntas,
        iniciadoEn: intento.iniciadoEn,
      },
    });
  }

  modificar<T>(id: string, cambio: (intento: Intento) => T): Promise<T | null> {
    return this.prisma.$transaction(async (tx) => {
      // FOR UPDATE: si llegan dos respuestas al mismo intento a la vez (doble clic), la
      // segunda espera a que la primera termine y ve su respuesta ya guardada.
      const bloqueado = await tx.$queryRaw<
        unknown[]
      >`SELECT 1 FROM intento WHERE id = ${id}::uuid FOR UPDATE`;
      if (bloqueado.length === 0) return null;

      const fila = await tx.intento.findUniqueOrThrow({
        where: { id },
        include: {
          actividad: { include: INCLUIR_PREGUNTAS },
          respuestas: { orderBy: { respondidaEn: 'asc' } },
        },
      });
      const intento = Intento.reconstituir({
        id: fila.id,
        actividad: aActividad(fila.actividad),
        usuarioId: fila.usuarioId,
        respuestas: fila.respuestas.map(
          ({ preguntaId, opcionId, esCorrecta, respondidaEn }) => ({
            preguntaId,
            opcionId,
            esCorrecta,
            respondidaEn,
          }),
        ),
        iniciadoEn: fila.iniciadoEn,
        finalizadoEn: fila.finalizadoEn,
      });

      const resultado = cambio(intento);

      const nuevas = intento.respuestas.slice(fila.respuestas.length);
      if (nuevas.length > 0) {
        await tx.respuestaIntento.createMany({
          data: nuevas.map((r) => ({ intentoId: id, ...r })),
        });
      }
      const calificacion = intento.calificar();
      const terminado = intento.finalizadoEn !== null;
      await tx.intento.update({
        where: { id },
        data: {
          respuestasCorrectas: calificacion.respuestasCorrectas,
          porcentaje: terminado ? calificacion.porcentaje : null,
          aprobado: terminado ? calificacion.aprobado : null,
          finalizadoEn: intento.finalizadoEn,
        },
      });
      return resultado;
    });
  }
}
