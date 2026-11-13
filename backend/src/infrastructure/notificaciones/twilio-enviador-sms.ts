import { Logger } from '@nestjs/common';
import {
  EnviadorCodigo,
  MensajeCodigo,
} from '../../application/auth/codigo-verificacion.port.js';
import { EnvioCodigoFallidoError } from '../../domain/auth/errores.js';
import { smsCodigoVerificacion } from './plantillas/codigo-verificacion.plantilla.js';

export interface ConfiguracionTwilio {
  accountSid: string;
  authToken: string;
  numeroOrigen: string;
}

export class TwilioEnviadorSms implements EnviadorCodigo {
  private readonly logger = new Logger('TwilioEnviadorSms');

  constructor(private readonly config: ConfiguracionTwilio) {}

  async enviar(mensaje: MensajeCodigo): Promise<void> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`;
    const credenciales = Buffer.from(
      `${this.config.accountSid}:${this.config.authToken}`,
    ).toString('base64');
    let respuesta: Response;
    try {
      respuesta = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Basic ${credenciales}` },
        body: new URLSearchParams({
          From: this.config.numeroOrigen,
          To: mensaje.destino,
          Body: smsCodigoVerificacion(mensaje),
        }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el código de ${mensaje.proposito} por SMS (error= ${error instanceof Error ? error.name : 'desconocido'})`,
      );
      throw new EnvioCodigoFallidoError();
    }
    if (!respuesta.ok) {
      const cuerpo = await respuesta.json().catch(() => ({}));
      this.logger.error(
        `No se pudo enviar el código de ${mensaje.proposito} por SMS (http=${respuesta.status}, twilio=${(cuerpo as { code?: number }).code ?? 'desconocido'})`,
      );
      throw new EnvioCodigoFallidoError();
    }
  }
}
