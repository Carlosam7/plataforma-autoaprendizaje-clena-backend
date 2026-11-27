import { SolicitudNoEncontradaError } from '../../domain/ayuda/errores.js';
import { SolicitudAyuda } from '../../domain/ayuda/solicitud-ayuda.js';
import { SolicitudAyudaRepository } from '../../domain/ayuda/solicitud-ayuda.repository.js';
import { LlavesSolicitudAyuda } from './llaves-solicitud-ayuda.port.js';

/**
 * C-05: la solicitud, solo si la pidió el navegador con esa llave. Si es de otro navegador
 * responde igual que si no existiera, para no revelar que el id es real.
 */
export async function buscarSolicitudDelTitular(
  solicitudes: SolicitudAyudaRepository,
  llaves: LlavesSolicitudAyuda,
  id: string,
  llave: string | null,
): Promise<SolicitudAyuda> {
  const huella = llave ? llaves.huellaDe(llave) : null;
  const solicitud = await solicitudes.buscarPorId(id);
  if (!solicitud?.esDelTitular(huella)) throw new SolicitudNoEncontradaError();
  return solicitud;
}
