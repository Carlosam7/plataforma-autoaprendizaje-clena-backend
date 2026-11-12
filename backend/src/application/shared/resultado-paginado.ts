// Forma común de toda respuesta paginada que devuelve un caso de uso.
export interface ResultadoPaginado<T> {
  datos: T[];
  total: number;
  pagina: number;
  limite: number;
}
