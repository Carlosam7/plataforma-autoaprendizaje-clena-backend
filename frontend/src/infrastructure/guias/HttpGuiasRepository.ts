import type { GuiasRepository } from '../../application/guias/ports';
import type {
  BloquePaso,
  Categoria,
  DetalleGuia,
  Guia,
  NivelGuia,
  PasoGuia,
} from '../../domain/guias/types';
import { InMemoryGuiasRepository } from './InMemoryGuiasRepository';

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

export class HttpGuiasRepository implements GuiasRepository {
  private readonly fallback: InMemoryGuiasRepository;

  constructor(
    private readonly baseUrl: string = '/api/v1',
    fallback?: InMemoryGuiasRepository,
  ) {
    this.fallback = fallback ?? new InMemoryGuiasRepository();
  }

  async obtenerCategoria(slug: string): Promise<Categoria | null> {
    const slugNormalizado = slug === 'phishing' ? 'seguridad-digital' : slug;
    try {
      const res = await fetch(`${this.baseUrl}/categorias?limite=50`);
      if (res.ok) {
        const json = (await res.json()) as {
          datos: { slug: string; nombre: string; icono: string }[];
        };
        const cat = json.datos.find((c) => c.slug === slugNormalizado);
        if (cat) {
          return {
            id: `cat-${cat.slug}`,
            slug: cat.slug,
            nombre: cat.nombre,
            descripcion:
              'Reconoce los engaños antes de actuar. Algunas personas se hacen pasar por alguien de confianza para pedirte datos o dinero. Aprende a reconocer sus señales en mensajes, llamadas, códigos QR y alertas falsas.',
            numero: '01 / CATEGORÍA',
          };
        }
      }
    } catch {
      // Usar fallback si el backend no está disponible
    }
    return this.fallback.obtenerCategoria(slugNormalizado);
  }

  async listarGuiasPublicadas(categoriaSlug?: string): Promise<Guia[]> {
    const slugNormalizado =
      categoriaSlug === 'phishing' ? 'seguridad-digital' : categoriaSlug;

    try {
      const url = slugNormalizado
        ? `${this.baseUrl}/guias?categoria=${encodeURIComponent(slugNormalizado)}`
        : `${this.baseUrl}/guias`;

      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const json = (await res.json()) as GuiasPaginadasBackend;
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
    } catch {
      // Fallback local ante desconexión
    }

    return this.fallback.listarGuiasPublicadas(slugNormalizado);
  }

  async obtenerDetalleGuia(slug: string): Promise<DetalleGuia | null> {
    const fallbackDetalle = await this.fallback.obtenerDetalleGuia(slug);

    try {
      const res = await fetch(
        `${this.baseUrl}/guias/${encodeURIComponent(slug)}`,
        {
          headers: { Accept: 'application/json' },
        },
      );

      if (res.status === 404) {
        return null;
      }

      if (res.ok) {
        const data = (await res.json()) as DetalleGuiaBackend;

        const pasos: PasoGuia[] = data.pasos.map((p) => {
          const fallbackPaso = fallbackDetalle?.pasos.find(
            (fp) => fp.numero === p.orden,
          );

          const textoBloque =
            p.bloques.find((b) => b.tipo === 'texto')?.texto ||
            fallbackPaso?.contenido ||
            '';

          const avisoBloque = p.bloques.find((b) => b.tipo === 'aviso');

          return {
            numero: p.orden,
            titulo: p.titulo || `Paso ${p.orden} de ${data.totalPasos}`,
            contenido: textoBloque,
            bloques: p.bloques as BloquePaso[],
            recordatorio: avisoBloque?.texto
              ? {
                  titulo:
                    avisoBloque.nivel === 'alerta' ? 'Atención' : 'Recuerda',
                  consejo: avisoBloque.texto,
                }
              : fallbackPaso?.recordatorio,
            ejemplo: fallbackPaso?.ejemplo,
          };
        });

        return {
          guia: {
            slug: data.slug,
            numero: fallbackDetalle?.guia.numero || '01',
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
          preguntas: fallbackDetalle?.preguntas || [],
        };
      }
    } catch {
      // Fallback local ante desconexión
    }

    return fallbackDetalle;
  }

  async registrarAperturaGuia(slug: string): Promise<void> {
    try {
      await fetch(
        `${this.baseUrl}/guias/${encodeURIComponent(slug)}/consultas`,
        {
          method: 'POST',
          credentials: 'include',
        },
      );
    } catch {
      // La telemetría no debe bloquear la lectura del usuario
    }
  }
}
