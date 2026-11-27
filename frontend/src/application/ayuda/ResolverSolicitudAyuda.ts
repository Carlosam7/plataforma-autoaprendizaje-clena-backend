import {
  LARGO_MAXIMO_COMENTARIO,
  type SolicitudEnCola,
} from '@/domain/ayuda/types';
import { SolicitudAyudaError } from '@/domain/ayuda/errors';
import type { SolicitudesAyudaRepository } from './ports';

export class ResolverSolicitudAyuda {
  constructor(private readonly repository: SolicitudesAyudaRepository) {}

  ejecutar(
    token: string,
    id: string,
    comentario?: string | null,
  ): Promise<SolicitudEnCola> {
    const limpio = comentario?.trim() ? comentario.trim() : null;
    if (limpio && limpio.length > LARGO_MAXIMO_COMENTARIO) {
      throw new SolicitudAyudaError(
        `El comentario puede tener máximo ${LARGO_MAXIMO_COMENTARIO} letras.`,
        'VALIDACION',
      );
    }
    return this.repository.resolver(token, id, limpio);
  }
}
