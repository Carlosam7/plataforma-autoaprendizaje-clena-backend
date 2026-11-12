import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
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
import { VerificarRegistroUseCase } from '../application/auth/verificar-registro.use-case.js';
import { GeneradorId } from '../application/shared/generador-id.port.js';
import { Reloj } from '../application/shared/reloj.port.js';
import { AvisoPrivacidadRepository } from '../domain/auth/aviso-privacidad.repository.js';
import { RegistroPendienteRepository } from '../domain/auth/registro-pendiente.repository.js';
import { UsuarioRepository } from '../domain/auth/usuario.repository.js';
import { VariablesEntorno } from '../infrastructure/config/variables-entorno.js';
import { PrismaService } from '../infrastructure/database/prisma.service.js';
import { PrismaAvisoPrivacidadRepository } from '../infrastructure/database/repositories/prisma-aviso-privacidad.repository.js';
import { PrismaRegistroPendienteRepository } from '../infrastructure/database/repositories/prisma-registro-pendiente.repository.js';
import { PrismaUsuarioRepository } from '../infrastructure/database/repositories/prisma-usuario.repository.js';
import { ConsolaEnviadorCodigo } from '../infrastructure/notificaciones/consola-enviador-codigo.js';
import {
  BcryptHasherCodigo,
  GeneradorCodigoNumerico,
} from '../infrastructure/seguridad/codigo-verificacion.js';
import { JwtEmisorSesion } from '../infrastructure/seguridad/jwt-emisor-sesion.js';
import { AvisoPrivacidadController } from '../presentation/auth/aviso-privacidad.controller.js';
import { RegistroController } from '../presentation/auth/registro.controller.js';

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
  ],
  controllers: [RegistroController, AvisoPrivacidadController],
  providers: [
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
    { provide: EnviadorCodigo, useClass: ConsolaEnviadorCodigo },
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
      provide: ObtenerAvisoPrivacidadUseCase,
      inject: [AvisoPrivacidadRepository, Reloj],
      useFactory: (
        ...deps: ConstructorParameters<typeof ObtenerAvisoPrivacidadUseCase>
      ) => new ObtenerAvisoPrivacidadUseCase(...deps),
    },
  ],
})
export class AuthModule {}
