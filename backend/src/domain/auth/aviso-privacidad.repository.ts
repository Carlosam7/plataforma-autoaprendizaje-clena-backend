export interface AvisoPrivacidad {
  version: string;
  /** Texto que se muestra al usuario: qué datos se guardan, para qué y cómo eliminarlos. */
  contenido: string;
  vigenteDesde: Date;
}

/** Ley 1581 de 2012: el aviso vigente es el que acepta quien se registra. */
export abstract class AvisoPrivacidadRepository {
  /** El aviso con la fecha de vigencia más reciente que no sea futura, o null si no hay. */
  abstract vigente(ahora: Date): Promise<AvisoPrivacidad | null>;
}
