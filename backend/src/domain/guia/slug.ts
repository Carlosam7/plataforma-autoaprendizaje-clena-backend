const LARGO_MAXIMO = 70; // guia.slug admite 80: quedan letras para «-2», «-3»…

/**
 * Slug de una guía nueva a partir de su título: «Enviar un correo electrónico» →
 * «enviar-un-correo-electronico». Solo minúsculas, números y guiones.
 */
export function slugDesdeTitulo(titulo: string): string {
  const slug = titulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // tildes y la virgulilla de la ñ
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, LARGO_MAXIMO)
    .replace(/^-+|-+$/g, '');
  return slug || 'guia';
}
