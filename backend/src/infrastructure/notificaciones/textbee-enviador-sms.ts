import { Logger } from '@nestjs/common';
import {
  EnviadorCodigo,
  MensajeCodigo,
} from '../../application/auth/codigo-verificacion.port.js';
import { EnvioCodigoFallidoError } from '../../domain/auth/errores.js';
import { smsCodigoVerificacion } from './plantillas/codigo-verificacion.plantilla.js';

export interface ConfiguracionTextbee {
  apiKey: string;
  /** El Android registrado en textbee que envía el SMS con su propia SIM. */
  dispositivoId: string;
}

export class TextbeeEnviadorSms implements EnviadorCodigo {
  private readonly logger = new Logger('TextbeeEnviadorSms');

  constructor(private readonly config: ConfiguracionTextbee) {}

  async enviar(mensaje: MensajeCodigo): Promise<void> {
    let respuesta: Response;
    try {
      respuesta = await fetch(
        'https://api.textbee.dev/api/v1/gateway/send-sms',
        {
          method: 'POST',
          headers: {
            'x-api-key': this.config.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipients: [mensaje.destino],
            message: smsCodigoVerificacion(mensaje),
            deviceId: this.config.dispositivoId,
          }),
          signal: AbortSignal.timeout(10_000),
        },
      );
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el código de ${mensaje.proposito} por SMS (error=${error instanceof Error ? error.name : 'desconocido'})`,
      );
      throw new EnvioCodigoFallidoError();
    }
    if (!respuesta.ok) {
      // Solo el estado: el texto de error de textbee puede repetir el número.
      this.logger.error(
        `No se pudo enviar el código de ${mensaje.proposito} por SMS (http=${respuesta.status})`,
      );
      throw new EnvioCodigoFallidoError();
    }
  }
}
