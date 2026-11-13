import { Rol } from '../../domain/auth/tipos.js';
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

/** HU-21: empieza (o repite) la actividad de una guía. Sin cuenta también se puede practicar. */
export class IniciarIntentoUseCase {
  constructor(
    private readonly actividades: ActividadRepository,
    private readonly intentos: IntentoRepository,
    private readonly ids: GeneradorId,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    slugGuia: string,
    usuario: { id: string; rol: Rol } | null,
  ): Promise<IntentoIniciado> {
    const actividad = await this.actividades.buscarDeGuiaPublicada(slugGuia);
    if (!actividad) throw new ActividadNoEncontradaError();

    const intento = Intento.iniciar({
      id: this.ids.generar(),
      actividad,
      // intento.usuario_id apunta a usuario_publico: el personal practica sin cuenta.
      usuarioId: usuario?.rol === 'USUARIO_PUBLICO' ? usuario.id : null,
      ahora: this.reloj.ahora(),
    });
    await this.intentos.crear(intento);
    return { id: intento.id, totalPreguntas: intento.totalPreguntas };
  }
}
