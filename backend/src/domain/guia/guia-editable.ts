import { DatoInvalidoError } from '../shared/error-de-negocio.js';
import { ContenidoPaso } from './contenido-paso.js';
import { GuiaNoPublicadaError, GuiaSinPasosError } from './errores.js';
import { EstadoGuia, NIVELES_GUIA, NivelGuia } from './guia.js';

/** Lo que el personal escribe en el formulario de la guía. */
export interface DatosGuia {
  titulo: string;
  /** «Al terminar sabrás…» */
  objetivo: string;
  descripcion: string | null;
  categoriaSlug: string;
  nivel: NivelGuia;
  duracionEstimadaMin: number;
  /** Palabras con las que la gente la buscaría (HU-11). */
  palabrasClave: string[];
}

export interface PasoEditable {
  id: string;
  titulo: string | null;
  contenido: ContenidoPaso;
}

/** Un paso como llega del formulario: con `id` si ya existía, sin él si es nuevo. */
export interface PasoEntrada {
  id?: string;
  titulo?: string | null;
  bloques: unknown;
}

export interface GuiaEditableProps extends DatosGuia {
  id: string;
  slug: string;
  estado: EstadoGuia;
  publicadaEn: Date | null;
  creadaPorId: string;
  actualizadaPorId: string;
  /** En el orden en que se muestran. */
  pasos: PasoEditable[];
}

const MAX_TITULO = 150;
const MAX_OBJETIVO = 300;
const MAX_DURACION_MIN = 600;
const MAX_PALABRAS_CLAVE = 15;
const MAX_PALABRA_CLAVE = 40;
const MAX_TITULO_PASO = 120;
const MAX_PASOS = 50;

/**
 * La guía completa como la administra el personal (HU-13, HU-15): sus datos, su lista
 * ordenada de pasos y su estado. Nace en BORRADOR y el público solo la ve PUBLICADA.
 */
export class GuiaEditable {
  private constructor(private readonly props: GuiaEditableProps) {}

  static crear(datos: {
    id: string;
    slug: string;
    datos: DatosGuia;
    actorId: string;
  }): GuiaEditable {
    return new GuiaEditable({
      ...validarDatos(datos.datos),
      id: datos.id,
      slug: datos.slug,
      estado: 'BORRADOR',
      publicadaEn: null,
      creadaPorId: datos.actorId,
      actualizadaPorId: datos.actorId,
      pasos: [],
    });
  }

  static reconstituir(props: GuiaEditableProps): GuiaEditable {
    return new GuiaEditable({ ...props, pasos: [...props.pasos] });
  }

  get id(): string {
    return this.props.id;
  }
  get slug(): string {
    return this.props.slug;
  }
  get datos(): DatosGuia {
    const { titulo, objetivo, descripcion, categoriaSlug, nivel } = this.props;
    const { duracionEstimadaMin, palabrasClave } = this.props;
    return {
      titulo,
      objetivo,
      descripcion,
      categoriaSlug,
      nivel,
      duracionEstimadaMin,
      palabrasClave: [...palabrasClave],
    };
  }
  get estado(): EstadoGuia {
    return this.props.estado;
  }
  get publicadaEn(): Date | null {
    return this.props.publicadaEn;
  }
  get creadaPorId(): string {
    return this.props.creadaPorId;
  }
  get actualizadaPorId(): string {
    return this.props.actualizadaPorId;
  }
  get pasos(): readonly PasoEditable[] {
    return this.props.pasos;
  }

  /** Ids de las imágenes que usan los pasos, para comprobar que existen. */
  get imagenIds(): string[] {
    return this.props.pasos.flatMap((p) =>
      p.contenido.bloques.flatMap((b) =>
        b.tipo === 'imagen' ? [b.imagenId] : [],
      ),
    );
  }

  /** El slug no cambia: es la dirección de la guía en enlaces y códigos QR. */
  editar(datos: DatosGuia, actorId: string): void {
    Object.assign(this.props, validarDatos(datos));
    this.props.actualizadaPorId = actorId;
  }

  /**
   * Deja los pasos tal como llegan, en ese orden: los que traen `id` se conservan (y con
   * ellos el progreso de quienes los leyeron), los que no son nuevos y los que faltan se quitan.
   */
  reemplazarPasos(
    entradas: readonly PasoEntrada[],
    generarId: () => string,
    actorId: string,
  ): void {
    if (entradas.length > MAX_PASOS) {
      throw new DatoInvalidoError(
        'pasos',
        `Una guía puede tener máximo ${MAX_PASOS} pasos.`,
      );
    }
    if (this.props.estado === 'PUBLICADA' && entradas.length === 0) {
      throw new GuiaSinPasosError();
    }
    const propios = new Set(this.props.pasos.map((p) => p.id));
    const vistos = new Set<string>();
    this.props.pasos = entradas.map((entrada) => {
      if (entrada.id !== undefined) {
        if (!propios.has(entrada.id) || vistos.has(entrada.id)) {
          throw new DatoInvalidoError(
            'pasos',
            'Uno de los pasos no es de esta guía. Vuelve a abrirla e inténtalo de nuevo.',
          );
        }
        vistos.add(entrada.id);
      }
      const titulo = entrada.titulo?.trim() || null;
      if (titulo && titulo.length > MAX_TITULO_PASO) {
        throw new DatoInvalidoError(
          'pasos',
          `El título de un paso puede tener máximo ${MAX_TITULO_PASO} letras.`,
        );
      }
      return {
        id: entrada.id ?? generarId(),
        titulo,
        contenido: ContenidoPaso.crear(entrada.bloques),
      };
    });
    this.props.actualizadaPorId = actorId;
  }

  /** Pasa al catálogo público. Vale para un borrador y para volver a mostrar una oculta. */
  publicar(ahora: Date, actorId: string): void {
    if (this.props.pasos.length === 0) throw new GuiaSinPasosError();
    this.props.estado = 'PUBLICADA';
    // La fecha de la primera publicación se conserva aunque se oculte y se vuelva a publicar.
    this.props.publicadaEn ??= ahora;
    this.props.actualizadaPorId = actorId;
  }

  /** Sale del catálogo sin borrarse: el progreso de los usuarios en ella se conserva. */
  ocultar(actorId: string): void {
    if (this.props.estado === 'BORRADOR') throw new GuiaNoPublicadaError();
    this.props.estado = 'OCULTA';
    this.props.actualizadaPorId = actorId;
  }
}

function validarDatos(datos: DatosGuia): DatosGuia {
  const titulo = datos.titulo.trim();
  if (!titulo || titulo.length > MAX_TITULO) {
    throw new DatoInvalidoError(
      'titulo',
      `Escribe el título de la guía (máximo ${MAX_TITULO} letras).`,
    );
  }
  const objetivo = datos.objetivo.trim();
  if (!objetivo || objetivo.length > MAX_OBJETIVO) {
    throw new DatoInvalidoError(
      'objetivo',
      `Escribe el objetivo de la guía (máximo ${MAX_OBJETIVO} letras).`,
    );
  }
  if (!NIVELES_GUIA.includes(datos.nivel)) {
    throw new DatoInvalidoError('nivel', 'Elige un nivel de la lista.');
  }
  const duracion = datos.duracionEstimadaMin;
  if (
    !Number.isInteger(duracion) ||
    duracion < 1 ||
    duracion > MAX_DURACION_MIN
  ) {
    throw new DatoInvalidoError(
      'duracionEstimadaMin',
      `La duración debe ser un número de minutos entre 1 y ${MAX_DURACION_MIN}.`,
    );
  }
  // Sin vacías ni repetidas («Correo» y «correo» son la misma).
  const palabrasClave = [
    ...new Map(
      datos.palabrasClave
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => [p.toLowerCase(), p]),
    ).values(),
  ];
  if (
    palabrasClave.length > MAX_PALABRAS_CLAVE ||
    palabrasClave.some((p) => p.length > MAX_PALABRA_CLAVE)
  ) {
    throw new DatoInvalidoError(
      'palabrasClave',
      `Escribe máximo ${MAX_PALABRAS_CLAVE} palabras clave, de hasta ${MAX_PALABRA_CLAVE} letras cada una.`,
    );
  }
  return {
    titulo,
    objetivo,
    descripcion: datos.descripcion?.trim() || null,
    categoriaSlug: datos.categoriaSlug,
    nivel: datos.nivel,
    duracionEstimadaMin: duracion,
    palabrasClave,
  };
}
