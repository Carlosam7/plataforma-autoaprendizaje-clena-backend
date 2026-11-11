import { ReenviarCodigoRegistroUseCase } from '../reenviar-codigo-registro.use-case.js';
import {
  SolicitarRegistroComando,
  SolicitarRegistroUseCase,
} from '../solicitar-registro.use-case.js';
import { VerificarRegistroUseCase } from '../verificar-registro.use-case.js';
import {
  AvisoPrivacidadNoDisponibleError,
  CodigoExpiradoError,
  CodigoIncorrectoError,
  CorreoEnUsoError,
  IdentificacionYaRegistradaError,
  IntentosAgotadosError,
  RegistroNoEncontradoError,
  ReenvioMuyProntoError,
  TelefonoEnUsoError,
} from '../../../domain/auth/errores.js';
import { ConsentimientoRequeridoError } from '../../../domain/auth/value-objects/consentimiento.js';
import { ObtenerAvisoPrivacidadUseCase } from '../obtener-aviso-privacidad.use-case.js';
import {
  AvisoPrivacidadRepositoryEnMemoria,
  configuracionPrueba,
  EmisorSesionFalso,
  EnviadorEnMemoria,
  GeneradorCodigoFijo,
  GeneradorIdSecuencial,
  HasherFalso,
  RegistroPendienteRepositoryEnMemoria,
  RelojFijo,
  UsuarioRepositoryEnMemoria,
} from './fakes.js';

const datosCarmen: SolicitarRegistroComando = {
  nombre: 'Carmen Rodríguez',
  numeroIdentificacion: '41.234.567',
  fechaNacimiento: '1955-08-21',
  telefono: '300 123 4567',
  correo: 'Carmen@Correo.com',
  aceptaAvisoPrivacidad: true,
};

function montar() {
  const usuarios = new UsuarioRepositoryEnMemoria();
  const registros = new RegistroPendienteRepositoryEnMemoria(usuarios);
  const avisos = new AvisoPrivacidadRepositoryEnMemoria();
  const generadorCodigo = new GeneradorCodigoFijo('111111');
  const hasher = new HasherFalso();
  const enviador = new EnviadorEnMemoria();
  const generadorId = new GeneradorIdSecuencial();
  const reloj = new RelojFijo(new Date('2026-11-05T15:00:00Z'));
  const emisor = new EmisorSesionFalso();
  const config = configuracionPrueba;

  return {
    usuarios,
    registros,
    avisos,
    generadorCodigo,
    enviador,
    reloj,
    emisor,
    solicitar: new SolicitarRegistroUseCase(
      usuarios,
      registros,
      avisos,
      generadorCodigo,
      hasher,
      enviador,
      generadorId,
      reloj,
      config,
    ),
    verificar: new VerificarRegistroUseCase(
      registros,
      hasher,
      emisor,
      reloj,
      config,
    ),
    obtenerAviso: new ObtenerAvisoPrivacidadUseCase(avisos, reloj),
    reenviar: new ReenviarCodigoRegistroUseCase(
      registros,
      generadorCodigo,
      hasher,
      enviador,
      reloj,
      config,
    ),
  };
}

/** Registra y verifica una cuenta completa, para preparar escenarios de datos repetidos. */
async function registrarCuenta(
  ctx: ReturnType<typeof montar>,
  datos: SolicitarRegistroComando,
) {
  const { registroId } = await ctx.solicitar.ejecutar(datos);
  return ctx.verificar.ejecutar({ registroId, codigo: '111111' });
}

describe('SolicitarRegistroUseCase', () => {
  it('guarda la solicitud y envía el código al correo, sin crear todavía la cuenta', async () => {
    const ctx = montar();

    const resultado = await ctx.solicitar.ejecutar(datosCarmen);

    expect(resultado).toMatchObject({
      canal: 'CORREO',
      destino: 'c****@correo.com',
    });
    expect(resultado.expiraEn).toEqual(new Date('2026-11-05T15:10:00Z'));
    expect(resultado.puedeReenviarEn).toEqual(new Date('2026-11-05T15:01:00Z'));
    expect(ctx.enviador.enviados).toEqual([
      {
        canal: 'CORREO',
        destino: 'carmen@correo.com',
        codigo: '111111',
        proposito: 'REGISTRO',
        vigenciaMinutos: 10,
      },
    ]);
    expect(ctx.usuarios.usuarios).toHaveLength(0);

    const registro = ctx.registros.registros.get(resultado.registroId)!;
    expect(registro.codigoHash).toBe('hash:111111');
    expect(registro.consentimiento.versionAviso).toBe('v-prueba');
    expect(registro.consentimiento.aceptadoEn).toEqual(
      new Date('2026-11-05T15:00:00Z'),
    );
  });

  it('envía el código por SMS cuando solo hay celular', async () => {
    const ctx = montar();

    const resultado = await ctx.solicitar.ejecutar({
      ...datosCarmen,
      correo: '  ',
    });

    expect(resultado).toMatchObject({
      canal: 'TELEFONO',
      destino: '+57 *** *** 4567',
    });
    expect(ctx.enviador.enviados[0].destino).toBe('+573001234567');
  });

  it('no crea nada si no se aceptó el aviso de privacidad', async () => {
    const ctx = montar();

    await expect(
      ctx.solicitar.ejecutar({ ...datosCarmen, aceptaAvisoPrivacidad: false }),
    ).rejects.toThrow(ConsentimientoRequeridoError);
    expect(ctx.registros.registros.size).toBe(0);
    expect(ctx.enviador.enviados).toHaveLength(0);
  });

  it('no registra a nadie si no hay un aviso de privacidad vigente', async () => {
    const ctx = montar();
    ctx.avisos.aviso = null;

    await expect(ctx.solicitar.ejecutar(datosCarmen)).rejects.toThrow(
      AvisoPrivacidadNoDisponibleError,
    );
    expect(ctx.registros.registros.size).toBe(0);
  });

  describe('contacto reservado por el registro sin terminar de otra persona', () => {
    const datosLuis: SolicitarRegistroComando = {
      ...datosCarmen,
      nombre: 'Luis Rodríguez',
      numeroIdentificacion: '1001234567',
      correo: undefined,
    };

    it('mientras el código del otro sigue vigente, el celular está en uso', async () => {
      const ctx = montar();
      await ctx.solicitar.ejecutar({ ...datosCarmen, correo: undefined });
      ctx.reloj.avanzarSegundos(5 * 60);

      await expect(ctx.solicitar.ejecutar(datosLuis)).rejects.toThrow(
        TelefonoEnUsoError,
      );
    });

    it('si el código del otro ya venció, se libera el celular y se borra ese registro', async () => {
      const ctx = montar();
      const deCarmen = await ctx.solicitar.ejecutar({
        ...datosCarmen,
        correo: undefined,
      });
      ctx.reloj.avanzarSegundos(10 * 60);

      const deLuis = await ctx.solicitar.ejecutar(datosLuis);

      expect(ctx.registros.registros.has(deCarmen.registroId)).toBe(false);
      expect(ctx.registros.registros.get(deLuis.registroId)?.nombre.valor).toBe(
        'Luis Rodríguez',
      );
    });
  });

  describe('datos ya registrados en otra cuenta', () => {
    it('rechaza una identificación con cuenta: «Este usuario ya tiene una cuenta»', async () => {
      const ctx = montar();
      await registrarCuenta(ctx, datosCarmen);

      await expect(
        ctx.solicitar.ejecutar({
          ...datosCarmen,
          numeroIdentificacion: '41234567',
          telefono: '3109998877',
          correo: undefined,
        }),
      ).rejects.toThrow(new IdentificacionYaRegistradaError());
    });

    it('rechaza un teléfono en uso aunque se escriba distinto', async () => {
      const ctx = montar();
      await registrarCuenta(ctx, datosCarmen);

      await expect(
        ctx.solicitar.ejecutar({
          ...datosCarmen,
          numeroIdentificacion: '999999',
          telefono: '+57 3001234567',
          correo: undefined,
        }),
      ).rejects.toThrow(TelefonoEnUsoError);
    });

    it('rechaza un correo en uso aunque cambien las mayúsculas', async () => {
      const ctx = montar();
      await registrarCuenta(ctx, datosCarmen);

      await expect(
        ctx.solicitar.ejecutar({
          ...datosCarmen,
          numeroIdentificacion: '999999',
          telefono: undefined,
          correo: 'CARMEN@correo.com',
        }),
      ).rejects.toThrow(CorreoEnUsoError);
    });
  });

  describe('cuando la persona repite el registro antes de verificar', () => {
    it('reemplaza la solicitud anterior conservando su id', async () => {
      const ctx = montar();
      const primera = await ctx.solicitar.ejecutar(datosCarmen);
      ctx.reloj.avanzarSegundos(60);

      const segunda = await ctx.solicitar.ejecutar({
        ...datosCarmen,
        nombre: 'Carmen R.',
      });

      expect(segunda.registroId).toBe(primera.registroId);
      expect(ctx.registros.registros.size).toBe(1);
      expect(
        ctx.registros.registros.get(primera.registroId)!.nombre.valor,
      ).toBe('Carmen R.');
    });

    it('respeta la espera mínima entre envíos', async () => {
      const ctx = montar();
      await ctx.solicitar.ejecutar(datosCarmen);
      ctx.reloj.avanzarSegundos(10);

      await expect(ctx.solicitar.ejecutar(datosCarmen)).rejects.toThrow(
        ReenvioMuyProntoError,
      );
      expect(ctx.enviador.enviados).toHaveLength(1);
    });
  });
});

describe('VerificarRegistroUseCase', () => {
  it('con el código correcto crea la cuenta pública y deja la sesión iniciada', async () => {
    const ctx = montar();
    const { registroId } = await ctx.solicitar.ejecutar(datosCarmen);

    const resultado = await ctx.verificar.ejecutar({
      registroId,
      codigo: ' 111111 ',
    });

    // La respuesta no expone el identificador (la cédula): solo nombre y rol.
    expect(resultado.usuario).toEqual({
      nombre: 'Carmen Rodríguez',
      rol: 'USUARIO_PUBLICO',
    });
    expect(resultado.sesion.accessToken).toBe('access-41234567');
    // La sesión sí se abre para ese usuario; el emisor decide qué va en el token.
    expect(ctx.emisor.emitidas).toEqual([
      { id: '41234567', rol: 'USUARIO_PUBLICO' },
    ]);

    const [usuario] = ctx.usuarios.usuarios;
    expect(usuario.correo?.valor).toBe('carmen@correo.com');
    expect(usuario.telefono?.valor).toBe('+573001234567');
    expect(usuario.consentimiento?.versionAviso).toBe('v-prueba');
    expect(ctx.registros.registros.size).toBe(0);
  });

  it('con un código incorrecto informa los intentos restantes y no crea la cuenta', async () => {
    const ctx = montar();
    const { registroId } = await ctx.solicitar.ejecutar(datosCarmen);

    await expect(
      ctx.verificar.ejecutar({ registroId, codigo: '000000' }),
    ).rejects.toThrow(expect.objectContaining({ intentosRestantes: 2 }));
    await expect(
      ctx.verificar.ejecutar({ registroId, codigo: '000000' }),
    ).rejects.toThrow(CodigoIncorrectoError);
    expect(ctx.registros.registros.get(registroId)!.intentosFallidos).toBe(2);
    expect(ctx.usuarios.usuarios).toHaveLength(0);
  });

  it('tras agotar los intentos rechaza incluso el código correcto', async () => {
    const ctx = montar();
    const { registroId } = await ctx.solicitar.ejecutar(datosCarmen);
    for (let i = 0; i < configuracionPrueba.politicaCodigo.maxIntentos; i++) {
      await ctx.verificar
        .ejecutar({ registroId, codigo: '000000' })
        .catch(() => undefined);
    }

    await expect(
      ctx.verificar.ejecutar({ registroId, codigo: '111111' }),
    ).rejects.toThrow(IntentosAgotadosError);
  });

  it('rechaza un código vencido', async () => {
    const ctx = montar();
    const { registroId } = await ctx.solicitar.ejecutar(datosCarmen);
    ctx.reloj.avanzarSegundos(10 * 60);

    await expect(
      ctx.verificar.ejecutar({ registroId, codigo: '111111' }),
    ).rejects.toThrow(CodigoExpiradoError);
  });

  it('rechaza una solicitud que no existe', async () => {
    const ctx = montar();
    await expect(
      ctx.verificar.ejecutar({ registroId: 'no-existe', codigo: '111111' }),
    ).rejects.toThrow(RegistroNoEncontradoError);
  });
});

describe('ObtenerAvisoPrivacidadUseCase', () => {
  it('devuelve el aviso vigente para mostrarlo en el registro', async () => {
    const ctx = montar();
    await expect(ctx.obtenerAviso.ejecutar()).resolves.toMatchObject({
      version: 'v-prueba',
    });
  });

  it('falla con un mensaje claro si no hay aviso vigente', async () => {
    const ctx = montar();
    ctx.avisos.aviso = null;
    await expect(ctx.obtenerAviso.ejecutar()).rejects.toThrow(
      AvisoPrivacidadNoDisponibleError,
    );
  });
});

describe('ReenviarCodigoRegistroUseCase', () => {
  it('envía un código nuevo que reemplaza al anterior', async () => {
    const ctx = montar();
    const { registroId } = await ctx.solicitar.ejecutar(datosCarmen);
    ctx.reloj.avanzarSegundos(60);
    ctx.generadorCodigo.codigo = '222222';

    const resultado = await ctx.reenviar.ejecutar({ registroId });

    expect(resultado.registroId).toBe(registroId);
    expect(ctx.enviador.enviados.map((m) => m.codigo)).toEqual([
      '111111',
      '222222',
    ]);
    await expect(
      ctx.verificar.ejecutar({ registroId, codigo: '111111' }),
    ).rejects.toThrow(CodigoIncorrectoError);
    await expect(
      ctx.verificar.ejecutar({ registroId, codigo: '222222' }),
    ).resolves.toBeDefined();
  });

  it('exige esperar antes de reenviar', async () => {
    const ctx = montar();
    const { registroId } = await ctx.solicitar.ejecutar(datosCarmen);

    await expect(ctx.reenviar.ejecutar({ registroId })).rejects.toThrow(
      ReenvioMuyProntoError,
    );
  });

  it('rechaza una solicitud que no existe', async () => {
    const ctx = montar();
    await expect(
      ctx.reenviar.ejecutar({ registroId: 'no-existe' }),
    ).rejects.toThrow(RegistroNoEncontradoError);
  });
});
