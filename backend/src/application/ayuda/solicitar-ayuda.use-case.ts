import { Rol } from '../../domain/auth/tipos.js';
import { SolicitudNoEncontradaError } from '../../domain/ayuda/errores.js';
import {
  SolicitudAyuda,
  TemaAyuda,
} from '../../domain/ayuda/solicitud-ayuda.js';
import { SolicitudAyudaRepository } from '../../domain/ayuda/solicitud-ayuda.repository.js';
import { GeneradorId } from '../shared/generador-id.port.js';
import { Reloj } from '../shared/reloj.port.js';
import {
  resultadoSolicitud,
  SolicitudAyudaResultado,
} from './solicitud-ayuda.resultado.js';

export interface SolicitarAyudaComando {
  equipo: string;
  tema: TemaAyuda;
  /** Guía y número de paso donde estaba la persona, si pidió ayuda desde una guía. */
  guiaSlug?: string;
  pasoOrden?: number;
}

export interface AyudaSolicitada extends SolicitudAyudaResultado {
  /** true: el equipo ya tenía una solicitud activa y se devuelve esa, sin crear otra. */
  yaExistia: boolean;
}

/**
 * HU-29: pedir que un monitor venga al puesto. No exige cuenta: basta con decir el equipo.
 * Si el equipo ya tiene una solicitud activa, no se duplica: se devuelve la que hay.
 */
export class SolicitarAyudaUseCase {
  constructor(
    private readonly solicitudes: SolicitudAyudaRepository,
    private readonly ids: GeneradorId,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    comando: SolicitarAyudaComando,
    usuario: { id: string; rol: Rol } | null,
  ): Promise<AyudaSolicitada> {
    // Una guía que ya no existe no debe impedir pedir ayuda: se guarda sin ella.
    const contexto = comando.guiaSlug
      ? await this.solicitudes.buscarContexto(
          comando.guiaSlug,
          comando.pasoOrden,
        )
      : null;
    const nueva = SolicitudAyuda.crear({
      id: this.ids.generar(),
      equipo: comando.equipo,
      tema: comando.tema,
      guiaId: contexto?.guiaId ?? null,
      pasoId: contexto?.pasoId ?? null,
      // solicitud_ayuda.usuario_id apunta a usuario_publico: el personal queda anónimo.
      usuarioId: usuario?.rol === 'USUARIO_PUBLICO' ? usuario.id : null,
      ahora: this.reloj.ahora(),
    });

    const creada = await this.solicitudes.crear(nueva);
    const solicitud = creada
      ? nueva
      : await this.solicitudes.buscarActivaDeEquipo(nueva.equipo);
    // La que impedía crearla se cerró en este instante: basta con volver a enviarla.
    if (!solicitud) throw new SolicitudNoEncontradaError();

    return {
      ...(await resultadoSolicitud(this.solicitudes, solicitud)),
      yaExistia: !creada,
    };
  }
}
