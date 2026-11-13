import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

const esProduccion = process.env.NODE_ENV === 'production';
// pino-pretty solo en desarrollo local; producción, CI y tests escriben JSON.
const esDesarrollo = process.env.NODE_ENV === 'development';

// Logs estructurados (JSON) con pino: una línea por petición con método, ruta,
// estado y duración, más los logs de la app. En desarrollo se ven legibles con pino-pretty.
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? (esProduccion ? 'info' : 'debug'),
        // Nunca registrar credenciales ni cookies de sesión.
        redact: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
        ],
        // El healthcheck se consulta cada pocos segundos; no aporta al log.
        autoLogging: {
          ignore: (req) => req.url?.endsWith('/health') ?? false,
        },
        transport: esDesarrollo
          ? { target: 'pino-pretty', options: { singleLine: true } }
          : undefined,
      },
    }),
  ],
})
export class LoggingModule {}
