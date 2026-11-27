import type { CriterioGuiasGestion, GestionGuiasRepository } from './ports';
import { PersonalError } from '@/domain/personal/errors';
import {
  type GuardarGuiaComando,
  type GuiaGestionDetalle,
  type GuiasGestionPaginadas,
  validarGuia,
} from '@/domain/gestion/types';

/** Error de un formulario con todos sus campos mal llenados, antes de llamar al servidor. */
export class GuiaInvalidaError extends PersonalError {
  constructor(readonly errores: { campo: string; mensaje: string }[]) {
    super(errores[0].mensaje, 400, 'DATOS_INVALIDOS', errores[0].campo);
    this.name = 'GuiaInvalidaError';
  }
}

/** Quita espacios sobrantes y palabras clave vacías antes de guardar. */
function normalizar(comando: GuardarGuiaComando): GuardarGuiaComando {
  return {
    ...comando,
    titulo: comando.titulo.trim(),
    objetivo: comando.objetivo.trim(),
    descripcion: comando.descripcion?.trim() || null,
    palabrasClave: comando.palabrasClave.map((p) => p.trim()).filter(Boolean),
    pasos: comando.pasos?.map((p) => ({
      ...(p.id ? { id: p.id } : {}),
      titulo: p.titulo?.trim() || null,
      // El `url` de las imágenes solo sirve para verlas: el backend no lo necesita.
      bloques: p.bloques.map((b) =>
        b.tipo === 'imagen'
          ? {
              tipo: 'imagen',
              imagenId: b.imagenId,
              textoAlternativo: b.textoAlternativo.trim(),
            }
          : { ...b, texto: b.texto.trim() },
      ),
    })),
  };
}

/** HU-13: las guías del personal, en cualquier estado. */
export class ListarGuiasGestion {
  constructor(private readonly repository: GestionGuiasRepository) {}
  ejecutar(
    criterio: CriterioGuiasGestion = {},
  ): Promise<GuiasGestionPaginadas> {
    return this.repository.listar({
      ordenarPor: 'actualizadoEn',
      direccion: 'desc',
      limite: 100,
      ...criterio,
    });
  }
}

/** HU-13: una guía con sus pasos, para editarla. */
export class ObtenerGuiaGestion {
  constructor(private readonly repository: GestionGuiasRepository) {}
  ejecutar(slug: string): Promise<GuiaGestionDetalle> {
    return this.repository.obtener(slug);
  }
}

/**
 * HU-13, HU-15: crea la guía (queda en BORRADOR) o guarda sus cambios. Valida antes con
 * las mismas reglas del backend y lanza GuiaInvalidaError con todos los errores.
 */
export class GuardarGuia {
  constructor(private readonly repository: GestionGuiasRepository) {}
  async ejecutar(
    comando: GuardarGuiaComando,
    slug?: string,
  ): Promise<GuiaGestionDetalle> {
    const limpio = normalizar(comando);
    const errores = validarGuia(limpio);
    if (errores.length > 0) throw new GuiaInvalidaError(errores);
    return slug
      ? this.repository.editar(slug, limpio)
      : this.repository.crear(limpio);
  }
}

/** HU-15: la guía aparece en el catálogo. Necesita al menos un paso. */
export class PublicarGuia {
  constructor(private readonly repository: GestionGuiasRepository) {}
  async ejecutar(guia: GuiaGestionDetalle): Promise<GuiaGestionDetalle> {
    if (guia.totalPasos === 0) {
      throw new PersonalError(
        'Agrega al menos un paso antes de publicar la guía.',
        409,
        'GUIA_SIN_PASOS',
      );
    }
    return this.repository.publicar(guia.slug);
  }
}

/** HU-15: la guía sale del catálogo; se conservan sus datos y el progreso de los usuarios. */
export class OcultarGuia {
  constructor(private readonly repository: GestionGuiasRepository) {}
  ejecutar(slug: string): Promise<GuiaGestionDetalle> {
    return this.repository.ocultar(slug);
  }
}
