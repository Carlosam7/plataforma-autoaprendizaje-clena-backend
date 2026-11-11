// Tipos puros: los puertos los usan sin depender de los DTOs de aplicación.
export interface Paginacion {
  pagina: number;
  limite: number;
}

export interface Pagina<T> {
  elementos: T[];
  total: number;
}
