import { TemaAyuda } from '../ayuda/solicitud-ayuda.js';

export interface ConsultasDeGuia {
  slug: string;
  titulo: string;
  consultas: number;
}

export interface ConsultasDeCategoria {
  slug: string;
  nombre: string;
  consultas: number;
}

export interface SolicitudesDeTema {
  tema: TemaAyuda;
  cantidad: number;
}

/** Cifras de un periodo. Las listas solo traen lo que tuvo al menos un evento. */
export interface Agregados {
  consultasGuias: number;
  solicitudesAyuda: number;
  /** Máximo `limiteTop`, de más a menos consultas; empate: por slug. */
  topGuias: ConsultasDeGuia[];
  /** De más a menos consultas; empate: por slug. */
  consultasPorCategoria: ConsultasDeCategoria[];
  /** De más a menos solicitudes; empate: por tema. */
  solicitudesPorTema: SolicitudesDeTema[];
}

/**
 * HU-31: cuenta en la base las aperturas de guías (consulta_guia) y las solicitudes de
 * ayuda (solicitud_ayuda) entre `inicio` (incluido) y `fin` (excluido). Incluye las guías
 * ocultas o en borrador y las consultas sin cuenta.
 */
export abstract class EstadisticaRepository {
  abstract agregar(
    inicio: Date,
    fin: Date,
    limiteTop: number,
  ): Promise<Agregados>;
}
