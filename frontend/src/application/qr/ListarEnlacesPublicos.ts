import type { EnlacesPublicosRepository } from './ports';
import {
  type EnlacePublico,
  type EnlacesPublicos,
  UrlPublicaInvalidaError,
} from '@/domain/qr/types';

const HOSTS_LOCALES = new Set(['localhost', '127.0.0.1', '[::1]', '0.0.0.0']);

/**
 * HU-45 (FE-11): los enlaces públicos que se imprimen como QR: el inicio, cada categoría
 * (`/guias?categoria=<slug>`) y cada guía publicada (`/guias/<slug>`). Todos se abren sin
 * sesión. Nunca incluye rutas del personal ni de la cuenta.
 */
export class ListarEnlacesPublicos {
  constructor(private readonly repository: EnlacesPublicosRepository) {}

  async ejecutar(urlPublica: string): Promise<EnlacesPublicos> {
    const urlBase = normalizarBase(urlPublica);
    const enlace = (
      tipo: EnlacePublico['tipo'],
      titulo: string,
      ruta: string,
    ): EnlacePublico => ({ tipo, titulo, ruta, url: `${urlBase}${ruta}` });

    const enlaces: EnlacePublico[] = [enlace('INICIO', 'Inicio de Kamá', '/')];
    const categorias = await this.repository.listarCategorias();
    for (const categoria of categorias) {
      enlaces.push(
        enlace(
          'CATEGORIA',
          categoria.nombre,
          `/guias?categoria=${encodeURIComponent(categoria.slug)}`,
        ),
      );
      const guias = await this.repository.listarGuias(categoria.slug);
      for (const guia of guias) {
        enlaces.push(
          enlace(
            'GUIA',
            guia.titulo,
            `/guias/${encodeURIComponent(guia.slug)}`,
          ),
        );
      }
    }
    return {
      enlaces,
      urlBase,
      esLocal: HOSTS_LOCALES.has(new URL(urlBase).hostname),
    };
  }
}

function normalizarBase(valor: string): string {
  let url: URL;
  try {
    url = new URL(valor.trim());
  } catch {
    throw new UrlPublicaInvalidaError(valor);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UrlPublicaInvalidaError(valor);
  }
  // Se conserva una ruta base (p. ej. /kama) pero sin la barra final.
  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
}
