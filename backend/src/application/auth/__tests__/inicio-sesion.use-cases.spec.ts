import {
  CodigoExpiradoError,
  CodigoIncorrectoError,
  CredencialesInvalidasError,
  IntentosAgotadosError,
  ReenvioMuyProntoError,
  SesionInvalidaError,
  SolicitudInicioSesionNoEncontradaError,
} from '../../../domain/auth/errores.js';
import { Correo } from '../../../domain/auth/value-objects/correo.js';
import { Telefono } from '../../../domain/auth/value-objects/telefono.js';
import { CerrarSesionUseCase } from '../cerrar-sesion.use-case.js';
import { RenovarSesionUseCase } from '../renovar-sesion.use-case.js';
import { SolicitarInicioSesionUseCase } from '../solicitar-inicio-sesion.use-case.js';
import { VerificarInicioSesionUseCase } from '../verificar-inicio-sesion.use-case.js';
import {
  configuracionPrueba,
  EmisorSesionFalso,
  EnviadorEnMemoria,
  GeneradorCodigoFijo,
  GeneradorIdSecuencial,
  HasherFalso,
  InicioSesionRepositoryEnMemoria,
  RelojFijo,
} from './fakes.js';

function crearContexto() {
  const reloj = new RelojFijo(new Date('2026-11-12T15:00:00Z'));
  const cuentas = new InicioSesionRepositoryEnMemoria();
  const generadorCodigo = new GeneradorCodigoFijo('111111');
  const hasher = new HasherFalso();
  const enviador = new EnviadorEnMemoria();
  const emisor = new EmisorSesionFalso();

  // Carmen se registró con correo (verificado) y celular (sin verificar).
  cuentas.cuentas.push(
    {
      usuarioId: '41234567',
      nombre: 'Carmen Rodríguez',
      metodoInicioId: 'metodo-correo',
      canal: 'CORREO',
      destino: Correo.crear('carmen@correo.com'),
      verificado: true,
    },
    {
      usuarioId: '41234567',
      nombre: 'Carmen Rodríguez',
      metodoInicioId: 'metodo-celular',
      canal: 'TELEFONO',
      destino: Telefono.crear('3001234567'),
      verificado: false,
    },
  );

  return {
    reloj,
    cuentas,
    generadorCodigo,
    enviador,
    emisor,
    solicitar: new SolicitarInicioSesionUseCase(
      cuentas,
      generadorCodigo,
      hasher,
      enviador,
      new GeneradorIdSecuencial(),
      reloj,
      configuracionPrueba,
    ),
    verificar: new VerificarInicioSesionUseCase(
      cuentas,
      hasher,
      emisor,
      reloj,
      configuracionPrueba,
    ),
    renovar: new RenovarSesionUseCase(emisor, reloj),
    cerrar: new CerrarSesionUseCase(emisor, reloj),
  };
}

describe('HU-02 · Solicitar inicio de sesión', () => {
  it('con identificación y correo correctos envía un código al correo', async () => {
    const ctx = crearContexto();

    const resultado = await ctx.solicitar.ejecutar({
      numeroIdentificacion: '41.234.567',
      contacto: ' Carmen@Correo.com ',
    });

    expect(resultado).toMatchObject({
      solicitudId: 'metodo-correo',
      canal: 'CORREO',
      destino: 'c****@correo.com',
    });
    expect(ctx.enviador.enviados).toEqual([
      expect.objectContaining({
        canal: 'CORREO',
        destino: 'carmen@correo.com',
        codigo: '111111',
        proposito: 'INICIO_SESION',
      }),
    ]);
  });

  it('también puede entrar con el celular, y el código llega por SMS', async () => {
    const ctx = crearContexto();

    const resultado = await ctx.solicitar.ejecutar({
      numeroIdentificacion: '41234567',
      contacto: '300 123 4567',
    });

    expect(resultado.canal).toBe('TELEFONO');
    expect(ctx.enviador.enviados[0]).toMatchObject({
      canal: 'TELEFONO',
      destino: '+573001234567',
    });
  });

  it.each([
    ['la identificación no coincide', '99999999', 'carmen@correo.com'],
    ['el correo no coincide', '41234567', 'otra@correo.com'],
    ['el celular no coincide', '41234567', '3109999999'],
  ])(
    'si %s responde «Credenciales inválidas» y no envía nada',
    async (_caso, numeroIdentificacion, contacto) => {
      const ctx = crearContexto();

      const error = await ctx.solicitar
        .ejecutar({ numeroIdentificacion, contacto })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(CredencialesInvalidasError);
      expect((error as Error).message).toBe('Credenciales inválidas');
      expect(ctx.enviador.enviados).toHaveLength(0);
    },
  );

  it('no permite pedir otro código enseguida, pero sí después de la espera', async () => {
    const ctx = crearContexto();
    const datos = {
      numeroIdentificacion: '41234567',
      contacto: 'carmen@correo.com',
    };
    await ctx.solicitar.ejecutar(datos);

    await expect(ctx.solicitar.ejecutar(datos)).rejects.toBeInstanceOf(
      ReenvioMuyProntoError,
    );

    ctx.reloj.avanzarSegundos(60);
    await ctx.solicitar.ejecutar(datos);
    expect(ctx.enviador.enviados).toHaveLength(2);
  });
});

describe('HU-02 · Verificar el código e iniciar sesión', () => {
  async function pedirCodigo(ctx: ReturnType<typeof crearContexto>) {
    return ctx.solicitar.ejecutar({
      numeroIdentificacion: '41234567',
      contacto: '3001234567',
    });
  }

  it('con el código correcto abre la sesión y no expone la cédula', async () => {
    const ctx = crearContexto();
    const { solicitudId } = await pedirCodigo(ctx);

    const resultado = await ctx.verificar.ejecutar({
      solicitudId,
      codigo: ' 111111 ',
    });

    expect(resultado.usuario).toEqual({
      nombre: 'Carmen Rodríguez',
      rol: 'USUARIO_PUBLICO',
    });
    expect(resultado.sesion.refreshToken).toBeTruthy();
    expect(ctx.emisor.emitidas).toEqual([
      { id: '41234567', rol: 'USUARIO_PUBLICO' },
    ]);
    // Entró con el celular que no había verificado: ahora queda verificado.
    expect(
      ctx.cuentas.cuentas.find((c) => c.metodoInicioId === 'metodo-celular')
        ?.verificado,
    ).toBe(true);
  });

  it('el código sirve una sola vez', async () => {
    const ctx = crearContexto();
    const { solicitudId } = await pedirCodigo(ctx);
    await ctx.verificar.ejecutar({ solicitudId, codigo: '111111' });

    await expect(
      ctx.verificar.ejecutar({ solicitudId, codigo: '111111' }),
    ).rejects.toBeInstanceOf(SolicitudInicioSesionNoEncontradaError);
  });

  it('con un código incorrecto informa los intentos restantes y luego los agota', async () => {
    const ctx = crearContexto();
    const { solicitudId } = await pedirCodigo(ctx);

    const error = await ctx.verificar
      .ejecutar({ solicitudId, codigo: '000000' })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(CodigoIncorrectoError);
    expect((error as CodigoIncorrectoError).intentosRestantes).toBe(2);

    await ctx.verificar
      .ejecutar({ solicitudId, codigo: '000000' })
      .catch(() => {});
    await ctx.verificar
      .ejecutar({ solicitudId, codigo: '000000' })
      .catch(() => {});

    await expect(
      ctx.verificar.ejecutar({ solicitudId, codigo: '111111' }),
    ).rejects.toBeInstanceOf(IntentosAgotadosError);
    expect(ctx.emisor.emitidas).toHaveLength(0);
  });

  it('rechaza el código vencido', async () => {
    const ctx = crearContexto();
    const { solicitudId } = await pedirCodigo(ctx);
    ctx.reloj.avanzarSegundos(10 * 60);

    await expect(
      ctx.verificar.ejecutar({ solicitudId, codigo: '111111' }),
    ).rejects.toBeInstanceOf(CodigoExpiradoError);
  });

  it('una solicitud desconocida no se puede verificar', async () => {
    const ctx = crearContexto();

    await expect(
      ctx.verificar.ejecutar({ solicitudId: 'no-existe', codigo: '111111' }),
    ).rejects.toBeInstanceOf(SolicitudInicioSesionNoEncontradaError);
  });
});

describe('HU-02 · Renovar y cerrar la sesión', () => {
  const carmen = { id: '41234567', rol: 'USUARIO_PUBLICO' } as const;

  it('cambia el refresh token por una sesión nueva y el anterior deja de servir', async () => {
    const ctx = crearContexto();
    const inicial = await ctx.emisor.iniciar(carmen, ctx.reloj.ahora());

    const renovada = await ctx.renovar.ejecutar(inicial.refreshToken);

    expect(renovada.refreshToken).not.toBe(inicial.refreshToken);
    expect(ctx.emisor.activas().map((s) => s.id)).toEqual([
      renovada.refreshToken,
    ]);
  });

  it('si se reutiliza un refresh token ya rotado, cierra todas las sesiones de la persona', async () => {
    const ctx = crearContexto();
    const inicial = await ctx.emisor.iniciar(carmen, ctx.reloj.ahora());
    const renovada = await ctx.renovar.ejecutar(inicial.refreshToken);

    await expect(
      ctx.renovar.ejecutar(inicial.refreshToken),
    ).rejects.toBeInstanceOf(SesionInvalidaError);

    expect(ctx.emisor.activas()).toHaveLength(0);
    await expect(
      ctx.renovar.ejecutar(renovada.refreshToken),
    ).rejects.toBeInstanceOf(SesionInvalidaError);
  });

  it('rechaza un refresh token vencido o desconocido', async () => {
    const ctx = crearContexto();
    const inicial = await ctx.emisor.iniciar(carmen, ctx.reloj.ahora());
    ctx.reloj.avanzarSegundos(12 * 3600);

    await expect(
      ctx.renovar.ejecutar(inicial.refreshToken),
    ).rejects.toBeInstanceOf(SesionInvalidaError);
    await expect(ctx.renovar.ejecutar('inventado')).rejects.toBeInstanceOf(
      SesionInvalidaError,
    );
  });

  it('no renueva la sesión de una cuenta del personal desactivada', async () => {
    const ctx = crearContexto();
    const inicial = await ctx.emisor.iniciar(
      { id: 'uuid-personal', rol: 'PERSONAL' },
      ctx.reloj.ahora(),
    );
    ctx.emisor.guardados.get(inicial.refreshToken)!.titularActivo = false;

    await expect(
      ctx.renovar.ejecutar(inicial.refreshToken),
    ).rejects.toBeInstanceOf(SesionInvalidaError);
  });

  it('cerrar sesión invalida el refresh token y no falla si se repite', async () => {
    const ctx = crearContexto();
    const inicial = await ctx.emisor.iniciar(carmen, ctx.reloj.ahora());

    await ctx.cerrar.ejecutar(inicial.refreshToken);
    await ctx.cerrar.ejecutar(inicial.refreshToken);
    await ctx.cerrar.ejecutar('inventado');

    expect(ctx.emisor.activas()).toHaveLength(0);
    await expect(
      ctx.renovar.ejecutar(inicial.refreshToken),
    ).rejects.toBeInstanceOf(SesionInvalidaError);
  });
});
