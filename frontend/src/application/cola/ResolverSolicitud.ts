import type { ColaAyudaRepository } from './ports';
import { PersonalError } from '@/domain/personal/errors';
import {
  MAX_COMENTARIO_RESOLUCION,
  type SolicitudEnCola,
} from '@/domain/cola/types';

/** HU-30: quien tomó la solicitud la marca como resuelta, con un comentario opcional. */
export class ResolverSolicitud {
  constructor(private readonly repository: ColaAyudaRepository) {}

  async ejecutar(
    id: string,
    comentario?: string | null,
  ): Promise<SolicitudEnCola> {
    const texto = comentario?.trim() || null;
    if (texto && texto.length > MAX_COMENTARIO_RESOLUCION) {
      throw new PersonalError(
        `El comentario puede tener máximo ${MAX_COMENTARIO_RESOLUCION} letras.`,
        400,
        'DATOS_INVALIDOS',
        'comentario',
      );
    }
    return this.repository.resolver(id, texto);
  }
}
