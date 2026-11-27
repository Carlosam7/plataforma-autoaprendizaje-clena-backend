import type { TemaAyuda } from '@/domain/ayuda/types';

/** Nombres en lenguaje sencillo de los temas de C-05, en el orden en que se muestran. */
export const ETIQUETAS_TEMA: Record<TemaAyuda, string> = {
  CORREO: 'Correo electrónico',
  BUSQUEDA_INTERNET: 'Buscar en internet',
  DOCUMENTOS: 'Documentos',
  REDES_SOCIALES: 'Redes sociales',
  SEGURIDAD_DIGITAL: 'Seguridad digital y mensajes falsos',
  USO_DEL_EQUIPO: 'Usar el computador',
  IMPRESION: 'Imprimir',
  OTRO: 'Otro tema',
};
