import { Rol } from '../../domain/auth/tipos.js';
import {
  EquipoConSolicitudActivaError,
  SolicitudNoEncontradaError,
} from '../../domain/ayuda/errores.js';
import {
  SolicitudAyuda,
  TemaAyuda,
} from '../../domain/ayuda/solicitud-ayuda.js';
import { SolicitudAyudaRepository } from '../../domain/ayuda/solicitud-ayuda.repository.js';
import { GeneradorId } from '../shared/generador-id.port.js';
import { Reloj } from '../shared/reloj.port.js';
import {
  LlaveSolicitud,
  LlavesSolicitudAyuda,
} from './llaves-solicitud-ayuda.port.js';
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

export interface AyudaSolicitadaConLlave {
  solicitud: AyudaSolicitada;
  /** Llave del navegador (C-05): va en la cookie httpOnly, nunca en el cuerpo. */
  llave: string;
}

/**
 * HU-29: pedir que un monitor venga al puesto. No exige cuenta: basta con decir el equipo.
 * Si el equipo ya tiene una solicitud activa, no se duplica: se devuelve la que hay, pero
 * solo al navegador que la pidió (C-05). A otro navegador no se le entrega.
 */
export class SolicitarAyudaUseCase {
  constructor(
    private readonly solicitudes: SolicitudAyudaRepository,
    private readonly ids: GeneradorId,
    private readonly reloj: Reloj,
    private readonly llaves: LlavesSolicitudAyuda,
  ) {}

  /** `llaveRecibida`: la de la cookie, si el navegador ya pidió ayuda antes. */
  async ejecutar(
    comando: SolicitarAyudaComando,
    usuario: { id: string; rol: Rol } | null,
    llaveRecibida: string | null,
  ): Promise<AyudaSolicitadaConLlave> {
    const { llave, huella } = this.llaveDelNavegador(llaveRecibida);
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
      titularHash: huella,
      ahora: this.reloj.ahora(),
    });

    const creada = await this.solicitudes.crear(nueva);
    const solicitud = creada
      ? nueva
      : await this.solicitudes.buscarActivaDeEquipo(nueva.equipo);
    // La que impedía crearla se cerró en este instante: basta con volver a enviarla.
    if (!solicitud) throw new SolicitudNoEncontradaError();
    // Quien escribió el equipo de otra persona no recibe su solicitud, ni siquiera el id.
    if (!creada && !solicitud.esDelTitular(huella)) {
      throw new EquipoConSolicitudActivaError();
    }

    return {
      solicitud: {
        ...(await resultadoSolicitud(this.solicitudes, solicitud)),
        yaExistia: !creada,
      },
      llave,
    };
  }

  /**
   * El navegador conserva su llave: así sigue siendo titular de todo lo que pidió desde él.
   * Si no trae una (o no es válida), recibe una nueva.
   */
  private llaveDelNavegador(recibida: string | null): LlaveSolicitud {
    const huella = recibida ? this.llaves.huellaDe(recibida) : null;
    return recibida && huella
      ? { llave: recibida, huella }
      : this.llaves.nueva();
  }
}
