import { Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  EnviadorCodigo,
  MensajeCodigo,
} from '../../application/auth/codigo-verificacion.port.js';
import { EnvioCodigoFallidoError } from '../../domain/auth/errores.js';
import { plantillaCodigoVerificacion } from './plantillas/codigo-verificacion.plantilla.js';

export interface ConfiguracionSmtp {
  host: string;
  puerto: number;
  usuario: string;
  clave: string;
  remitente: string;
}

export class SmtpEnviadorCorreo implements EnviadorCodigo {
  private readonly logger = new Logger('SmtpEnviadorCorreo');
  private readonly transporte: Transporter;

  constructor(private readonly config: ConfiguracionSmtp) {
    this.transporte = nodemailer.createTransport({
      host: config.host,
      port: config.puerto,
      secure: config.puerto === 465, // true para puerto 465, false para otros
      auth: {
        user: config.usuario,
        pass: config.clave,
      },
      connectionTimeout: 10_000, // tiempo máximo para conectar al servidor SMTP
      greetingTimeout: 10_000, // tiempo máximo para esperar el saludo del servidor SMTP
      socketTimeout: 15_000, // tiempo máximo para enviar el correo completo
    });
  }
  async enviar(mensaje: MensajeCodigo): Promise<void> {
    const { asunto, html, texto } = plantillaCodigoVerificacion(mensaje);
    try {
      await this.transporte.sendMail({
        from: this.config.remitente,
        to: mensaje.destino,
        subject: asunto,
        text: texto,
        html,
      });
    } catch (error) {
      const { code, responseCode } = error as {
        code?: string;
        responseCode?: number;
      };
      this.logger.error(
        `No se pudo enviar el código de ${mensaje.proposito} por correo (code=${code ?? 'desconocido'}, smtp=${responseCode ?? 'desconocido'})`,
      );
      throw new EnvioCodigoFallidoError();
    }
  }
}
