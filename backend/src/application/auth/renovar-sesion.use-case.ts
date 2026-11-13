import { SesionInvalidaError } from '../../domain/auth/errores.js';
import { Reloj } from '../shared/reloj.port.js';
import { EmisorSesion, SesionEmitida } from './emisor-sesion.port.js';

/**
 * HU-02: cambia un refresh token vigente por una sesión nueva (rotación). Cada refresh token
 * sirve una sola vez; si alguien presenta uno que ya se rotó, es señal de que se lo robaron,
 * así que se cierran todas las sesiones de esa persona.
 */
export class RenovarSesionUseCase {
  constructor(
    private readonly sesiones: EmisorSesion,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(refreshToken: string): Promise<SesionEmitida> {
    const ahora = this.reloj.ahora();
    const guardado = await this.sesiones.buscar(refreshToken);
    if (!guardado) throw new SesionInvalidaError();

    if (guardado.revocadoEn) {
      if (guardado.reemplazadoPorId) {
        await this.sesiones.revocarTodas(guardado.titular, ahora);
      }
      throw new SesionInvalidaError();
    }
    if (
      guardado.expiraEn.getTime() <= ahora.getTime() ||
      !guardado.titularActivo
    ) {
      throw new SesionInvalidaError();
    }

    return this.sesiones.rotar(guardado, ahora);
  }
}
