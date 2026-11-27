import { NivelGuia } from '../guia/guia.js';

export const ESTADOS_AVANCE = [
  'SIN_EMPEZAR',
  'EN_CURSO',
  'COMPLETADA',
] as const;
export type EstadoAvance = (typeof ESTADOS_AVANCE)[number];

export interface AvanceGuiaProps {
  guiaId: string;
  slug: string;
  categoriaSlug: string;
  titulo: string;
  nivel: NivelGuia;
  totalPasos: number;
  /** Cuántos de esos pasos ya leyó el usuario. */
  pasosLeidos: number;
  /** Una actividad sin preguntas no cuenta (HU-21). */
  tieneActividad: boolean;
  /** El usuario tiene al menos un intento aprobado de la actividad. */
  actividadAprobada: boolean;
  /** Número del último paso que abrió, para retomar ahí (HU-24). */
  ultimoPaso: number | null;
  /** Cuándo quedó registrada como completada; null si todavía no. */
  completadaEn: Date | null;
}

/**
 * Cuánto ha avanzado un usuario en una guía (HU-23). La regla: una guía está completada
 * cuando leyó todos sus pasos y, si tiene actividad, la aprobó.
 */
export class AvanceGuia {
  constructor(private readonly props: AvanceGuiaProps) {}

  get guiaId(): string {
    return this.props.guiaId;
  }
  get slug(): string {
    return this.props.slug;
  }
  get categoriaSlug(): string {
    return this.props.categoriaSlug;
  }
  get titulo(): string {
    return this.props.titulo;
  }
  get nivel(): NivelGuia {
    return this.props.nivel;
  }
  get totalPasos(): number {
    return this.props.totalPasos;
  }
  get pasosLeidos(): number {
    return Math.min(this.props.pasosLeidos, this.props.totalPasos);
  }
  get tieneActividad(): boolean {
    return this.props.tieneActividad;
  }
  get actividadAprobada(): boolean {
    return this.props.tieneActividad && this.props.actividadAprobada;
  }
  get ultimoPaso(): number | null {
    return this.props.ultimoPaso;
  }
  get completadaEn(): Date | null {
    return this.props.completadaEn;
  }

  get completada(): boolean {
    return (
      this.totalPasos > 0 &&
      this.pasosLeidos === this.totalPasos &&
      (!this.tieneActividad || this.actividadAprobada)
    );
  }

  /**
   * Porcentaje para la barra de progreso. La actividad pesa como un paso más, así que solo
   * llega a 100 cuando la guía está completada.
   */
  get porcentaje(): number {
    const partes = this.totalPasos + (this.tieneActividad ? 1 : 0);
    if (partes === 0) return 0;
    const hechas = this.pasosLeidos + (this.actividadAprobada ? 1 : 0);
    // Hacia abajo: 5 de 6 es 83 %, y nunca muestra 100 % si falta algo.
    return Math.floor((hechas * 100) / partes);
  }

  get estado(): EstadoAvance {
    if (this.completada) return 'COMPLETADA';
    return this.pasosLeidos > 0 || this.actividadAprobada
      ? 'EN_CURSO'
      : 'SIN_EMPEZAR';
  }
}
