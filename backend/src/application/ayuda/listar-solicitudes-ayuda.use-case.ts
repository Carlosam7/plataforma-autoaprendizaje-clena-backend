import {
  EstadoSolicitud,
  TemaAyuda,
} from '../../domain/ayuda/solicitud-ayuda.js';
import {
  CriterioSolicitudes,
  SolicitudAyudaRepository,
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
}

/** Las solicitudes de ayuda para el personal, de la más antigua a la más reciente. */
export class ListarSolicitudesAyudaUseCase {
  constructor(private readonly solicitudes: SolicitudAyudaRepository) {}

  async ejecutar(
    criterio: CriterioSolicitudes,
  ): Promise<ResultadoPaginado<SolicitudEnColaResumen>> {
    const { elementos, total } = await this.solicitudes.listar(criterio);
    return {
      datos: elementos.map(({ solicitud, guia, pasoOrden }) => ({
        id: solicitud.id,
        equipo: solicitud.equipo,
        tema: solicitud.tema,
        estado: solicitud.estado,
        guia,
        paso: pasoOrden,
        creadaEn: solicitud.creadaEn,
      })),
      total,
      pagina: criterio.pagina,
      limite: criterio.limite,
    };
  }
}
