import type {
  Actividad,
  Feedback,
  IntentoIniciado,
  RespuestaComando,
  RespuestaEvaluada,
} from '@/domain/practica/types';

export interface PracticaRepository {
  /** C-03 · GET /guias/:slug/actividad (público, sin respuestas correctas). */
  obtenerActividad(slug: string): Promise<Actividad>;

  /** C-03 · POST /guias/:slug/actividad/intentos con Bearer de USUARIO_PUBLICO. */
  iniciarIntentoAutenticado(
    slug: string,
    accessToken: string,
  ): Promise<IntentoIniciado>;

  /** C-03 · POST /intentos/:id/respuestas con Bearer de USUARIO_PUBLICO. */
  responderAutenticado(
    intentoId: string,
    respuesta: RespuestaComando,
    accessToken: string,
  ): Promise<RespuestaEvaluada>;

  /** C-04 (PROPUESTO) · POST /guias/:slug/actividad/evaluar-respuesta, sin persistencia. */
  evaluarInvitado(slug: string, respuesta: RespuestaComando): Promise<Feedback>;
}
