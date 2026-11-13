import {
  EstadoSolicitud,
  TemaAyuda,
} from '../../domain/ayuda/solicitud-ayuda.js';
import {
  CriterioSolicitudes,
  SolicitudAyudaRepository,
  SolicitudEnCola,
} from '../../domain/ayuda/solicitud-ayuda.repository.js';
import { ResultadoPaginado } from '../shared/resultado-paginado.js';

/** Lo que ve el monitor de cada solicitud. */
export interface SolicitudEnColaResumen {
  id: string;
  equipo: string;
  tema: TemaAyuda;
  estado: EstadoSolicitud;
  guia: { slug: string; titulo: string } | null;
  /** Número del paso donde estaba la persona. */
  paso: number | null;
  /** Con ella el frontend calcula el tiempo de espera. */
  creadaEn: Date;
  /** Nombre del monitor que la atiende o la atendió; null mientras espera (HU-30). */
  atendidaPor: string | null;
  tomadaEn: Date | null;
  resueltaEn: Date | null;
  comentarioResolucion: string | null;
}

export function resumenEnCola({
  solicitud,
  guia,
  pasoOrden,
  atendidaPor,
}: SolicitudEnCola): SolicitudEnColaResumen {
  return {
    id: solicitud.id,
    equipo: solicitud.equipo,
    tema: solicitud.tema,
    estado: solicitud.estado,
    guia,
    paso: pasoOrden,
    creadaEn: solicitud.creadaEn,
    atendidaPor,
    tomadaEn: solicitud.tomadaEn,
    resueltaEn: solicitud.resueltaEn,
    comentarioResolucion: solicitud.comentarioResolucion,
  };
}

/** Las solicitudes de ayuda para el personal, de la más antigua a la más reciente. */
export class ListarSolicitudesAyudaUseCase {
  constructor(private readonly solicitudes: SolicitudAyudaRepository) {}

  async ejecutar(
    criterio: CriterioSolicitudes,
  ): Promise<ResultadoPaginado<SolicitudEnColaResumen>> {
    const { elementos, total } = await this.solicitudes.listar(criterio);
    return {
      datos: elementos.map(resumenEnCola),
      total,
      pagina: criterio.pagina,
      limite: criterio.limite,
    };
  }
}
