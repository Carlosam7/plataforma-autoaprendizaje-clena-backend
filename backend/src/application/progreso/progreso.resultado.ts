import { NivelGuia } from '../../domain/guia/guia.js';
import { AvanceGuia, EstadoAvance } from '../../domain/progreso/avance-guia.js';

/** Lo que «Mi progreso» muestra de cada guía. */
export interface ProgresoGuiaResumen {
  slug: string;
  categoria: string;
  titulo: string;
  nivel: NivelGuia;
  totalPasos: number;
  pasosLeidos: number;
  /** De 0 a 100, para la barra y el número. */
  porcentaje: number;
  estado: EstadoAvance;
  completada: boolean;
  tieneActividad: boolean;
  actividadAprobada: boolean;
  /** Número del último paso que abrió; null si no ha empezado. */
  ultimoPaso: number | null;
  completadaEn: Date | null;
}

export function resumenProgreso(avance: AvanceGuia): ProgresoGuiaResumen {
  return {
    slug: avance.slug,
    categoria: avance.categoriaSlug,
    titulo: avance.titulo,
    nivel: avance.nivel,
    totalPasos: avance.totalPasos,
    pasosLeidos: avance.pasosLeidos,
    porcentaje: avance.porcentaje,
    estado: avance.estado,
    completada: avance.completada,
    tieneActividad: avance.tieneActividad,
    actividadAprobada: avance.actividadAprobada,
    ultimoPaso: avance.ultimoPaso,
    completadaEn: avance.completadaEn,
  };
}
