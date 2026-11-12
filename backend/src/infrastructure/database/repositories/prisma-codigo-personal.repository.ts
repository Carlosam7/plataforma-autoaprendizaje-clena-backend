import { Injectable } from '@nestjs/common';
import {
  CodigoPersonal,
  PropositoCodigoPersonal,
} from '../../../domain/personal/codigo-personal.js';
import { CodigoPersonalRepository } from '../../../domain/personal/codigo-personal.repository.js';
import { PrismaService } from '../prisma.service.js';

/** Códigos del personal en la tabla codigo_verificacion (con personal_id, sin metodo_inicio_id). */
@Injectable()
export class PrismaCodigoPersonalRepository implements CodigoPersonalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ultimoSinUsar(
    personalId: string,
    proposito: PropositoCodigoPersonal,
  ): Promise<CodigoPersonal | null> {
    const fila = await this.prisma.codigoVerificacion.findFirst({
      where: { personalId, proposito, usadoEn: null },
      orderBy: { creadoEn: 'desc' },
    });
    if (!fila) return null;
    return CodigoPersonal.reconstituir({
      id: fila.id,
      personalId,
      proposito,
      codigoHash: fila.codigoHash,
      intentosFallidos: fila.intentos,
      creadoEn: fila.creadoEn,
      expiraEn: fila.expiraEn,
      usadoEn: fila.usadoEn,
    });
  }

  async emitir(codigo: CodigoPersonal): Promise<void> {
    await this.prisma.$transaction([
      // Solo vale el último código enviado.
      this.prisma.codigoVerificacion.updateMany({
        where: {
          personalId: codigo.personalId,
          proposito: codigo.proposito,
          usadoEn: null,
        },
        data: { usadoEn: codigo.creadoEn },
      }),
      this.prisma.codigoVerificacion.create({
        data: {
          id: codigo.id,
          personalId: codigo.personalId,
          proposito: codigo.proposito,
          codigoHash: codigo.codigoHash,
          intentos: codigo.intentosFallidos,
          expiraEn: codigo.expiraEn,
          creadoEn: codigo.creadoEn,
        },
      }),
    ]);
  }

  async reservarIntento(
    codigoId: string,
    maxIntentos: number,
  ): Promise<boolean> {
    const { count } = await this.prisma.codigoVerificacion.updateMany({
      where: { id: codigoId, usadoEn: null, intentos: { lt: maxIntentos } },
      data: { intentos: { increment: 1 } },
    });
    return count > 0;
  }

  async actualizar(codigo: CodigoPersonal): Promise<void> {
    await this.prisma.codigoVerificacion.update({
      where: { id: codigo.id },
      data: { usadoEn: codigo.usadoEn },
    });
  }
}
