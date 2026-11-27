import {
  LARGO_MAXIMO_COMENTARIO,
  type SolicitudEnCola,
} from '@/domain/ayuda/solicitudCola';
import { ColaSolicitudError } from '@/domain/ayuda/erroresCola';
import type { SolicitudesColaRepository } from './colaPorts';

export class ResolverSolicitudAyuda {
  constructor(private readonly repository: SolicitudesColaRepository) {}

  ejecutar(
    token: string,
    id: string,
    comentario?: string | null,
  ): Promise<SolicitudEnCola> {
    const limpio = comentario?.trim() ? comentario.trim() : null;
    if (limpio && limpio.length > LARGO_MAXIMO_COMENTARIO) {
      throw new ColaSolicitudError(
        `El comentario puede tener máximo ${LARGO_MAXIMO_COMENTARIO} letras.`,
        'VALIDACION',
      );
    }
    return this.repository.resolver(token, id, limpio);
  }
}
