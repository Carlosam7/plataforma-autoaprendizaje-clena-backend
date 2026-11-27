import { PasoNoEncontradoError } from '../../domain/progreso/errores.js';
import { ProgresoRepository } from '../../domain/progreso/progreso.repository.js';
import { Reloj } from '../shared/reloj.port.js';
import { ProgresoGuiaResumen, resumenProgreso } from './progreso.resultado.js';
import { SincronizarProgresoUseCase } from './sincronizar-progreso.use-case.js';

/**
 * HU-23: el usuario con sesión abrió un paso de una guía. Queda como leído y como el último
 * que vio; si era el que faltaba, la guía queda completada.
 */
export class MarcarPasoLeidoUseCase {
  constructor(
    private readonly progresos: ProgresoRepository,
    private readonly sincronizar: SincronizarProgresoUseCase,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    usuarioId: string,
    guiaSlug: string,
    orden: number,
  ): Promise<ProgresoGuiaResumen> {
    const paso = await this.progresos.buscarPaso(guiaSlug, orden);
    if (!paso) throw new PasoNoEncontradoError();

    await this.progresos.registrarLectura({
      usuarioId,
      ...paso,
      leidoEn: this.reloj.ahora(),
    });
    const avance = await this.sincronizar.deGuia(usuarioId, paso.guiaId);
    if (!avance) throw new PasoNoEncontradoError();
    return resumenProgreso(avance);
  }
}
