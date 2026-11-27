import { Injectable } from '@nestjs/common';
import { EstadoBaseDatos } from '../../application/sistema/estado-base-datos.port.js';
import { PrismaService } from './prisma.service.js';

/** Máximo que espera el healthcheck: el de Docker se rinde a los 5 s. */
const ESPERA_MAXIMA_MS = 2_000;

@Injectable()
export class PrismaEstadoBaseDatos implements EstadoBaseDatos {
  constructor(private readonly prisma: PrismaService) {}

  async disponible(): Promise<boolean> {
    let temporizador: NodeJS.Timeout | undefined;
    const vencido = new Promise<false>((resolve) => {
      temporizador = setTimeout(() => resolve(false), ESPERA_MAXIMA_MS);
    });
    try {
      return await Promise.race([
        this.prisma.$queryRaw`SELECT 1`.then(() => true),
        vencido,
      ]);
    } catch {
      return false;
    } finally {
      clearTimeout(temporizador);
    }
  }
}
