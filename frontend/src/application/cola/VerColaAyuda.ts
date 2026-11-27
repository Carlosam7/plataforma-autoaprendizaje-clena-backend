import type { ColaAyudaRepository } from './ports';
import type { ColaAyuda } from '@/domain/cola/types';

/** Cuántas pendientes se muestran de una vez; las más antiguas primero. */
const LIMITE = 50;

/**
 * HU-30: la cola del monitor. Las pendientes en el orden en que se atienden y, aparte, las
 * que están en atención. Se vuelve a pedir cada 15 s (INTERVALO_COLA_MS).
 */
export class VerColaAyuda {
  constructor(private readonly repository: ColaAyudaRepository) {}

  async ejecutar(): Promise<ColaAyuda> {
    const [pendientes, enAtencion] = await Promise.all([
      this.repository.listar({ estado: 'PENDIENTE', limite: LIMITE }),
      this.repository.listar({ estado: 'EN_ATENCION', limite: LIMITE }),
    ]);
    return {
      pendientes: pendientes.datos,
      totalPendientes: pendientes.total,
      enAtencion: enAtencion.datos,
    };
  }
}
