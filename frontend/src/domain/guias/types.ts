export type EstadoGuia = 'PUBLICADA' | 'BORRADOR';

export interface Categoria {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  numero: string;
}

export interface EjemploSimulado {
  tipo: 'whatsapp' | 'sms' | 'llamada' | 'qr' | 'ventana';
  titulo: string;
  remitente: string;
  horaOFecha?: string;
  contenido: string;
  enlaceODetalle?: string;
  senalAlerta?: string;
  textoAlternativo: string;
}

export interface PasoGuia {
  numero: number;
  titulo: string;
  contenido: string;
  recordatorio?: {
    titulo: string;
    consejo: string;
  };
  ejemplo?: EjemploSimulado;
}

export interface OpcionPregunta {
  id: 'A' | 'B' | 'C';
  texto: string;
}

export interface PreguntaPractica {
  id: string;
  numero: number;
  enunciado: string;
  opciones: OpcionPregunta[];
  opcionCorrecta: 'A' | 'B' | 'C';
  explicacion: string;
  mensajeSimulado: EjemploSimulado;
  pistaVisual?: string;
}

export interface Guia {
  slug: string;
  numero: string; // '01', '02', '03', '04'
  titulo: string;
  subtitulo: string;
  descripcion: string;
  duracionEstimadaMinutos: number;
  nivel: 'Básico' | 'Intermedio';
  estado: EstadoGuia;
  categoriaSlug: string;
  objetivo: string;
}

export interface DetalleGuia {
  guia: Guia;
  pasos: PasoGuia[];
  preguntas: PreguntaPractica[];
}

export interface RespuestaIntento {
  preguntaId: string;
  opcionElegida: 'A' | 'B' | 'C';
  esCorrecta: boolean;
}

export interface ResultadoPractica {
  guiaSlug: string;
  totalPreguntas: number;
  aciertos: number;
  porcentaje: number;
  aprobada: boolean;
  umbralAprobacion: number; // e.g. 70%
}
