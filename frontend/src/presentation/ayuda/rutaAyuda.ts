import { MAX_LARGO_SLUG, SLUG_REGEX } from '@/domain/ayuda/types';

/**
 * Enlace a «Solicitar ayuda» con la guía y el paso donde está la persona (C-05), para que
 * el monitor sepa a qué viene. Va en la URL: sobrevive a una recarga y no guarda nada.
 */
export function rutaAyuda(guiaSlug?: string, pasoOrden?: number): string {
  if (!guiaSlug) return '/ayuda';
  const params = new URLSearchParams({ guia: guiaSlug });
  if (pasoOrden !== undefined) params.set('paso', String(pasoOrden));
  return `/ayuda?${params.toString()}`;
}

/** Guía y paso de la URL; se descartan si no son válidos (el paso, además, sin guía). */
export function contextoDeAyuda(params: URLSearchParams): {
  guiaSlug: string | null;
  pasoOrden: number | null;
} {
  const slug = params.get('guia')?.trim() ?? '';
  const guiaSlug =
    slug && slug.length <= MAX_LARGO_SLUG && SLUG_REGEX.test(slug)
      ? slug
      : null;
  const paso = Number(params.get('paso'));
  return {
    guiaSlug,
    pasoOrden: guiaSlug && Number.isInteger(paso) && paso >= 1 ? paso : null,
  };
}
