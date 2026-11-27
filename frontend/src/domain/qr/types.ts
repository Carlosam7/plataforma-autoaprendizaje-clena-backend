/** HU-45: un enlace público estable al que apunta un código QR impreso en la sala. */
export interface EnlacePublico {
  tipo: 'INICIO' | 'CATEGORIA' | 'GUIA';
  titulo: string;
  /** Ruta dentro de la app, p. ej. `/guias/smishing`. */
  ruta: string;
  /** URL completa que lleva el QR, p. ej. `https://kama.example/guias/smishing`. */
  url: string;
}

export interface EnlacesPublicos {
  enlaces: EnlacePublico[];
  /** Base usada para las URL, sin `/` final. */
  urlBase: string;
  /**
   * true si la base es localhost o 127.0.0.1: el QR solo funciona en este equipo y no se
   * debe imprimir (FE-11). Se configura con VITE_URL_PUBLICA.
   */
  esLocal: boolean;
}

export class UrlPublicaInvalidaError extends Error {
  constructor(valor: string) {
    super(
      `La URL pública «${valor}» no es válida. Configura VITE_URL_PUBLICA con una dirección http o https.`,
    );
    this.name = 'UrlPublicaInvalidaError';
  }
}
