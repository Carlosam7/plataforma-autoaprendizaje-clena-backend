import { Reloj } from '../shared/reloj.port.js';
import { EstadoBaseDatos } from './estado-base-datos.port.js';

export interface Salud {
  /** `ok` solo si la API puede atender: también la base de datos responde. */
  status: 'ok' | 'error';
  service: 'clena-backend';
  baseDatos: 'ok' | 'no_disponible';
  timestamp: string;
}

/**
 * BE-09: estado de la API para el healthcheck de Docker y el monitoreo. Sin base de datos
 * la API no sirve de nada (todo la usa), así que en ese caso no está sana.
 */
export class VerificarSaludUseCase {
  constructor(
    private readonly baseDatos: EstadoBaseDatos,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(): Promise<Salud> {
    const disponible = await this.baseDatos.disponible();
    return {
      status: disponible ? 'ok' : 'error',
      service: 'clena-backend',
      baseDatos: disponible ? 'ok' : 'no_disponible',
      timestamp: this.reloj.ahora().toISOString(),
    };
  }
}
