import type { AuthRepository } from '@/application/auth/ports';
import { obtenerTokenUsuarioPublico } from '@/application/practica/sesionPractica';
import type {
  ListarProgresoCriterio,
  ProgresoPaginado,
} from '@/domain/progreso/types';
import type { ProgresoRepository } from './ports';

/** HU-23 · Solo USUARIO_PUBLICO con sesión: el usuario sale del token, no de la petición. */
export class ListarMiProgreso {
  constructor(
    private readonly repository: ProgresoRepository,
    private readonly auth: AuthRepository,
  ) {}

  async ejecutar(
    criterio: ListarProgresoCriterio = {},
  ): Promise<ProgresoPaginado> {
    const token = await obtenerTokenUsuarioPublico(this.auth);
    return this.repository.listar(token, {
      pagina: 1,
      limite: 20,
      ...criterio,
    });
  }
}
