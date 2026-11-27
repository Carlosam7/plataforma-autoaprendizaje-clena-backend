import type { AuthRepository } from '@/application/auth/ports';
import { obtenerTokenUsuarioPublico } from '@/application/practica/sesionPractica';
import { ProgresoError } from '@/domain/progreso/errors';
import type { ProgresoGuia } from '@/domain/progreso/types';
import type { ProgresoRepository } from './ports';

/** HU-23 · Anota la lectura de un paso. Nunca se llama sin sesión de usuario público. */
export class RegistrarLecturaPaso {
  constructor(
    private readonly repository: ProgresoRepository,
    private readonly auth: AuthRepository,
  ) {}

  async ejecutar(slug: string, orden: number): Promise<ProgresoGuia> {
    if (!slug.trim() || !Number.isInteger(orden) || orden < 1) {
      throw new ProgresoError(
        'El paso que intentas marcar no es válido.',
        'VALIDACION',
      );
    }
    const token = await obtenerTokenUsuarioPublico(this.auth);
    return this.repository.registrarLectura(token, slug, orden);
  }
}
