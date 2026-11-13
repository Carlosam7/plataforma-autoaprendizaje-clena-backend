import {
  EnviadorCodigo,
  MensajeCodigo,
} from '../../application/auth/codigo-verificacion.port.js';
import { CanalVerificacion } from '../../domain/auth/tipos.js';

export class EnviadorPorCanal implements EnviadorCodigo {
  constructor(
    private readonly enviadores: Record<CanalVerificacion, EnviadorCodigo>,
  ) {}

  enviar(mensaje: MensajeCodigo): Promise<void> {
    return this.enviadores[mensaje.canal].enviar(mensaje);
  }
}
