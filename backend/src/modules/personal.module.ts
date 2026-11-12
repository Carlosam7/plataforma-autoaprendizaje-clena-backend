import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EnviadorCodigo,
  GeneradorCodigo,
  HasherCodigo,
} from '../application/auth/codigo-verificacion.port.js';
import { CambiarPasswordInicialUseCase } from '../application/personal/cambiar-password-inicial.use-case.js';
import { ConfiguracionPersonal } from '../application/personal/configuracion-personal.js';
import { CrearPersonalUseCase } from '../application/personal/crear-personal.use-case.js';
import { DesactivarPersonalUseCase } from '../application/personal/desactivar-personal.use-case.js';
import { EditarPersonalUseCase } from '../application/personal/editar-personal.use-case.js';
import { HasherPassword } from '../application/personal/hasher-password.port.js';
import { ListarPersonalUseCase } from '../application/personal/listar-personal.use-case.js';
import { ObtenerPersonalUseCase } from '../application/personal/obtener-personal.use-case.js';
import { ReactivarPersonalUseCase } from '../application/personal/reactivar-personal.use-case.js';
import { SolicitarCodigoPasswordInicialUseCase } from '../application/personal/solicitar-codigo-password-inicial.use-case.js';
import { GeneradorId } from '../application/shared/generador-id.port.js';
import { Reloj } from '../application/shared/reloj.port.js';
import { SesionRepository } from '../domain/auth/sesion.repository.js';
import { CodigoPersonalRepository } from '../domain/personal/codigo-personal.repository.js';
import { PersonalRepository } from '../domain/personal/personal.repository.js';
import { VariablesEntorno } from '../infrastructure/config/variables-entorno.js';
import { PrismaCodigoPersonalRepository } from '../infrastructure/database/repositories/prisma-codigo-personal.repository.js';
import { PrismaPersonalRepository } from '../infrastructure/database/repositories/prisma-personal.repository.js';
import { BcryptHasherPassword } from '../infrastructure/seguridad/bcrypt-hasher-password.js';
import { PasswordInicialController } from '../presentation/personal/password-inicial.controller.js';
import { PersonalController } from '../presentation/personal/personal.controller.js';
import { AuthModule } from './auth.module.js';

type Config = ConfigService<VariablesEntorno, true>;

// Composition root de HU-04: cuentas del personal del CLENA.
@Module({
  imports: [AuthModule],
  controllers: [PasswordInicialController, PersonalController],
  providers: [
    { provide: PersonalRepository, useClass: PrismaPersonalRepository },
    {
      provide: CodigoPersonalRepository,
      useClass: PrismaCodigoPersonalRepository,
    },
    { provide: HasherPassword, useFactory: () => new BcryptHasherPassword() },
    {
      provide: ConfiguracionPersonal,
      inject: [ConfigService],
      useFactory: (config: Config): ConfiguracionPersonal => ({
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
      provide: CrearPersonalUseCase,
      inject: [PersonalRepository, HasherPassword, GeneradorId, Reloj],
      useFactory: (
        ...deps: ConstructorParameters<typeof CrearPersonalUseCase>
      ) => new CrearPersonalUseCase(...deps),
    },
    {
      provide: ListarPersonalUseCase,
      inject: [PersonalRepository],
      useFactory: (repo: PersonalRepository) => new ListarPersonalUseCase(repo),
    },
    {
      provide: ObtenerPersonalUseCase,
      inject: [PersonalRepository],
      useFactory: (repo: PersonalRepository) =>
        new ObtenerPersonalUseCase(repo),
    },
    {
      provide: EditarPersonalUseCase,
      inject: [PersonalRepository],
      useFactory: (repo: PersonalRepository) => new EditarPersonalUseCase(repo),
    },
    {
      provide: DesactivarPersonalUseCase,
      inject: [PersonalRepository, SesionRepository, Reloj],
      useFactory: (
        ...deps: ConstructorParameters<typeof DesactivarPersonalUseCase>
      ) => new DesactivarPersonalUseCase(...deps),
    },
    {
      provide: ReactivarPersonalUseCase,
      inject: [PersonalRepository],
      useFactory: (repo: PersonalRepository) =>
        new ReactivarPersonalUseCase(repo),
    },
    {
      provide: SolicitarCodigoPasswordInicialUseCase,
      inject: [
        PersonalRepository,
        CodigoPersonalRepository,
        GeneradorCodigo,
        HasherCodigo,
        EnviadorCodigo,
        GeneradorId,
        Reloj,
        ConfiguracionPersonal,
      ],
      useFactory: (
        ...deps: ConstructorParameters<
          typeof SolicitarCodigoPasswordInicialUseCase
        >
      ) => new SolicitarCodigoPasswordInicialUseCase(...deps),
    },
    {
      provide: CambiarPasswordInicialUseCase,
      inject: [
        PersonalRepository,
        CodigoPersonalRepository,
        HasherCodigo,
        HasherPassword,
        Reloj,
        ConfiguracionPersonal,
      ],
      useFactory: (
        ...deps: ConstructorParameters<typeof CambiarPasswordInicialUseCase>
      ) => new CambiarPasswordInicialUseCase(...deps),
    },
  ],
})
export class PersonalModule {}
