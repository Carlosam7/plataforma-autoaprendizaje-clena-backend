import { DatosAyudaInvalidosError } from '@/domain/ayuda/errors';
import {
  MAX_LARGO_EQUIPO,
  MAX_LARGO_SLUG,
  SLUG_REGEX,
  TEMAS_AYUDA,
  type SolicitarAyudaComando,
  type SolicitudCreada,
  type TemaAyuda,
} from '@/domain/ayuda/types';
import type { AyudaRepository } from './ports';

/** Lo que llega del formulario y de la URL (`/ayuda?guia=…&paso=…`). */
export interface DatosSolicitudAyuda {
  equipo: string;
  tema: TemaAyuda | '';
  guiaSlug?: string | null;
  pasoOrden?: number | null;
}

/**
 * Valida y arma el cuerpo exacto de C-05. El contexto de la guía lo pone la aplicación, no
 * la persona: si no es válido se omite en silencio en lugar de impedir pedir ayuda.
 */
export function prepararSolicitud(
  datos: DatosSolicitudAyuda,
): SolicitarAyudaComando {
  const equipo = datos.equipo.trim().replace(/\s+/g, ' ');
  if (!equipo) {
    throw new DatosAyudaInvalidosError(
      'Escribe en qué equipo estás.',
      'equipo',
    );
  }
  if (equipo.length > MAX_LARGO_EQUIPO) {
    throw new DatosAyudaInvalidosError(
      `El equipo puede tener máximo ${MAX_LARGO_EQUIPO} letras.`,
      'equipo',
    );
  }
  const tema = datos.tema;
  if (!(TEMAS_AYUDA as readonly string[]).includes(tema)) {
    throw new DatosAyudaInvalidosError(
      'Elige el tema en el que necesitas ayuda.',
      'tema',
    );
  }

  const comando: SolicitarAyudaComando = { equipo, tema: tema as TemaAyuda };
  const guiaSlug = datos.guiaSlug?.trim();
  if (
    guiaSlug &&
    guiaSlug.length <= MAX_LARGO_SLUG &&
    SLUG_REGEX.test(guiaSlug)
  ) {
    comando.guiaSlug = guiaSlug;
    // C-05: el paso solo tiene sentido junto con su guía.
    const paso = datos.pasoOrden;
    if (typeof paso === 'number' && Number.isInteger(paso) && paso >= 1) {
      comando.pasoOrden = paso;
    }
  }
  return comando;
}

/**
 * HU-29 · Llamar a un monitor. Si se pide otra vez mientras la primera petición sigue en
 * camino (doble clic), devuelve esa misma petición: nunca se envían dos POST a la vez.
 */
export class SolicitarAyuda {
  private enCurso: Promise<SolicitudCreada> | null = null;

  constructor(private readonly repository: AyudaRepository) {}

  ejecutar(datos: DatosSolicitudAyuda): Promise<SolicitudCreada> {
    if (this.enCurso) return this.enCurso;
    let comando: SolicitarAyudaComando;
    try {
      comando = prepararSolicitud(datos);
    } catch (error) {
      return Promise.reject(error);
    }
    const peticion = this.repository.solicitar(comando).finally(() => {
      this.enCurso = null;
    });
    this.enCurso = peticion;
    return peticion;
  }
}
