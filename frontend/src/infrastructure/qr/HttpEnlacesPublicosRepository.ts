import type { EnlacesPublicosRepository } from '@/application/qr/ports';

const LIMITE = 100;

interface Pagina<T> {
  datos: T[];
  total: number;
}

/**
 * Lee del backend (C-01) las categorías y las guías publicadas, recorriendo todas las
 * páginas. A propósito **no** cae en datos de ejemplo: un QR impreso con una guía que no
 * existe sería peor que un error en pantalla.
 */
export class HttpEnlacesPublicosRepository implements EnlacesPublicosRepository {
  constructor(private readonly baseUrl = '/api/v1') {}

  async listarCategorias(): Promise<{ slug: string; nombre: string }[]> {
    const filas = await this.todas<{ slug: string; nombre: string }>(
      '/categorias?ordenarPor=orden&direccion=asc',
    );
    return filas.map(({ slug, nombre }) => ({ slug, nombre }));
  }

  async listarGuias(
    categoriaSlug: string,
  ): Promise<{ slug: string; titulo: string }[]> {
    const filas = await this.todas<{ slug: string; titulo: string }>(
      `/guias?categoria=${encodeURIComponent(categoriaSlug)}`,
    );
    return filas.map(({ slug, titulo }) => ({ slug, titulo }));
  }

  private async todas<T>(ruta: string): Promise<T[]> {
    const filas: T[] = [];
    for (let pagina = 1; ; pagina++) {
      let res: Response;
      try {
        res = await fetch(
          `${this.baseUrl}${ruta}&pagina=${pagina}&limite=${LIMITE}`,
          { headers: { Accept: 'application/json' } },
        );
      } catch {
        throw new Error(
          'No se pudo conectar con el servidor para leer las guías. Inténtalo de nuevo.',
        );
      }
      if (!res.ok) throw new Error(await mensajeDeError(res));
      const json = (await res.json()) as Pagina<T>;
      filas.push(...json.datos);
      if (json.datos.length === 0 || filas.length >= json.total) return filas;
    }
  }
}

/** El `mensaje` del error uniforme del backend (C-00), o uno genérico. */
async function mensajeDeError(res: Response): Promise<string> {
  try {
    const cuerpo = (await res.json()) as { mensaje?: unknown };
    if (typeof cuerpo.mensaje === 'string') return cuerpo.mensaje;
  } catch {
    // Sin cuerpo JSON.
  }
  return 'No se pudieron leer las guías. Inténtalo de nuevo.';
}
