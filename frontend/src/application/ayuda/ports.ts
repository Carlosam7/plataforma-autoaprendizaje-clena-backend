import type {
  SolicitarAyudaComando,
  SolicitudAyuda,
  SolicitudCreada,
} from '@/domain/ayuda/types';

/**
 * C-05. Las tres operaciones viajan con la cookie httpOnly `llave_ayuda`
 * (`credentials: 'include'`): solo el navegador que pidió la ayuda la consulta o la cancela.
 */
export interface AyudaRepository {
  /** POST /solicitudes-ayuda → 201 nueva o 200 `yaExistia` (mismo navegador). */
  solicitar(comando: SolicitarAyudaComando): Promise<SolicitudCreada>;

  /** GET /solicitudes-ayuda/:id → 200. */
  consultar(id: string): Promise<SolicitudAyuda>;

  /** DELETE /solicitudes-ayuda/:id → 204. */
  cancelar(id: string): Promise<void>;
}
