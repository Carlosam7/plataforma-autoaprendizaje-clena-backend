import { SolicitudAyudaRepository } from '../../domain/ayuda/solicitud-ayuda.repository.js';
import { LlavesSolicitudAyuda } from './llaves-solicitud-ayuda.port.js';
import { buscarSolicitudDelTitular } from './solicitud-del-titular.js';
import {
  resultadoSolicitud,
  SolicitudAyudaResultado,
} from './solicitud-ayuda.resultado.js';

/**
 * HU-29: estado de mi solicitud y mi puesto en la cola, para consultarlo mientras espero.
 * Solo desde el navegador que la pidió (C-05).
 */
export class ObtenerSolicitudAyudaUseCase {
  constructor(
    private readonly solicitudes: SolicitudAyudaRepository,
    private readonly llaves: LlavesSolicitudAyuda,
  ) {}

  async ejecutar(
    id: string,
    llave: string | null,
  ): Promise<SolicitudAyudaResultado> {
    const solicitud = await buscarSolicitudDelTitular(
      this.solicitudes,
      this.llaves,
      id,
      llave,
    );
    return resultadoSolicitud(this.solicitudes, solicitud);
  }
}
