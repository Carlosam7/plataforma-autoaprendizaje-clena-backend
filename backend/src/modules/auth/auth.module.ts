import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { GENERADOR_ID, RELOJ } from '../../shared/application/tokens.js';
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service.js';
import { VariablesEntorno } from '../../config/variables-entorno.js';
import { ConfiguracionRegistro } from './application/configuracion-registro.js';
import {
  CONFIGURACION_REGISTRO,
  EMISOR_SESION,
  ENVIADOR_CODIGO,
  GENERADOR_CODIGO,
  HASHER_CODIGO,
  REGISTRO_PENDIENTE_REPOSITORY,
  USUARIO_REPOSITORY,
} from './application/tokens.js';
import { ReenviarCodigoRegistroUseCase } from './application/use-cases/reenviar-codigo-registro.use-case.js';
import { SolicitarRegistroUseCase } from './application/use-cases/solicitar-registro.use-case.js';
import { VerificarRegistroUseCase } from './application/use-cases/verificar-registro.use-case.js';
import { ConsolaEnviadorCodigo } from './infrastructure/notifications/consola-enviador-codigo.js';
import { PrismaRegistroPendienteRepository } from './infrastructure/persistence/prisma-registro-pendiente.repository.js';
import { PrismaUsuarioRepository } from './infrastructure/persistence/prisma-usuario.repository.js';
import {
  BcryptHasherCodigo,
  GeneradorCodigoNumerico,
} from './infrastructure/security/codigo-verificacion.js';
import { JwtEmisorSesion } from './infrastructure/security/jwt-emisor-sesion.js';
import { RegistroController } from './presentation/controllers/registro.controller.js';

type Config = ConfigService<VariablesEntorno, true>;

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: Config) => ({
        secret: config.get('JWT_ACCESS_SECRET', { infer: true }),
      }),
    }),
  ],
  controllers: [RegistroController],
  providers: [
    { provide: USUARIO_REPOSITORY, useClass: PrismaUsuarioRepository },
    {
      provide: REGISTRO_PENDIENTE_REPOSITORY,
      useClass: PrismaRegistroPendienteRepository,
    },
    { provide: GENERADOR_CODIGO, useClass: GeneradorCodigoNumerico },
    { provide: HASHER_CODIGO, useFactory: () => new BcryptHasherCodigo() },
    { provide: ENVIADOR_CODIGO, useClass: ConsolaEnviadorCodigo },
    {
      provide: EMISOR_SESION,
      inject: [JwtService, PrismaService, ConfigService, GENERADOR_ID, RELOJ],
      useFactory: (...deps: ConstructorParameters<typeof JwtEmisorSesion>) =>
        new JwtEmisorSesion(...deps),
    },
    {
      provide: CONFIGURACION_REGISTRO,
      inject: [ConfigService],
      useFactory: (config: Config): ConfiguracionRegistro => ({
        versionAvisoPrivacidad: config.get('AVISO_PRIVACIDAD_VERSION', {
          infer: true,
        }),
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
    // Los casos de uso no conocen NestJS: se construyen aquí con sus dependencias.
    {
      provide: SolicitarRegistroUseCase,
      inject: [
        USUARIO_REPOSITORY,
        REGISTRO_PENDIENTE_REPOSITORY,
        GENERADOR_CODIGO,
        HASHER_CODIGO,
        ENVIADOR_CODIGO,
        GENERADOR_ID,
        RELOJ,
        CONFIGURACION_REGISTRO,
      ],
      useFactory: (
        ...deps: ConstructorParameters<typeof SolicitarRegistroUseCase>
      ) => new SolicitarRegistroUseCase(...deps),
    },
    {
      provide: VerificarRegistroUseCase,
      inject: [
        USUARIO_REPOSITORY,
        REGISTRO_PENDIENTE_REPOSITORY,
        HASHER_CODIGO,
        EMISOR_SESION,
        GENERADOR_ID,
        RELOJ,
        CONFIGURACION_REGISTRO,
      ],
      useFactory: (
        ...deps: ConstructorParameters<typeof VerificarRegistroUseCase>
      ) => new VerificarRegistroUseCase(...deps),
    },
    {
      provide: ReenviarCodigoRegistroUseCase,
      inject: [
        REGISTRO_PENDIENTE_REPOSITORY,
        GENERADOR_CODIGO,
        HASHER_CODIGO,
        ENVIADOR_CODIGO,
        RELOJ,
        CONFIGURACION_REGISTRO,
      ],
      useFactory: (
        ...deps: ConstructorParameters<typeof ReenviarCodigoRegistroUseCase>
      ) => new ReenviarCodigoRegistroUseCase(...deps),
    },
  ],
})
export class AuthModule {}
