import { Injectable } from '@nestjs/common';
import {
  SesionActiva,
  SesionRepository,
} from '../../../domain/auth/sesion.repository.js';
import { PrismaService } from '../prisma.service.js';

/** Las sesiones son las filas de refresh_token; el `sid` del access token es su id. */
@Injectable()
export class PrismaSesionRepository implements SesionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarActiva(
    sesionId: string,
    ahora: Date,
  ): Promise<SesionActiva | null> {
    const fila = await this.prisma.refreshToken.findFirst({
      where: { id: sesionId, revocadoEn: null, expiraEn: { gt: ahora } },
      select: {
        id: true,
        usuarioPublicoId: true,
        personal: { select: { id: true, rol: true, activo: true } },
      },
    });
    if (!fila) return null;

    if (fila.usuarioPublicoId) {
      return {
        sesionId: fila.id,
        usuarioId: fila.usuarioPublicoId,
        rol: 'USUARIO_PUBLICO',
      };
    }
    if (!fila.personal?.activo) return null;
    return {
      sesionId: fila.id,
      usuarioId: fila.personal.id,
      rol: fila.personal.rol,
    };
  }
}
