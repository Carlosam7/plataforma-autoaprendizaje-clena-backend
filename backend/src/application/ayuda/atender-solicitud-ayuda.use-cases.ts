import {
  SolicitudModificadaError,
  SolicitudNoEncontradaError,
} from '../../domain/ayuda/errores.js';
import { SolicitudAyuda } from '../../domain/ayuda/solicitud-ayuda.js';
import { SolicitudAyudaRepository } from '../../domain/ayuda/solicitud-ayuda.repository.js';
import { Reloj } from '../shared/reloj.port.js';
import {
  resumenEnCola,
  SolicitudEnColaResumen,
} from './listar-solicitudes-ayuda.use-case.js';

/** Lee la solicitud, le aplica el cambio de estado y lo guarda si nadie más la cambió. */
async function cambiarEstado(
  solicitudes: SolicitudAyudaRepository,
  id: string,
  cambio: (solicitud: SolicitudAyuda) => void,
): Promise<SolicitudEnColaResumen> {
  const solicitud = await solicitudes.buscarPorId(id);
  if (!solicitud) throw new SolicitudNoEncontradaError();
  const estadoAnterior = solicitud.estado;
  cambio(solicitud);
  if (!(await solicitudes.guardar(solicitud, estadoAnterior))) {
    throw new SolicitudModificadaError();
  }
  const enCola = await solicitudes.buscarEnCola(id);
  if (!enCola) throw new SolicitudNoEncontradaError();
  return resumenEnCola(enCola);
}

/** HU-30: un monitor toma una solicitud pendiente; pasa a «En atención» con su nombre. */
export class TomarSolicitudAyudaUseCase {
  constructor(
    private readonly solicitudes: SolicitudAyudaRepository,
    private readonly reloj: Reloj,
  ) {}

  ejecutar(id: string, monitorId: string): Promise<SolicitudEnColaResumen> {
    return cambiarEstado(this.solicitudes, id, (solicitud) =>
      solicitud.tomar(monitorId, this.reloj.ahora()),
    );
  }
}

/** HU-30: el monitor que la tomó la marca como resuelta, con un comentario breve opcional. */
export class ResolverSolicitudAyudaUseCase {
  constructor(
    private readonly solicitudes: SolicitudAyudaRepository,
    private readonly reloj: Reloj,
  ) {}

  ejecutar(
    id: string,
    monitorId: string,
    comentario?: string | null,
  ): Promise<SolicitudEnColaResumen> {
    return cambiarEstado(this.solicitudes, id, (solicitud) =>
      solicitud.resolver(monitorId, comentario ?? null, this.reloj.ahora()),
    );
  }
}
