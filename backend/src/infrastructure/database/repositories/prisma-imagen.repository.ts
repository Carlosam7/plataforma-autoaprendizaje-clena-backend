import { Injectable } from '@nestjs/common';
import { ImagenRepository } from '../../../domain/imagen/imagen.repository.js';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class PrismaImagenRepository implements ImagenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async urlsPorId(ids: readonly string[]): Promise<Map<string, string>> {
    const filas = await this.prisma.imagen.findMany({
      where: { id: { in: [...ids] } },
      select: { id: true, url: true },
    });
    return new Map(filas.map((f) => [f.id, f.url]));
  }
}
