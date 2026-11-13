import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { CerrarSesionUseCase } from '../application/auth/cerrar-sesion.use-case.js';
import { RenovarSesionUseCase } from '../application/auth/renovar-sesion.use-case.js';
import { ConfirmarEliminacionCuentaUseCase } from '../application/auth/confirmar-eliminacion-cuenta.use-case.js';
import { SolicitarEliminacionCuentaUseCase } from '../application/auth/solicitar-eliminacion-cuenta.use-case.js';
import { SolicitarInicioSesionUseCase } from '../application/auth/solicitar-inicio-sesion.use-case.js';
import { VerificarInicioSesionUseCase } from '../application/auth/verificar-inicio-sesion.use-case.js';
import { EliminacionCuentaRepository } from '../domain/auth/eliminacion-cuenta.repository.js';
import { InicioSesionRepository } from '../domain/auth/inicio-sesion.repository.js';
import { PrismaEliminacionCuentaRepository } from '../infrastructure/database/repositories/prisma-eliminacion-cuenta.repository.js';
import { PrismaInicioSesionRepository } from '../infrastructure/database/repositories/prisma-inicio-sesion.repository.js';
import { CuentaController } from '../presentation/auth/cuenta.controller.js';
import { SesionController } from '../presentation/auth/sesion.controller.js';
import {
  EnviadorCodigo,
  GeneradorCodigo,
  HasherCodigo,
} from '../application/auth/codigo-verificacion.port.js';
import { ConfiguracionRegistro } from '../application/auth/configuracion-registro.js';
import { EmisorSesion } from '../application/auth/emisor-sesion.port.js';
import { ObtenerAvisoPrivacidadUseCase } from '../application/auth/obtener-aviso-privacidad.use-case.js';
import { ReenviarCodigoRegistroUseCase } from '../application/auth/reenviar-codigo-registro.use-case.js';
import { SolicitarRegistroUseCase } from '../application/auth/solicitar-registro.use-case.js';
import { ValidarSesionUseCase } from '../application/auth/validar-sesion.use-case.js';
import { VerificadorAccessToken } from '../application/auth/verificador-access-token.port.js';
import { VerificarRegistroUseCase } from '../application/auth/verificar-registro.use-case.js';
import { GeneradorId } from '../application/shared/generador-id.port.js';
import { Reloj } from '../application/shared/reloj.port.js';
import { AvisoPrivacidadRepository } from '../domain/auth/aviso-privacidad.repository.js';
import { RegistroPendienteRepository } from '../domain/auth/registro-pendiente.repository.js';
import { SesionRepository } from '../domain/auth/sesion.repository.js';
import { UsuarioRepository } from '../domain/auth/usuario.repository.js';
import { VariablesEntorno } from '../infrastructure/config/variables-entorno.js';
import { PrismaService } from '../infrastructure/database/prisma.service.js';
import { PrismaAvisoPrivacidadRepository } from '../infrastructure/database/repositories/prisma-aviso-privacidad.repository.js';
import { PrismaRegistroPendienteRepository } from '../infrastructure/database/repositories/prisma-registro-pendiente.repository.js';
import { PrismaSesionRepository } from '../infrastructure/database/repositories/prisma-sesion.repository.js';
import { PrismaUsuarioRepository } from '../infrastructure/database/repositories/prisma-usuario.repository.js';
import { ConsolaEnviadorCodigo } from '../infrastructure/notificaciones/consola-enviador-codigo.js';
import {
  BcryptHasherCodigo,
  GeneradorCodigoNumerico,
} from '../infrastructure/seguridad/codigo-verificacion.js';
import { JwtEmisorSesion } from '../infrastructure/seguridad/jwt-emisor-sesion.js';
import { JwtVerificadorAccessToken } from '../infrastructure/seguridad/jwt-verificador-access-token.js';
import { AvisoPrivacidadController } from '../presentation/auth/aviso-privacidad.controller.js';
import { JwtAuthGuard } from '../presentation/auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../presentation/auth/guards/roles.guard.js';
import { RegistroController } from '../presentation/auth/registro.controller.js';
import { SmtpEnviadorCorreo } from '../infrastructure/notificaciones/smtp-enviador-correo.js';
import { EnviadorPorCanal } from '../infrastructure/notificaciones/enviador-por-canal.js';
import { TwilioEnviadorSms } from '../infrastructure/notificaciones/twilio-enviador-sms.js';
import { TextbeeEnviadorSms } from '../infrastructure/notificaciones/textbee-enviador-sms.js';

type Config = ConfigService<VariablesEntorno, true>;

// Composition root de autenticación: une cada puerto (clase abstracta del dominio o de
// la aplicación) con su implementación y construye los casos de uso, que no conocen Nest.
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: Config) => ({
        secret: config.get('JWT_ACCESS_SECRET', { infer: true }),
      }),
    }),
    // Lo usa el ThrottlerGuard de SesionController (no es global).
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: Config) => [
        {
          ttl:
            config.get('AUTH_LIMITE_VENTANA_SEGUNDOS', { infer: true }) * 1000,
          limit: config.get('AUTH_LIMITE_PETICIONES', { infer: true }),
        },
      ],
    }),
  ],
  controllers: [
    RegistroController,
    AvisoPrivacidadController,
    SesionController,
    CuentaController,
  ],
  providers: [
    // Guards globales, en este orden: primero quién eres (401), después qué puedes hacer (403).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: SesionRepository, useClass: PrismaSesionRepository },
    { provide: VerificadorAccessToken, useClass: JwtVerificadorAccessToken },
    {
      provide: ValidarSesionUseCase,
      inject: [VerificadorAccessToken, SesionRepository, Reloj],
      useFactory: (
        ...deps: ConstructorParameters<typeof ValidarSesionUseCase>
      ) => new ValidarSesionUseCase(...deps),
    },
    { provide: UsuarioRepository, useClass: PrismaUsuarioRepository },
    {
      provide: RegistroPendienteRepository,
      useClass: PrismaRegistroPendienteRepository,
    },
    {
      provide: AvisoPrivacidadRepository,
      useClass: PrismaAvisoPrivacidadRepository,
    },
    { provide: GeneradorCodigo, useClass: GeneradorCodigoNumerico },
    { provide: HasherCodigo, useFactory: () => new BcryptHasherCodigo() },
    {
      provide: EnviadorCodigo,
      inject: [ConfigService],
      useFactory: (config: Config) => {
        const correo =
          config.get('NOTIFICACIONES_CORREO', { infer: true }) === 'smtp'
            ? new SmtpEnviadorCorreo({
                host: config.get('SMTP_HOST', { infer: true }),
                puerto: config.get('SMTP_PUERTO', { infer: true }),
                usuario: config.get('SMTP_USUARIO', { infer: true }),
                clave: config.get('SMTP_CLAVE', { infer: true }),
                remitente: config.get('CORREO_REMITENTE', { infer: true }),
              })
            : new ConsolaEnviadorCodigo();

        const modoSms = config.get('NOTIFICACIONES_SMS', { infer: true });
        const sms =
          modoSms === 'twilio'
            ? new TwilioEnviadorSms({
                accountSid: config.get('TWILIO_ACCOUNT_SID', { infer: true }),
                authToken: config.get('TWILIO_AUTH_TOKEN', { infer: true }),
                numeroOrigen: config.get('TWILIO_NUMERO_ORIGEN', {
                  infer: true,
                }),
              })
            : modoSms === 'textbee'
              ? new TextbeeEnviadorSms({
                  apiKey: config.get('TEXTBEE_API_KEY', { infer: true }),
                  dispositivoId: config.get('TEXTBEE_DEVICE_ID', {
                    infer: true,
                  }),
                })
              : new ConsolaEnviadorCodigo();
        return new EnviadorPorCanal({
          CORREO: correo,
          TELEFONO: sms,
        });
      },
    },
    {
      provide: EmisorSesion,
      inject: [JwtService, PrismaService, ConfigService, GeneradorId, Reloj],
      useFactory: (...deps: ConstructorParameters<typeof JwtEmisorSesion>) =>
        new JwtEmisorSesion(...deps),
    },
    {
      provide: ConfiguracionRegistro,
      inject: [ConfigService],
      useFactory: (config: Config): ConfiguracionRegistro => ({
        politicaCodigo: {
          vigenciaMinutos: config.get('CODIGO_VERIFICACION_TTL_MINUTOS', {
            infer: true,
          }),
          maxIntentos: config.get('CODIGO_VERIFICACION_MAX_INTENTOS', {
            infer: true,
          }),
          esperaReenvioSegundos: config.get(
            'CODIGO_VERIFICACION_ESPERA_REENVIO_SEGUNDOS',
            { infer: true },
          ),
        },
      }),
    },
    {
      provide: SolicitarRegistroUseCase,
      inject: [
        UsuarioRepository,
        RegistroPendienteRepository,
        AvisoPrivacidadRepository,
        GeneradorCodigo,
        HasherCodigo,
        EnviadorCodigo,
        GeneradorId,
        Reloj,
        ConfiguracionRegistro,
      ],
      useFactory: (
        ...deps: ConstructorParameters<typeof SolicitarRegistroUseCase>
      ) => new SolicitarRegistroUseCase(...deps),
    },
    {
      provide: VerificarRegistroUseCase,
      inject: [
        RegistroPendienteRepository,
        HasherCodigo,
        EmisorSesion,
        Reloj,
        ConfiguracionRegistro,
      ],
      useFactory: (
        ...deps: ConstructorParameters<typeof VerificarRegistroUseCase>
      ) => new VerificarRegistroUseCase(...deps),
    },
    {
      provide: ReenviarCodigoRegistroUseCase,
      inject: [
        RegistroPendienteRepository,
        GeneradorCodigo,
        HasherCodigo,
        EnviadorCodigo,
        Reloj,
        ConfiguracionRegistro,
      ],
      useFactory: (
        ...deps: ConstructorParameters<typeof ReenviarCodigoRegistroUseCase>
      ) => new ReenviarCodigoRegistroUseCase(...deps),
    },
    {
      provide: InicioSesionRepository,
      useClass: PrismaInicioSesionRepository,
    },
    {
      provide: SolicitarInicioSesionUseCase,
      inject: [
        InicioSesionRepository,
        GeneradorCodigo,
        HasherCodigo,
        EnviadorCodigo,
        GeneradorId,
        Reloj,
        ConfiguracionRegistro,
      ],
      useFactory: (
        ...deps: ConstructorParameters<typeof SolicitarInicioSesionUseCase>
      ) => new SolicitarInicioSesionUseCase(...deps),
    },
    {
      provide: VerificarInicioSesionUseCase,
      inject: [
        InicioSesionRepository,
        HasherCodigo,
        EmisorSesion,
        Reloj,
        ConfiguracionRegistro,
      ],
      useFactory: (
        ...deps: ConstructorParameters<typeof VerificarInicioSesionUseCase>
      ) => new VerificarInicioSesionUseCase(...deps),
    },
    // HU-05: eliminar mi cuenta.
    {
      provide: EliminacionCuentaRepository,
      useClass: PrismaEliminacionCuentaRepository,
    },
    {
      provide: SolicitarEliminacionCuentaUseCase,
      inject: [
        EliminacionCuentaRepository,
        GeneradorCodigo,
        HasherCodigo,
        EnviadorCodigo,
        GeneradorId,
        Reloj,
        ConfiguracionRegistro,
      ],
      useFactory: (
        ...deps: ConstructorParameters<typeof SolicitarEliminacionCuentaUseCase>
      ) => new SolicitarEliminacionCuentaUseCase(...deps),
    },
    {
      provide: ConfirmarEliminacionCuentaUseCase,
      inject: [
        EliminacionCuentaRepository,
        HasherCodigo,
        Reloj,
        ConfiguracionRegistro,
      ],
      useFactory: (
        ...deps: ConstructorParameters<typeof ConfirmarEliminacionCuentaUseCase>
      ) => new ConfirmarEliminacionCuentaUseCase(...deps),
    },
    {
      provide: RenovarSesionUseCase,
      inject: [EmisorSesion, Reloj],
      useFactory: (
        ...deps: ConstructorParameters<typeof RenovarSesionUseCase>
      ) => new RenovarSesionUseCase(...deps),
    },
    {
      provide: CerrarSesionUseCase,
      inject: [EmisorSesion, Reloj],
      useFactory: (
        ...deps: ConstructorParameters<typeof CerrarSesionUseCase>
      ) => new CerrarSesionUseCase(...deps),
    },
    {
      provide: ObtenerAvisoPrivacidadUseCase,
      inject: [AvisoPrivacidadRepository, Reloj],
      useFactory: (
        ...deps: ConstructorParameters<typeof ObtenerAvisoPrivacidadUseCase>
      ) => new ObtenerAvisoPrivacidadUseCase(...deps),
    },
  ],
  // Otros módulos (p. ej. personal) envían códigos, abren sesiones y las cierran.
  exports: [
    EmisorSesion,
    EnviadorCodigo,
    GeneradorCodigo,
    HasherCodigo,
    SesionRepository,
  ],
})
export class AuthModule {}
