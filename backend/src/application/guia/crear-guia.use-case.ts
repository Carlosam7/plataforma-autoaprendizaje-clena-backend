import {
  DatosGuia,
  GuiaEditable,
  PasoEntrada,
} from '../../domain/guia/guia-editable.js';
import { GuiaGestionRepository } from '../../domain/guia/guia-gestion.repository.js';
import { slugDesdeTitulo } from '../../domain/guia/slug.js';
import { ImagenRepository } from '../../domain/imagen/imagen.repository.js';
import { GeneradorId } from '../shared/generador-id.port.js';
import {
  detalleGestion,
  GuiaGestionDetalle,
  validarCategoria,
  validarImagenes,
} from './guia-gestion.resultado.js';

export interface GuardarGuiaComando extends DatosGuia {
  /** Al crear: los pasos iniciales. Al editar: si no viene, los pasos no se tocan. */
  pasos?: PasoEntrada[];
}

/** HU-13: el personal crea una guía. Nace en borrador: el público no la ve hasta publicarla. */
export class CrearGuiaUseCase {
  constructor(
    private readonly guias: GuiaGestionRepository,
    private readonly imagenes: ImagenRepository,
    private readonly ids: GeneradorId,
  ) {}

  async ejecutar(
    { pasos, ...datos }: GuardarGuiaComando,
    actorId: string,
  ): Promise<GuiaGestionDetalle> {
    await validarCategoria(datos.categoriaSlug, this.guias);
    const guia = GuiaEditable.crear({
      id: this.ids.generar(),
      slug: await this.slugLibre(datos.titulo),
      datos,
      actorId,
    });
    if (pasos) {
      guia.reemplazarPasos(pasos, () => this.ids.generar(), actorId);
      await validarImagenes(guia, this.imagenes);
    }
    await this.guias.guardar(guia);
    return detalleGestion(guia.slug, this.guias, this.imagenes);
  }

  /** Si ya hay una guía con ese slug: «enviar-un-correo-2», «-3»… */
  private async slugLibre(titulo: string): Promise<string> {
    const base = slugDesdeTitulo(titulo);
    let slug = base;
    for (let n = 2; await this.guias.existeSlug(slug); n += 1) {
      slug = `${base}-${n}`;
    }
    return slug;
  }
}
