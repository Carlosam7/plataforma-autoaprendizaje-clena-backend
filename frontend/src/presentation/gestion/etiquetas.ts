import type { EstadoGuiaGestion, Nivel } from '@/domain/gestion/types';

export const ETIQUETA_ESTADO: Record<EstadoGuiaGestion, string> = {
  BORRADOR: 'Borrador',
  PUBLICADA: 'Publicada',
  OCULTA: 'Oculta',
};

export const ETIQUETA_NIVEL: Record<Nivel, string> = {
  BASICO: 'Básico',
  INTERMEDIO: 'Intermedio',
  AVANZADO: 'Avanzado',
};
