import { AvanceGuia } from '../../domain/progreso/avance-guia.js';
import { ProgresoRepository } from '../../domain/progreso/progreso.repository.js';
import { Reloj } from '../shared/reloj.port.js';

/**
 * HU-23: una guía se completa de dos maneras, al leer el último paso que faltaba o al
 * aprobar su actividad. Después de cualquiera de las dos se revisa aquí si ya quedó
 * completada, para dejar registrado cuándo.
 */
export class SincronizarProgresoUseCase {
  constructor(
    private readonly progresos: ProgresoRepository,
    private readonly reloj: Reloj,
  ) {}

  /** Devuelve el avance del usuario en la guía, ya con la fecha si la acaba de completar. */
  async deGuia(usuarioId: string, guiaId: string): Promise<AvanceGuia | null> {
    const avance = await this.progresos.avance(usuarioId, guiaId);
    if (!avance?.completada || avance.completadaEn) return avance;
    await this.progresos.marcarCompletada(
      usuarioId,
      guiaId,
      this.reloj.ahora(),
    );
    return this.progresos.avance(usuarioId, guiaId);
  }

  /** Para cuando el usuario aprueba la actividad de una guía (HU-21). */
  async deActividad(usuarioId: string, actividadId: string): Promise<void> {
    const guiaId = await this.progresos.guiaDeActividad(actividadId);
    if (guiaId) await this.deGuia(usuarioId, guiaId);
  }
}
