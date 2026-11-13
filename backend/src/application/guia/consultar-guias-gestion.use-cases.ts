import {
  CriterioGestionGuias,
  GuiaGestionRepository,
} from '../../domain/guia/guia-gestion.repository.js';
import { ImagenRepository } from '../../domain/imagen/imagen.repository.js';
import { ResultadoPaginado } from '../shared/resultado-paginado.js';
import {
  detalleGestion,
  GuiaGestionDetalle,
  GuiaGestionResumen,
  resumenGestion,
} from './guia-gestion.resultado.js';

/** HU-13: todas las guías para el personal, también borradores y ocultas. */
export class ListarGuiasGestionUseCase {
  constructor(private readonly guias: GuiaGestionRepository) {}

  async ejecutar(
    criterio: CriterioGestionGuias,
  ): Promise<ResultadoPaginado<GuiaGestionResumen>> {
    const { elementos, total } = await this.guias.listar(criterio);
    return {
      datos: elementos.map(resumenGestion),
      total,
      pagina: criterio.pagina,
      limite: criterio.limite,
    };
  }
}

/** HU-13: una guía en cualquier estado, con todo lo que el formulario de edición necesita. */
export class ObtenerGuiaGestionUseCase {
  constructor(
    private readonly guias: GuiaGestionRepository,
    private readonly imagenes: ImagenRepository,
  ) {}

  ejecutar(slug: string): Promise<GuiaGestionDetalle> {
    return detalleGestion(slug, this.guias, this.imagenes);
  }
}
