import { GuiaNoEncontradaError } from '../../domain/guia/errores.js';
import { GuiaEditable } from '../../domain/guia/guia-editable.js';
import { GuiaGestionRepository } from '../../domain/guia/guia-gestion.repository.js';
import { ImagenRepository } from '../../domain/imagen/imagen.repository.js';
import { Reloj } from '../shared/reloj.port.js';
import {
  detalleGestion,
  GuiaGestionDetalle,
} from './guia-gestion.resultado.js';

async function cambiarEstado(
  slug: string,
  guias: GuiaGestionRepository,
  imagenes: ImagenRepository,
  cambio: (guia: GuiaEditable) => void,
): Promise<GuiaGestionDetalle> {
  const gestionada = await guias.buscar(slug);
  if (!gestionada) throw new GuiaNoEncontradaError();
  cambio(gestionada.guia);
  await guias.guardar(gestionada.guia);
  return detalleGestion(slug, guias, imagenes);
}

/** HU-15: la guía pasa al catálogo público. Necesita al menos un paso. */
export class PublicarGuiaUseCase {
  constructor(
    private readonly guias: GuiaGestionRepository,
    private readonly imagenes: ImagenRepository,
    private readonly reloj: Reloj,
  ) {}

  ejecutar(slug: string, actorId: string): Promise<GuiaGestionDetalle> {
    return cambiarEstado(slug, this.guias, this.imagenes, (guia) =>
      guia.publicar(this.reloj.ahora(), actorId),
    );
  }
}

/** HU-15: la guía sale del catálogo, pero no se borra ni se pierde el progreso en ella. */
export class OcultarGuiaUseCase {
  constructor(
    private readonly guias: GuiaGestionRepository,
    private readonly imagenes: ImagenRepository,
  ) {}

  ejecutar(slug: string, actorId: string): Promise<GuiaGestionDetalle> {
    return cambiarEstado(slug, this.guias, this.imagenes, (guia) =>
      guia.ocultar(actorId),
    );
  }
}
