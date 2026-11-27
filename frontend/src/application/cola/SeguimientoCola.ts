import type { VerColaAyuda } from './VerColaAyuda';
import { type ColaAyuda, INTERVALO_COLA_MS } from '@/domain/cola/types';

export type EventoCola =
  | { tipo: 'actualizada'; cola: ColaAyuda; en: Date }
  | { tipo: 'error'; error: unknown };

/**
 * HU-30 (C-06): pide la cola al empezar y luego cada 15 s, avisando con `alCambiar`.
 * Devuelve la función que lo detiene (al salir de la pantalla). Un error no detiene el
 * seguimiento: se reintenta en la siguiente vuelta.
 */
export class SeguimientoCola {
  constructor(
    private readonly ver: VerColaAyuda,
    private readonly intervaloMs = INTERVALO_COLA_MS,
    private readonly reloj: () => Date = () => new Date(),
  ) {}

  iniciar(alCambiar: (evento: EventoCola) => void): () => void {
    let activo = true;
    const consultar = async () => {
      try {
        const cola = await this.ver.ejecutar();
        if (activo) alCambiar({ tipo: 'actualizada', cola, en: this.reloj() });
      } catch (error) {
        if (activo) alCambiar({ tipo: 'error', error });
      }
    };
    void consultar();
    const intervalo = setInterval(() => void consultar(), this.intervaloMs);
    return () => {
      activo = false;
      clearInterval(intervalo);
    };
  }

  /** Una consulta inmediata, p. ej. después de tomar o resolver. */
  async actualizarAhora(
    alCambiar: (evento: EventoCola) => void,
  ): Promise<void> {
    try {
      alCambiar({
        tipo: 'actualizada',
        cola: await this.ver.ejecutar(),
        en: this.reloj(),
      });
    } catch (error) {
      alCambiar({ tipo: 'error', error });
    }
  }
}
