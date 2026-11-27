import {
  AyudaError,
  ConexionAyudaError,
  SolicitudNoEncontradaError,
} from '@/domain/ayuda/errors';
import {
  INTERVALO_CONSULTA_AYUDA_MS,
  solicitudActiva,
  type SolicitudAyuda,
} from '@/domain/ayuda/types';
import type { AyudaRepository } from './ports';

export type EventoSeguimiento =
  /** Llegó el estado actual. */
  | { tipo: 'actualizada'; solicitud: SolicitudAyuda }
  /** No se pudo consultar esta vez (red o servidor); se vuelve a intentar en el siguiente ciclo. */
  | { tipo: 'error-temporal'; error: AyudaError }
  /** 404: este navegador ya no puede seguirla. El seguimiento termina. */
  | { tipo: 'perdida'; error: SolicitudNoEncontradaError };

/**
 * HU-29 · Mientras la solicitud está activa, consulta su estado cada 15 s (C-05).
 * Termina sola cuando la resuelven o la cancelan, o cuando quien la usa la detiene
 * (al salir de la página). Nunca hay dos consultas a la vez: la siguiente se programa
 * cuando termina la anterior.
 */
export class SeguimientoSolicitudAyuda {
  constructor(
    private readonly repository: AyudaRepository,
    private readonly intervaloMs = INTERVALO_CONSULTA_AYUDA_MS,
  ) {}

  /** Devuelve la función que detiene el seguimiento. */
  iniciar(id: string, alCambiar: (evento: EventoSeguimiento) => void) {
    let detenido = false;
    let temporizador: ReturnType<typeof setTimeout> | undefined;

    const programar = () => {
      if (!detenido) temporizador = setTimeout(consultar, this.intervaloMs);
    };

    const consultar = async () => {
      try {
        const solicitud = await this.repository.consultar(id);
        if (detenido) return;
        alCambiar({ tipo: 'actualizada', solicitud });
        if (solicitudActiva(solicitud.estado)) programar();
      } catch (error) {
        if (detenido) return;
        if (error instanceof SolicitudNoEncontradaError) {
          alCambiar({ tipo: 'perdida', error });
          return;
        }
        alCambiar({
          tipo: 'error-temporal',
          error:
            error instanceof AyudaError ? error : new ConexionAyudaError(false),
        });
        // GET es seguro: reintentar en el siguiente ciclo no tiene efectos.
        programar();
      }
    };

    programar();
    return () => {
      detenido = true;
      clearTimeout(temporizador);
    };
  }
}
