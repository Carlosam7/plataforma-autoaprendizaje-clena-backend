import { ActividadRepository } from '../../domain/practica/actividad.repository.js';
import { ActividadNoEncontradaError } from '../../domain/practica/errores.js';
import { Intento } from '../../domain/practica/intento.js';
import { IntentoRepository } from '../../domain/practica/intento.repository.js';
import { GeneradorId } from '../shared/generador-id.port.js';
import { Reloj } from '../shared/reloj.port.js';

export interface IntentoIniciado {
  id: string;
  totalPreguntas: number;
}

/** HU-21: empieza (o repite) la actividad de una guía para un usuario público autenticado. */
export class IniciarIntentoUseCase {
  constructor(
    private readonly actividades: ActividadRepository,
    private readonly intentos: IntentoRepository,
    private readonly ids: GeneradorId,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    slugGuia: string,
    usuarioId: string,
  ): Promise<IntentoIniciado> {
    const actividad = await this.actividades.buscarDeGuiaPublicada(slugGuia);
    if (!actividad) throw new ActividadNoEncontradaError();

    const intento = Intento.iniciar({
      id: this.ids.generar(),
      actividad,
      usuarioId,
      ahora: this.reloj.ahora(),
    });
    await this.intentos.crear(intento);
    return { id: intento.id, totalPreguntas: intento.totalPreguntas };
  }
}
