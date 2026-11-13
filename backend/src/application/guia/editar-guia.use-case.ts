import { GuiaNoEncontradaError } from '../../domain/guia/errores.js';
import { GuiaGestionRepository } from '../../domain/guia/guia-gestion.repository.js';
import { ImagenRepository } from '../../domain/imagen/imagen.repository.js';
import { GeneradorId } from '../shared/generador-id.port.js';
import { GuardarGuiaComando } from './crear-guia.use-case.js';
import {
  detalleGestion,
  GuiaGestionDetalle,
  validarCategoria,
  validarImagenes,
} from './guia-gestion.resultado.js';

/**
 * HU-13, HU-15: el personal edita los datos de una guía y, si los envía, sus pasos:
 * agregar, cambiar, quitar y reordenar en una sola vez. Vale en cualquier estado; en una
 * guía publicada los cambios se ven de inmediato.
 */
export class EditarGuiaUseCase {
  constructor(
    private readonly guias: GuiaGestionRepository,
    private readonly imagenes: ImagenRepository,
    private readonly ids: GeneradorId,
  ) {}

  async ejecutar(
    slug: string,
    { pasos, ...datos }: GuardarGuiaComando,
    actorId: string,
  ): Promise<GuiaGestionDetalle> {
    const gestionada = await this.guias.buscar(slug);
    if (!gestionada) throw new GuiaNoEncontradaError();
    const { guia } = gestionada;

    await validarCategoria(datos.categoriaSlug, this.guias);
    guia.editar(datos, actorId);
    if (pasos) {
      guia.reemplazarPasos(pasos, () => this.ids.generar(), actorId);
      await validarImagenes(guia, this.imagenes);
    }
    await this.guias.guardar(guia);
    return detalleGestion(slug, this.guias, this.imagenes);
  }
}
