import { Injectable } from '@nestjs/common';
import {
  AvisoPrivacidad,
  AvisoPrivacidadRepository,
} from '../../../domain/auth/aviso-privacidad.repository.js';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class PrismaAvisoPrivacidadRepository implements AvisoPrivacidadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async vigente(ahora: Date): Promise<AvisoPrivacidad | null> {
    const fila = await this.prisma.avisoPrivacidad.findFirst({
      where: { vigenteDesde: { lte: ahora } },
      orderBy: { vigenteDesde: 'desc' },
    });
    return fila
      ? {
          version: fila.version,
          contenido: fila.contenido,
          vigenteDesde: fila.vigenteDesde,
        }
      : null;
  }
}
