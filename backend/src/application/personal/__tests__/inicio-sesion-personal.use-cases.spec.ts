import {
  CodigoExpiradoError,
  CodigoIncorrectoError,
  IntentosAgotadosError,
  ReenvioMuyProntoError,
  SolicitudInicioSesionNoEncontradaError,
} from '../../../domain/auth/errores.js';
import { CredencialesIncorrectasError } from '../../../domain/personal/errores.js';
import {
  EmisorSesionFalso,
  EnviadorEnMemoria,
  GeneradorCodigoFijo,
  GeneradorIdSecuencial,
  HasherFalso,
  RelojFijo,
} from '../../auth/__tests__/fakes.js';
import { ConfiguracionPersonal } from '../configuracion-personal.js';
import { SolicitarInicioSesionPersonalUseCase } from '../solicitar-inicio-sesion-personal.use-case.js';
import { VerificarInicioSesionPersonalUseCase } from '../verificar-inicio-sesion-personal.use-case.js';
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

describe('HU-06 · Iniciar sesión como personal del CLENA', () => {
  let repo: PersonalRepositoryEnMemoria;
  let codigos: CodigoPersonalRepositoryEnMemoria;
  let reloj: RelojFijo;
  let enviador: EnviadorEnMemoria;
  let generadorCodigo: GeneradorCodigoFijo;
  let hasherPassword: HasherPasswordFalso;
  let emisor: EmisorSesionFalso;
  let solicitar: SolicitarInicioSesionPersonalUseCase;
  let verificar: VerificarInicioSesionPersonalUseCase;

  const credenciales = {
    correo: 'Luis@CLENA.example',
    password: 'MiClave2026',
  };

  beforeEach(async () => {
    repo = new PersonalRepositoryEnMemoria();
    codigos = new CodigoPersonalRepositoryEnMemoria();
    reloj = new RelojFijo(new Date('2026-11-12T15:00:00Z'));
    enviador = new EnviadorEnMemoria();
    generadorCodigo = new GeneradorCodigoFijo('123456');
    hasherPassword = new HasherPasswordFalso();
    emisor = new EmisorSesionFalso();
    solicitar = new SolicitarInicioSesionPersonalUseCase(
      repo,
      codigos,
      hasherPassword,
      generadorCodigo,
      new HasherFalso(),
      enviador,
      new GeneradorIdSecuencial(),
      reloj,
      config,
    );
    verificar = new VerificarInicioSesionPersonalUseCase(
      repo,
      codigos,
      new HasherFalso(),
      emisor,
      reloj,
      config,
    );
    await repo.crear(
      cuentaPersonal('p1', {
        correo: 'luis@clena.example',
        rol: 'ADMINISTRADOR',
        password: 'MiClave2026',
      }),
    );
  });

  it('con correo y contraseña correctos envía un código al correo y con él abre la sesión', async () => {
    const solicitud = await solicitar.ejecutar(credenciales);

    expect(solicitud).toEqual({
      solicitudId: 'p1',
      canal: 'CORREO',
      destino: 'l****@clena.example',
      expiraEn: new Date('2026-11-12T15:10:00Z'),
      puedeReenviarEn: new Date('2026-11-12T15:01:00Z'),
    });
    expect(enviador.enviados).toEqual([
      {
        canal: 'CORREO',
        destino: 'luis@clena.example',
        codigo: '123456',
        proposito: 'INICIO_SESION',
        vigenciaMinutos: 10,
      },
    ]);

    const { usuario, sesion } = await verificar.ejecutar({
      solicitudId: solicitud.solicitudId,
      codigo: ' 123456 ',
    });

    expect(usuario).toEqual({
      nombre: 'Persona p1',
      rol: 'ADMINISTRADOR',
      debeCambiarPassword: true,
    });
    expect(sesion.accessToken).toBeDefined();
    expect(emisor.emitidas).toEqual([{ id: 'p1', rol: 'ADMINISTRADOR' }]);
    expect(repo.cuentas.get('p1')!.ultimoAccesoEn).toEqual(reloj.ahora());
    expect(await codigos.ultimoSinUsar('p1', 'INICIO_SESION')).toBeNull();
  });

  it.each([
    ['la contraseña es incorrecta', { password: 'Otra2026' }],
    ['el correo no tiene cuenta', { correo: 'nadie@clena.example' }],
  ])(
    'responde «Credenciales incorrectas» si %s, sin enviar código',
    async (_caso, cambio) => {
      const error = await solicitar
        .ejecutar({ ...credenciales, ...cambio })
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(CredencialesIncorrectasError);
      expect(error).toMatchObject({ message: 'Credenciales incorrectas' });
      expect(enviador.enviados).toEqual([]);
    },
  );

  it('una cuenta desactivada no puede entrar aunque la contraseña sea correcta', async () => {
    repo.cuentas.get('p1')!.desactivar('admin-2');
    await expect(solicitar.ejecutar(credenciales)).rejects.toThrow(
      CredencialesIncorrectasError,
    );
  });

  it('si la cuenta se desactiva entre los dos pasos, el código ya no sirve', async () => {
    await solicitar.ejecutar(credenciales);
    repo.cuentas.get('p1')!.desactivar('admin-2');
    await expect(
      verificar.ejecutar({ solicitudId: 'p1', codigo: '123456' }),
    ).rejects.toThrow(SolicitudInicioSesionNoEncontradaError);
    expect(emisor.emitidas).toEqual([]);
  });

  it('exige esperar antes de pedir otro código, y solo vale el último', async () => {
    await solicitar.ejecutar(credenciales);
    reloj.avanzarSegundos(30);
    await expect(solicitar.ejecutar(credenciales)).rejects.toThrow(
      ReenvioMuyProntoError,
    );

    reloj.avanzarSegundos(30);
    generadorCodigo.codigo = '654321';
    await solicitar.ejecutar(credenciales);
    await expect(
      verificar.ejecutar({ solicitudId: 'p1', codigo: '123456' }),
    ).rejects.toThrow(CodigoIncorrectoError);
    await verificar.ejecutar({ solicitudId: 'p1', codigo: '654321' });
  });

  it('sin código pedido no hay solicitud que verificar', async () => {
    await expect(
      verificar.ejecutar({ solicitudId: 'p1', codigo: '123456' }),
    ).rejects.toThrow(SolicitudInicioSesionNoEncontradaError);
    await expect(
      verificar.ejecutar({ solicitudId: 'nadie', codigo: '123456' }),
    ).rejects.toThrow(SolicitudInicioSesionNoEncontradaError);
  });

  it('cuenta los intentos fallidos y bloquea al agotarlos', async () => {
    await solicitar.ejecutar(credenciales);
    const malo = { solicitudId: 'p1', codigo: '000000' };
    await expect(verificar.ejecutar(malo)).rejects.toMatchObject({
      intentosRestantes: 1,
    });
    await expect(verificar.ejecutar(malo)).rejects.toMatchObject({
      intentosRestantes: 0,
    });
    await expect(
      verificar.ejecutar({ solicitudId: 'p1', codigo: '123456' }),
    ).rejects.toThrow(IntentosAgotadosError);
    expect(emisor.emitidas).toEqual([]);
  });

  it('rechaza un código vencido', async () => {
    await solicitar.ejecutar(credenciales);
    reloj.avanzarSegundos(10 * 60);
    await expect(
      verificar.ejecutar({ solicitudId: 'p1', codigo: '123456' }),
    ).rejects.toThrow(CodigoExpiradoError);
  });
});
