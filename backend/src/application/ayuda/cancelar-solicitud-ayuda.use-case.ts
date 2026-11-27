import { SolicitudModificadaError } from '../../domain/ayuda/errores.js';
import { SolicitudAyudaRepository } from '../../domain/ayuda/solicitud-ayuda.repository.js';
import { Reloj } from '../shared/reloj.port.js';
import { LlavesSolicitudAyuda } from './llaves-solicitud-ayuda.port.js';
import { buscarSolicitudDelTitular } from './solicitud-del-titular.js';

/**
 * HU-29: cancelo mi solicitud porque resolví la duda por mi cuenta. Solo desde el navegador
 * que la pidió (C-05): conocer el id no basta para cancelar la de otra persona.
 */
export class CancelarSolicitudAyudaUseCase {
  constructor(
    private readonly solicitudes: SolicitudAyudaRepository,
    private readonly reloj: Reloj,
    private readonly llaves: LlavesSolicitudAyuda,
  ) {}

  async ejecutar(id: string, llave: string | null): Promise<void> {
    const solicitud = await buscarSolicitudDelTitular(
      this.solicitudes,
      this.llaves,
      id,
      llave,
    );
    const estadoAnterior = solicitud.estado;
    solicitud.cancelar(this.reloj.ahora());
    if (!(await this.solicitudes.guardar(solicitud, estadoAnterior))) {
      throw new SolicitudModificadaError();
    }
  }
}
