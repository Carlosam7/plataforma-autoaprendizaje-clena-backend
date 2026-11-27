import type { GuiasRepository } from '../../application/guias/ports';
import { CatalogoError } from '../../domain/guias/errors';
import type {
  BloquePaso,
  Categoria,
  DetalleGuia,
  Guia,
  NivelGuia,
  PasoGuia,
} from '../../domain/guias/types';

interface GuiaResumenBackend {
  slug: string;
  categoria: string;
  titulo: string;
  objetivo: string;
  nivel: 'BASICO' | 'INTERMEDIO' | 'AVANZADO';
  duracionEstimadaMin: number;
}

interface GuiasPaginadasBackend {
  datos: GuiaResumenBackend[];
  total: number;
  pagina: number;
  limite: number;
}

interface BloqueBackend {
  tipo: 'texto' | 'imagen' | 'aviso';
  texto?: string;
  nivel?: 'consejo' | 'alerta';
  url?: string;
  textoAlternativo?: string;
}

interface PasoBackend {
  orden: number;
  titulo: string | null;
  bloques: BloqueBackend[];
}

interface DetalleGuiaBackend extends GuiaResumenBackend {
  totalPasos: number;
  tieneActividad: boolean;
  pasos: PasoBackend[];
}

function mapearNivel(nivel: 'BASICO' | 'INTERMEDIO' | 'AVANZADO'): NivelGuia {
  switch (nivel) {
    case 'BASICO':
      return 'Básico';
    case 'INTERMEDIO':
      return 'Intermedio';
    case 'AVANZADO':
      return 'Avanzado';
    default:
      return 'Básico';
  }
}

const METADATA_CATEGORIAS: Record<
  string,
  { descripcion: string; numero: string }
> = {
  'seguridad-digital': {
    numero: '01 / CATEGORÍA',
    descripcion:
      'Reconoce los engaños antes de actuar. Algunas personas se hacen pasar por alguien de confianza para pedirte datos o dinero. Aprende a reconocer sus señales en mensajes, llamadas, códigos QR y alertas falsas.',
  },
  'correo-electronico': {
    numero: '02 / CATEGORÍA',
    descripcion:
      'Comunícate por escrito con tranquilidad. Aprende a crear tu cuenta, enviar y responder mensajes, adjuntar documentos y fotos, y proteger tu información.',
  },
  'busqueda-internet': {
    numero: '03 / CATEGORÍA',
    descripcion:
      'Encuentra respuestas confiables en la web. Aprende a escribir lo que buscas, comparar fuentes de información y evitar enlaces engañosos.',
  },
  documentos: {
    numero: '04 / CATEGORÍA',
    descripcion:
      'Escribe, guarda y organiza tus textos. Aprende a redactar cartas, notas y documentos digitales sin miedo a perder lo que has hecho.',
  },
  'redes-sociales': {
    numero: '05 / CATEGORÍA',
    descripcion:
      'Conéctate con amigos y familiares cuidando tu privacidad. Aprende a comunicarte por mensajería web y a proteger lo que compartes.',
  },
};

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

function esPaginada(v: unknown): v is { datos: unknown[] } {
  return esObjeto(v) && Array.isArray(v.datos);
}

const esCategoriasPaginadas = (
  v: unknown,
): v is { datos: { slug: string; nombre: string; icono: string }[] } =>
  esPaginada(v) &&
  v.datos.every(
    (c) =>
      esObjeto(c) && typeof c.slug === 'string' && typeof c.nombre === 'string',
  );

const esResumenGuia = (g: unknown): g is GuiaResumenBackend =>
  esObjeto(g) &&
  typeof g.slug === 'string' &&
  typeof g.titulo === 'string' &&
  typeof g.categoria === 'string' &&
  typeof g.objetivo === 'string' &&
  typeof g.nivel === 'string' &&
  typeof g.duracionEstimadaMin === 'number';

const esGuiasPaginadas = (v: unknown): v is GuiasPaginadasBackend =>
  esPaginada(v) && v.datos.every(esResumenGuia);

const esDetalleGuia = (v: unknown): v is DetalleGuiaBackend =>
  esResumenGuia(v) &&
  Array.isArray((v as { pasos?: unknown }).pasos) &&
  (v as unknown as DetalleGuiaBackend).pasos.every(
    (p) =>
      esObjeto(p) && typeof p.orden === 'number' && Array.isArray(p.bloques),
  );

const TIMEOUT_MS = 10_000;

export class HttpGuiasRepository implements GuiasRepository {
  constructor(private readonly baseUrl: string = '/api/v1') {}

  /** GET JSON. Devuelve null solo ante 404; todo otro fallo lanza CatalogoError. */
  private async obtenerJson<T>(
    ruta: string,
    esValido: (data: unknown) => data is T,
  ): Promise<T | null> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${ruta}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'TimeoutError') {
        throw new CatalogoError(
          'El servidor tardó demasiado en responder.',
          'TIMEOUT',
        );
      }
      throw new CatalogoError(
        'No pudimos conectarnos con el servidor.',
        'CONEXION',
      );
    }

    if (res.status === 404) return null;
    if (!res.ok) {
      throw new CatalogoError(
        'El servidor no pudo atender la solicitud.',
        'SERVIDOR',
        res.status,
      );
    }

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      throw new CatalogoError(
        'El servidor envió una respuesta que no se puede leer.',
        'RESPUESTA_INVALIDA',
        res.status,
      );
    }
    if (!esValido(data)) {
      throw new CatalogoError(
        'El servidor envió una respuesta inesperada.',
        'RESPUESTA_INVALIDA',
        res.status,
      );
    }
    return data;
  }

  private async requerirJson<T>(
    ruta: string,
    esValido: (data: unknown) => data is T,
  ): Promise<T> {
    const data = await this.obtenerJson(ruta, esValido);
    if (data === null) {
      throw new CatalogoError(
        'El servidor no encontró el recurso solicitado.',
        'SERVIDOR',
        404,
      );
    }
    return data;
  }

  async listarCategorias(): Promise<Categoria[]> {
    const json = await this.requerirJson(
      '/categorias?limite=50&ordenarPor=orden&direccion=asc',
      esCategoriasPaginadas,
    );
    return json.datos.map((cat, index) => {
      const meta = METADATA_CATEGORIAS[cat.slug] || {
        numero: `${String(index + 1).padStart(2, '0')} / CATEGORÍA`,
        descripcion: `Aprende y practica temas de ${cat.nombre.toLowerCase()} a tu propio ritmo.`,
      };
      return {
        id: `cat-${cat.slug}`,
        slug: cat.slug,
        nombre: cat.nombre,
        icono: cat.icono,
        numero: meta.numero,
        descripcion: meta.descripcion,
      };
    });
  }

  async obtenerCategoria(slug: string): Promise<Categoria | null> {
    const slugNormalizado = slug === 'phishing' ? 'seguridad-digital' : slug;
    const categorias = await this.listarCategorias();
    return categorias.find((c) => c.slug === slugNormalizado) ?? null;
  }

  async listarGuiasPublicadas(categoriaSlug?: string): Promise<Guia[]> {
    const slugNormalizado =
      categoriaSlug === 'phishing' ? 'seguridad-digital' : categoriaSlug;
    const ruta = slugNormalizado
      ? `/guias?categoria=${encodeURIComponent(slugNormalizado)}`
      : '/guias';

    const json = await this.requerirJson(ruta, esGuiasPaginadas);
    return json.datos.map((g, index) => ({
      slug: g.slug,
      numero: String(index + 1).padStart(2, '0'),
      titulo: g.titulo,
      subtitulo: g.objetivo,
      descripcion: g.objetivo,
      duracionEstimadaMinutos: g.duracionEstimadaMin,
      nivel: mapearNivel(g.nivel),
      estado: 'PUBLICADA',
      categoriaSlug: g.categoria,
      objetivo: g.objetivo,
    }));
  }

  async obtenerDetalleGuia(slug: string): Promise<DetalleGuia | null> {
    const data = await this.obtenerJson(
      `/guias/${encodeURIComponent(slug)}`,
      esDetalleGuia,
    );
    if (data === null) return null;

    const pasos: PasoGuia[] = data.pasos.map((p) => {
      const contenido = p.bloques
        .filter((b) => b.tipo === 'texto' && b.texto)
        .map((b) => b.texto as string)
        .join('\n\n');
      const primerAviso = p.bloques.find((b) => b.tipo === 'aviso');

      return {
        numero: p.orden,
        titulo: p.titulo,
        contenido,
        bloques: p.bloques as BloquePaso[],
        recordatorio: primerAviso?.texto
          ? {
              titulo: primerAviso.nivel === 'alerta' ? 'Atención' : 'Recuerda',
              consejo: primerAviso.texto,
            }
          : undefined,
      };
    });

    return {
      guia: {
        slug: data.slug,
        numero: '',
        titulo: data.titulo,
        subtitulo: data.objetivo,
        descripcion: data.objetivo,
        duracionEstimadaMinutos: data.duracionEstimadaMin,
        nivel: mapearNivel(data.nivel),
        estado: 'PUBLICADA',
        categoriaSlug: data.categoria,
        objetivo: data.objetivo,
      },
      totalPasos: data.totalPasos,
      tieneActividad: data.tieneActividad,
      pasos,
      // El backend aún no expone preguntas de práctica (BE-01 / C-04).
      preguntas: [],
    };
  }

  async registrarAperturaGuia(slug: string): Promise<void> {
    try {
      await fetch(
        `${this.baseUrl}/guias/${encodeURIComponent(slug)}/consultas`,
        {
          method: 'POST',
          credentials: 'include',
          signal: AbortSignal.timeout(TIMEOUT_MS),
        },
      );
    } catch {
      // La telemetría no debe bloquear la lectura del usuario
    }
  }
}
