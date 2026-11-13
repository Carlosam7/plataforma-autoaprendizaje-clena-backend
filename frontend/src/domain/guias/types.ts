export type EstadoGuia = 'PUBLICADA' | 'BORRADOR' | 'OCULTA';
export type NivelGuia = 'Básico' | 'Intermedio' | 'Avanzado';

export interface Categoria {
  id?: string;
  slug: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  numero?: string;
}

export type BloquePaso =
  | { tipo: 'texto'; texto: string }
  | { tipo: 'imagen'; url: string; textoAlternativo: string }
  | { tipo: 'aviso'; nivel: 'consejo' | 'alerta'; texto: string };

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
  titulo: string | null;
  contenido: string;
  bloques?: BloquePaso[];
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
  subtitulo?: string;
  descripcion?: string;
  duracionEstimadaMinutos: number;
  nivel: NivelGuia;
  estado: EstadoGuia;
  categoriaSlug: string;
  objetivo: string;
}

export interface DetalleGuia {
  guia: Guia;
  totalPasos: number;
  tieneActividad: boolean;
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
