// C-10 · Mi progreso persistente. El paso se identifica por su número de orden.

export const ESTADOS_AVANCE = [
  'SIN_EMPEZAR',
  'EN_CURSO',
  'COMPLETADA',
] as const;
export type EstadoAvance = (typeof ESTADOS_AVANCE)[number];

export type NivelProgreso = 'BASICO' | 'INTERMEDIO' | 'AVANZADO';

export interface ProgresoGuia {
  slug: string;
  /** Slug de la categoría. */
  categoria: string;
  titulo: string;
  nivel: NivelProgreso;
  totalPasos: number;
  pasosLeidos: number;
  /** Entero 0–100, redondeado hacia abajo; solo es 100 si `completada`. */
  porcentaje: number;
  estado: EstadoAvance;
  completada: boolean;
  tieneActividad: boolean;
  actividadAprobada: boolean;
  /** Número del último paso abierto; null si no ha empezado o ya no existe. */
  ultimoPaso: number | null;
  completadaEn: Date | null;
}

export interface ListarProgresoCriterio {
  categoria?: string;
  pagina?: number;
  limite?: number;
}

export interface ProgresoPaginado {
  datos: ProgresoGuia[];
  total: number;
  pagina: number;
  limite: number;
}
