import { Logger } from '@nestjs/common';
import {
  EnviadorCodigo,
  MensajeCodigo,
} from '../../application/auth/codigo-verificacion.port.js';

/**
 * Solo para desarrollo y pruebas: escribe el código en los logs en lugar de enviarlo.
 * En producción se reemplaza por un proveedor de correo o SMS que implemente el mismo puerto.
 */
export class ConsolaEnviadorCodigo implements EnviadorCodigo {
  private readonly logger = new Logger('EnviadorCodigo');

  enviar(mensaje: MensajeCodigo): Promise<void> {
    this.logger.warn(
      `[SOLO DESARROLLO] Código ${mensaje.proposito} por ${mensaje.canal} a ${mensaje.destino}: ${mensaje.codigo} (vence en ${mensaje.vigenciaMinutos} min)`,
    );
    return Promise.resolve();
  }
}
