import {
  CodigoExpiradoError,
  CodigoIncorrectoError,
  IntentosAgotadosError,
  ReenvioMuyProntoError,
} from '../../../domain/auth/errores.js';
import {
  AutoModificacionNoPermitidaError,
  CambioPasswordNoRequeridoError,
  CodigoNoSolicitadoError,
  CorreoPersonalEnUsoError,
  PasswordRepetidaError,
  PersonalNoEncontradoError,
} from '../../../domain/personal/errores.js';
import { DatoInvalidoError } from '../../../domain/shared/error-de-negocio.js';
import {
  EnviadorEnMemoria,
  GeneradorCodigoFijo,
  GeneradorIdSecuencial,
  HasherFalso,
  RelojFijo,
  SesionRepositoryEnMemoria,
} from '../../auth/__tests__/fakes.js';
import { CambiarPasswordInicialUseCase } from '../cambiar-password-inicial.use-case.js';
import { ConfiguracionPersonal } from '../configuracion-personal.js';
import { CrearPersonalUseCase } from '../crear-personal.use-case.js';
import { DesactivarPersonalUseCase } from '../desactivar-personal.use-case.js';
import { EditarPersonalUseCase } from '../editar-personal.use-case.js';
import { ListarPersonalUseCase } from '../listar-personal.use-case.js';
import { ObtenerPersonalUseCase } from '../obtener-personal.use-case.js';
import { ReactivarPersonalUseCase } from '../reactivar-personal.use-case.js';
import { SolicitarCodigoPasswordInicialUseCase } from '../solicitar-codigo-password-inicial.use-case.js';
import {
  CodigoPersonalRepositoryEnMemoria,
  cuentaPersonal,
  HasherPasswordFalso,
  PersonalRepositoryEnMemoria,
} from './fakes.js';

const config: ConfiguracionPersonal = {
  politicaCodigo: {
    vigenciaMinutos: 10,
    maxIntentos: 2,
    esperaReenvioSegundos: 60,
  },
};

describe('HU-04 · Gestión de cuentas del personal', () => {
  let repo: PersonalRepositoryEnMemoria;
  let reloj: RelojFijo;

  beforeEach(() => {
    repo = new PersonalRepositoryEnMemoria();
    reloj = new RelojFijo(new Date('2026-11-12T15:00:00Z'));
  });

  describe('CrearPersonal', () => {
    const crear = () =>
      new CrearPersonalUseCase(
        repo,
        new HasherPasswordFalso(),
        new GeneradorIdSecuencial(),
        reloj,
      );

    it('crea la cuenta activa con contraseña temporal y sin devolver el hash', async () => {
      const resultado = await crear().ejecutar(
        {
          nombre: ' Luis  Pérez ',
          correo: 'Luis@CLENA.example',
          passwordTemporal: 'Temporal2026',
          rol: 'PERSONAL',
        },
        'admin-1',
      );

      expect(resultado).toEqual({
        id: 'id-1',
        nombre: 'Luis Pérez',
        correo: 'luis@clena.example',
        rol: 'PERSONAL',
        activo: true,
        debeCambiarPassword: true,
        ultimoAccesoEn: null,
        creadoEn: reloj.ahora(),
      });
      expect(resultado).not.toHaveProperty('passwordHash');
      const guardada = repo.cuentas.get('id-1')!;
      expect(guardada.passwordHash).toBe('pw:Temporal2026');
      expect(guardada.creadoPorId).toBe('admin-1');
    });

    it('rechaza un correo que ya usa otra cuenta', async () => {
      await repo.crear(cuentaPersonal('p1', { correo: 'luis@clena.example' }));
      await expect(
        crear().ejecutar(
          {
            nombre: 'Otro Luis',
            correo: 'LUIS@clena.example',
            passwordTemporal: 'Temporal2026',
            rol: 'PERSONAL',
          },
          'admin-1',
        ),
      ).rejects.toThrow(CorreoPersonalEnUsoError);
    });

    it('rechaza una contraseña temporal débil', async () => {
      await expect(
        crear().ejecutar(
          {
            nombre: 'Luis',
            correo: 'luis@clena.example',
            passwordTemporal: '1234',
            rol: 'PERSONAL',
          },
          'admin-1',
        ),
      ).rejects.toThrow(DatoInvalidoError);
      expect(repo.cuentas.size).toBe(0);
    });
  });

  describe('Listar y obtener', () => {
    it('lista con filtros y paginación', async () => {
      await repo.crear(cuentaPersonal('p1'));
      await repo.crear(cuentaPersonal('p2', { rol: 'ADMINISTRADOR' }));
      const resultado = await new ListarPersonalUseCase(repo).ejecutar({
        pagina: 1,
        limite: 10,
        rol: 'ADMINISTRADOR',
        ordenarPor: 'nombre',
        direccion: 'asc',
      });
      expect(resultado.total).toBe(1);
      expect(resultado.datos[0].id).toBe('p2');
      expect(resultado).toMatchObject({ pagina: 1, limite: 10 });
    });

    it('obtiene una cuenta o avisa que no existe', async () => {
      await repo.crear(cuentaPersonal('p1'));
      const obtener = new ObtenerPersonalUseCase(repo);
      expect((await obtener.ejecutar('p1')).correo).toBe('p1@clena.example');
      await expect(obtener.ejecutar('nadie')).rejects.toThrow(
        PersonalNoEncontradoError,
      );
    });
  });

  describe('EditarPersonal', () => {
    it('cambia nombre, correo y rol', async () => {
      await repo.crear(cuentaPersonal('p1'));
      const resultado = await new EditarPersonalUseCase(repo).ejecutar(
        'p1',
        {
          nombre: 'Luis Nuevo',
          correo: 'nuevo@clena.example',
          rol: 'ADMINISTRADOR',
        },
        'admin-1',
      );
      expect(resultado).toMatchObject({
        nombre: 'Luis Nuevo',
        correo: 'nuevo@clena.example',
        rol: 'ADMINISTRADOR',
      });
    });

    it('permite conservar el propio correo pero no tomar el de otra cuenta', async () => {
      await repo.crear(cuentaPersonal('p1'));
      await repo.crear(cuentaPersonal('p2'));
      const editar = new EditarPersonalUseCase(repo);
      await expect(
        editar.ejecutar('p1', { correo: 'p1@clena.example' }, 'admin-1'),
      ).resolves.toBeDefined();
      await expect(
        editar.ejecutar('p1', { correo: 'p2@clena.example' }, 'admin-1'),
      ).rejects.toThrow(CorreoPersonalEnUsoError);
    });

    it('un administrador no se quita su propio rol', async () => {
      await repo.crear(cuentaPersonal('admin-1', { rol: 'ADMINISTRADOR' }));
      await expect(
        new EditarPersonalUseCase(repo).ejecutar(
          'admin-1',
          { rol: 'PERSONAL' },
          'admin-1',
        ),
      ).rejects.toThrow(AutoModificacionNoPermitidaError);
    });
  });

  describe('Desactivar y reactivar', () => {
    it('desactiva la cuenta y cierra sus sesiones abiertas', async () => {
      await repo.crear(cuentaPersonal('p1'));
      const sesiones = new SesionRepositoryEnMemoria();
      sesiones.sesiones.push(
        { sesionId: 's1', usuarioId: 'p1', rol: 'PERSONAL', revocada: false },
        { sesionId: 's2', usuarioId: 'otro', rol: 'PERSONAL', revocada: false },
      );

      const resultado = await new DesactivarPersonalUseCase(
        repo,
        sesiones,
        reloj,
      ).ejecutar('p1', 'admin-1');

      expect(resultado.activo).toBe(false);
      expect(await sesiones.buscarActiva('s1')).toBeNull();
      expect(await sesiones.buscarActiva('s2')).not.toBeNull();

      const reactivada = await new ReactivarPersonalUseCase(repo).ejecutar(
        'p1',
      );
      expect(reactivada.activo).toBe(true);
    });

    it('un administrador no se desactiva a sí mismo', async () => {
      await repo.crear(cuentaPersonal('admin-1', { rol: 'ADMINISTRADOR' }));
      await expect(
        new DesactivarPersonalUseCase(
          repo,
          new SesionRepositoryEnMemoria(),
          reloj,
        ).ejecutar('admin-1', 'admin-1'),
      ).rejects.toThrow(AutoModificacionNoPermitidaError);
    });
  });

  describe('Cambio de la contraseña temporal', () => {
    let codigos: CodigoPersonalRepositoryEnMemoria;
    let enviador: EnviadorEnMemoria;
    let generadorCodigo: GeneradorCodigoFijo;
    let solicitar: SolicitarCodigoPasswordInicialUseCase;
    let cambiar: CambiarPasswordInicialUseCase;

    beforeEach(async () => {
      codigos = new CodigoPersonalRepositoryEnMemoria();
      enviador = new EnviadorEnMemoria();
      generadorCodigo = new GeneradorCodigoFijo('123456');
      solicitar = new SolicitarCodigoPasswordInicialUseCase(
        repo,
        codigos,
        generadorCodigo,
        new HasherFalso(),
        enviador,
        new GeneradorIdSecuencial(),
        reloj,
        config,
      );
      cambiar = new CambiarPasswordInicialUseCase(
        repo,
        codigos,
        new HasherFalso(),
        new HasherPasswordFalso(),
        reloj,
        config,
      );
      await repo.crear(cuentaPersonal('p1', { correo: 'luis@clena.example' }));
    });

    it('envía el código al correo y luego cambia la contraseña', async () => {
      const enviado = await solicitar.ejecutar('p1');
      expect(enviado.destino).toBe('l****@clena.example');
      expect(enviador.enviados).toEqual([
        {
          canal: 'CORREO',
          destino: 'luis@clena.example',
          codigo: '123456',
          proposito: 'CAMBIO_PASSWORD_INICIAL',
          vigenciaMinutos: 10,
        },
      ]);

      await cambiar.ejecutar('p1', {
        codigo: '123456',
        passwordNueva: 'MiClave2026',
      });

      const cuenta = repo.cuentas.get('p1')!;
      expect(cuenta.debeCambiarPassword).toBe(false);
      expect(cuenta.passwordHash).toBe('pw:MiClave2026');
      expect(
        await codigos.ultimoSinUsar('p1', 'CAMBIO_PASSWORD_INICIAL'),
      ).toBeNull();
    });

    it('no envía código si la contraseña ya se cambió', async () => {
      repo.cuentas.get('p1')!.cambiarPasswordInicial('pw:Otra2026');
      await expect(solicitar.ejecutar('p1')).rejects.toThrow(
        CambioPasswordNoRequeridoError,
      );
      await expect(
        cambiar.ejecutar('p1', {
          codigo: '123456',
          passwordNueva: 'MiClave2026',
        }),
      ).rejects.toThrow(CambioPasswordNoRequeridoError);
    });

    it('exige esperar antes de pedir otro código, y solo vale el último', async () => {
      await solicitar.ejecutar('p1');
      reloj.avanzarSegundos(30);
      await expect(solicitar.ejecutar('p1')).rejects.toThrow(
        ReenvioMuyProntoError,
      );

      reloj.avanzarSegundos(30);
      generadorCodigo.codigo = '654321';
      await solicitar.ejecutar('p1');
      await expect(
        cambiar.ejecutar('p1', {
          codigo: '123456',
          passwordNueva: 'MiClave2026',
        }),
      ).rejects.toThrow(CodigoIncorrectoError);
      await cambiar.ejecutar('p1', {
        codigo: '654321',
        passwordNueva: 'MiClave2026',
      });
    });

    it('pide primero el código', async () => {
      await expect(
        cambiar.ejecutar('p1', {
          codigo: '123456',
          passwordNueva: 'MiClave2026',
        }),
      ).rejects.toThrow(CodigoNoSolicitadoError);
    });

    it('cuenta los intentos fallidos y bloquea al agotarlos', async () => {
      await solicitar.ejecutar('p1');
      const malo = { codigo: '000000', passwordNueva: 'MiClave2026' };
      await expect(cambiar.ejecutar('p1', malo)).rejects.toMatchObject({
        intentosRestantes: 1,
      });
      await expect(cambiar.ejecutar('p1', malo)).rejects.toMatchObject({
        intentosRestantes: 0,
      });
      await expect(
        cambiar.ejecutar('p1', {
          codigo: '123456',
          passwordNueva: 'MiClave2026',
        }),
      ).rejects.toThrow(IntentosAgotadosError);
    });

    it('rechaza un código vencido', async () => {
      await solicitar.ejecutar('p1');
      reloj.avanzarSegundos(10 * 60);
      await expect(
        cambiar.ejecutar('p1', {
          codigo: '123456',
          passwordNueva: 'MiClave2026',
        }),
      ).rejects.toThrow(CodigoExpiradoError);
    });

    it('la contraseña nueva no puede ser la temporal ni débil', async () => {
      await solicitar.ejecutar('p1');
      await expect(
        cambiar.ejecutar('p1', {
          codigo: '123456',
          passwordNueva: 'Temporal2026',
        }),
      ).rejects.toThrow(PasswordRepetidaError);
      await expect(
        cambiar.ejecutar('p1', { codigo: '123456', passwordNueva: 'debil' }),
      ).rejects.toThrow(DatoInvalidoError);
      expect(repo.cuentas.get('p1')!.debeCambiarPassword).toBe(true);
    });
  });
});
