import {
  EstadoSolicitud,
  SolicitudAyuda,
  TemaAyuda,
} from '../../domain/ayuda/solicitud-ayuda.js';
import { SolicitudAyudaRepository } from '../../domain/ayuda/solicitud-ayuda.repository.js';

/** Lo que ve quien pidió la ayuda. */
export interface SolicitudAyudaResultado {
  id: string;
  equipo: string;
  tema: TemaAyuda;
  estado: EstadoSolicitud;
  /** Puesto en la cola mientras espera; null cuando ya la atienden o se cerró. */
  posicion: number | null;
  creadaEn: Date;
}

export async function resultadoSolicitud(
  solicitudes: SolicitudAyudaRepository,
  solicitud: SolicitudAyuda,
): Promise<SolicitudAyudaResultado> {
  return {
    id: solicitud.id,
    equipo: solicitud.equipo,
    tema: solicitud.tema,
    estado: solicitud.estado,
    posicion:
      solicitud.estado === 'PENDIENTE'
        ? await solicitudes.posicionEnCola(solicitud)
        : null,
    creadaEn: solicitud.creadaEn,
  };
}
