import type { AyudaRepository } from './ports';

/**
 * HU-29 · Cancelar mi solicitud porque resolví la duda. Un doble clic reutiliza la petición
 * en curso en lugar de enviar un segundo DELETE (que respondería 409).
 */
export class CancelarSolicitudAyuda {
  private enCurso = new Map<string, Promise<void>>();

  constructor(private readonly repository: AyudaRepository) {}

  ejecutar(id: string): Promise<void> {
    const existente = this.enCurso.get(id);
    if (existente) return existente;
    const peticion = this.repository.cancelar(id).finally(() => {
      this.enCurso.delete(id);
    });
    this.enCurso.set(id, peticion);
    return peticion;
  }
}
