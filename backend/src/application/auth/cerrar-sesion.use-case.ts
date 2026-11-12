import { Reloj } from '../shared/reloj.port.js';
import { EmisorSesion } from './emisor-sesion.port.js';

/**
 * HU-02: «Cerrar sesión» invalida el refresh token (y con él el access token, que apunta a
 * la misma sesión). No falla si el token ya no sirve: el resultado es el mismo, sesión cerrada.
 */
export class CerrarSesionUseCase {
  constructor(
    private readonly sesiones: EmisorSesion,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(refreshToken: string): Promise<void> {
    const guardado = await this.sesiones.buscar(refreshToken);
    if (guardado && !guardado.revocadoEn) {
      await this.sesiones.revocar(guardado.id, this.reloj.ahora());
    }
  }
}
