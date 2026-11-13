export abstract class ImagenRepository {
  /** URL pública de cada imagen, por id. Las que no existan no aparecen en el mapa. */
  abstract urlsPorId(ids: readonly string[]): Promise<Map<string, string>>;
}
