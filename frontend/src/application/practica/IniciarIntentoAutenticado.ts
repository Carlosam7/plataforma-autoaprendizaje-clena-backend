import type { AuthRepository } from '@/application/auth/ports';
import type { IntentoIniciado } from '@/domain/practica/types';
import type { PracticaRepository } from './ports';
import { obtenerTokenUsuarioPublico, type Reloj } from './sesionPractica';
import { validarSlug } from './validaciones';

/**
 * HU-21 · Inicia un intento persistente SOLO para USUARIO_PUBLICO.
 * Nunca se usa para invitados: el backend guardaría un intento anónimo.
 */
export class IniciarIntentoAutenticado {
  constructor(
    private readonly repository: PracticaRepository,
    private readonly auth: AuthRepository,
    private readonly reloj?: Reloj,
  ) {}

  async ejecutar(slug: string): Promise<IntentoIniciado> {
    const slugValido = validarSlug(slug);
    const token = await obtenerTokenUsuarioPublico(this.auth, this.reloj);
    return this.repository.iniciarIntentoAutenticado(slugValido, token);
  }
}
