import {
  ESTADOS_SOLICITUD,
  TEMAS_AYUDA,
  type EstadoSolicitud,
  type TemaAyuda,
} from './types';

export { ESTADOS_SOLICITUD, TEMAS_AYUDA };
export type { EstadoSolicitud, TemaAyuda };

export const ETIQUETA_TEMA: Record<TemaAyuda, string> = {
  CORREO: 'Correo electrónico',
  BUSQUEDA_INTERNET: 'Búsqueda en internet',
  DOCUMENTOS: 'Documentos',
  REDES_SOCIALES: 'Redes sociales',
  SEGURIDAD_DIGITAL: 'Seguridad digital',
  USO_DEL_EQUIPO: 'Uso del equipo',
  IMPRESION: 'Impresión',
  OTRO: 'Otro',
};

export const LARGO_MAXIMO_COMENTARIO = 500;

export interface SolicitudEnCola {
  id: string;
  equipo: string;
  tema: TemaAyuda;
  estado: EstadoSolicitud;
  guia: { slug: string; titulo: string } | null;
  paso: number | null;
  creadaEn: Date;
  /** Nombre del monitor (el contrato no expone su id). */
  atendidaPor: string | null;
  tomadaEn: Date | null;
  resueltaEn: Date | null;
  comentarioResolucion: string | null;
}

export interface ListarSolicitudesCriterio {
  estado?: EstadoSolicitud;
  tema?: TemaAyuda;
  pagina?: number;
  limite?: number;
}

export interface SolicitudesPaginadas {
  datos: SolicitudEnCola[];
  total: number;
  pagina: number;
  limite: number;
}
