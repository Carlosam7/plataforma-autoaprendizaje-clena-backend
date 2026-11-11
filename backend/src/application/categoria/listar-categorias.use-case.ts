import {
  CategoriaRepository,
  CriterioCategorias,
} from '../../domain/categoria/categoria.repository.js';
import { ResultadoPaginado } from '../shared/resultado-paginado.js';

// Lo que la API expone de una categoría; id y orden son detalles internos.
export interface CategoriaResumen {
  slug: string;
  nombre: string;
  icono: string;
}

// TypeScript puro: sin decoradores de Nest. El módulo lo construye con useFactory.
export class ListarCategoriasUseCase {
  constructor(private readonly categorias: CategoriaRepository) {}

  async ejecutar(
    criterio: CriterioCategorias,
  ): Promise<ResultadoPaginado<CategoriaResumen>> {
    const { elementos, total } = await this.categorias.listar(criterio);
    return {
      datos: elementos.map(({ slug, nombre, icono }) => ({
        slug,
        nombre,
        icono,
      })),
      total,
      pagina: criterio.pagina,
      limite: criterio.limite,
    };
  }
}
