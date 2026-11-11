import { Pagina, Paginacion } from '../shared/pagina.js';
import { Categoria } from './categoria.js';

export const CAMPOS_ORDEN_CATEGORIA = ['orden', 'nombre'] as const;

export interface CriterioCategorias extends Paginacion {
  q?: string;
  ordenarPor: (typeof CAMPOS_ORDEN_CATEGORIA)[number];
  direccion: 'asc' | 'desc';
}

export abstract class CategoriaRepository {
  abstract listar(criterio: CriterioCategorias): Promise<Pagina<Categoria>>;
}
