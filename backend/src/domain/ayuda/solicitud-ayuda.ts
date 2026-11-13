import { DatoInvalidoError } from '../shared/error-de-negocio.js';
import {
  SolicitudCerradaError,
  SolicitudDeOtroMonitorError,
  SolicitudSinTomarError,
  SolicitudYaTomadaError,
} from './errores.js';

/** La lista corta de temas que elige quien pide ayuda (HU-29). */
export const TEMAS_AYUDA = [
  'CORREO',
  'BUSQUEDA_INTERNET',
  'DOCUMENTOS',
  'REDES_SOCIALES',
  'SEGURIDAD_DIGITAL',
  'USO_DEL_EQUIPO',
  'IMPRESION',
  'OTRO',
] as const;
export type TemaAyuda = (typeof TEMAS_AYUDA)[number];

export const ESTADOS_SOLICITUD = [
  'PENDIENTE',
  'EN_ATENCION',
  'RESUELTA',
  'CANCELADA',
] as const;
export type EstadoSolicitud = (typeof ESTADOS_SOLICITUD)[number];

const LARGO_MAXIMO_EQUIPO = 100;
const LARGO_MAXIMO_COMENTARIO = 500;

export interface SolicitudAyudaProps {
  id: string;
  /** Texto libre que dice dónde está la persona: «12», «Equipo 12», «Mesa del fondo». */
  equipo: string;
  tema: TemaAyuda;
  estado: EstadoSolicitud;
  /** Guía y paso donde estaba la persona, si pidió ayuda desde una guía. */
  guiaId: string | null;
  pasoId: string | null;
  /** Cédula del usuario público; null si pidió ayuda sin cuenta. */
  usuarioId: string | null;
  creadaEn: Date;
  /** Cuenta del personal que la atiende o la atendió (HU-30). */
  atendidaPorId: string | null;
  tomadaEn: Date | null;
  resueltaEn: Date | null;
  /** Nota breve opcional de quien la resolvió. */
  comentarioResolucion: string | null;
  canceladaEn: Date | null;
}

/**
 * Pedido de ayuda presencial a un monitor de la sala (HU-29, HU-30). Está activa mientras
 * espera (PENDIENTE) o la atienden (EN_ATENCION); solo puede haber una activa por equipo.
 *
 *   PENDIENTE ──tomar──► EN_ATENCION ──resolver──► RESUELTA
 *       └──────cancelar──────┴──────────────────► CANCELADA
 */
export class SolicitudAyuda {
  private constructor(private readonly props: SolicitudAyudaProps) {}

  static crear(datos: {
    id: string;
    equipo: string;
    tema: TemaAyuda;
    guiaId: string | null;
    pasoId: string | null;
    usuarioId: string | null;
    ahora: Date;
  }): SolicitudAyuda {
    // Espacios de más fuera: «  equipo   12 » y «equipo 12» son el mismo equipo.
    const equipo = datos.equipo.trim().replace(/\s+/g, ' ');
    if (!equipo) {
      throw new DatoInvalidoError('equipo', 'Escribe en qué equipo estás.');
    }
    if (equipo.length > LARGO_MAXIMO_EQUIPO) {
      throw new DatoInvalidoError(
        'equipo',
        `El equipo puede tener máximo ${LARGO_MAXIMO_EQUIPO} letras.`,
      );
    }
    return new SolicitudAyuda({
      id: datos.id,
      equipo,
      tema: datos.tema,
      estado: 'PENDIENTE',
      guiaId: datos.guiaId,
      // Un paso sin su guía no dice nada.
      pasoId: datos.guiaId ? datos.pasoId : null,
      usuarioId: datos.usuarioId,
      creadaEn: datos.ahora,
      atendidaPorId: null,
      tomadaEn: null,
      resueltaEn: null,
      comentarioResolucion: null,
      canceladaEn: null,
    });
  }

  static reconstituir(props: SolicitudAyudaProps): SolicitudAyuda {
    return new SolicitudAyuda({ ...props });
  }

  get id(): string {
    return this.props.id;
  }
  get equipo(): string {
    return this.props.equipo;
  }
  get tema(): TemaAyuda {
    return this.props.tema;
  }
  get estado(): EstadoSolicitud {
    return this.props.estado;
  }
  get guiaId(): string | null {
    return this.props.guiaId;
  }
  get pasoId(): string | null {
    return this.props.pasoId;
  }
  get usuarioId(): string | null {
    return this.props.usuarioId;
  }
  get creadaEn(): Date {
    return this.props.creadaEn;
  }
  get atendidaPorId(): string | null {
    return this.props.atendidaPorId;
  }
  get tomadaEn(): Date | null {
    return this.props.tomadaEn;
  }
  get resueltaEn(): Date | null {
    return this.props.resueltaEn;
  }
  get comentarioResolucion(): string | null {
    return this.props.comentarioResolucion;
  }
  get canceladaEn(): Date | null {
    return this.props.canceladaEn;
  }

  get estaActiva(): boolean {
    return (
      this.props.estado === 'PENDIENTE' || this.props.estado === 'EN_ATENCION'
    );
  }

  /** HU-30: un monitor se hace cargo; queda a su nombre para que otro no la tome. */
  tomar(monitorId: string, ahora: Date): void {
    if (this.props.estado === 'EN_ATENCION') {
      // Doble clic del mismo monitor: ya es suya, no es un error.
      if (this.props.atendidaPorId === monitorId) return;
      throw new SolicitudYaTomadaError();
    }
    if (this.props.estado !== 'PENDIENTE') throw new SolicitudCerradaError();
    this.props.estado = 'EN_ATENCION';
    this.props.atendidaPorId = monitorId;
    this.props.tomadaEn = ahora;
  }

  /** HU-30: el monitor que la tomó ya ayudó a la persona; puede dejar una nota breve. */
  resolver(monitorId: string, comentario: string | null, ahora: Date): void {
    if (this.props.estado === 'PENDIENTE') throw new SolicitudSinTomarError();
    if (this.props.estado !== 'EN_ATENCION') throw new SolicitudCerradaError();
    if (this.props.atendidaPorId !== monitorId) {
      throw new SolicitudDeOtroMonitorError();
    }
    const nota = comentario?.trim() || null;
    if (nota && nota.length > LARGO_MAXIMO_COMENTARIO) {
      throw new DatoInvalidoError(
        'comentario',
        `El comentario puede tener máximo ${LARGO_MAXIMO_COMENTARIO} letras.`,
      );
    }
    this.props.estado = 'RESUELTA';
    this.props.comentarioResolucion = nota;
    this.props.resueltaEn = ahora;
  }

  /** Quien pidió ayuda resolvió la duda por su cuenta; sirve aunque un monitor ya vaya en camino. */
  cancelar(ahora: Date): void {
    if (!this.estaActiva) throw new SolicitudCerradaError();
    this.props.estado = 'CANCELADA';
    this.props.canceladaEn = ahora;
  }
}
