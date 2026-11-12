import {
  AvisoPrivacidad,
  AvisoPrivacidadRepository,
} from '../../../domain/auth/aviso-privacidad.repository.js';
import { EnvioCodigoFallidoError } from '../../../domain/auth/errores.js';
import { RegistroPendiente } from '../../../domain/auth/registro-pendiente.js';
import { RegistroPendienteRepository } from '../../../domain/auth/registro-pendiente.repository.js';
import {
  SesionActiva,
  SesionRepository,
} from '../../../domain/auth/sesion.repository.js';
import { Usuario } from '../../../domain/auth/usuario.js';
import { UsuarioRepository } from '../../../domain/auth/usuario.repository.js';
import { Correo } from '../../../domain/auth/value-objects/correo.js';
import { NumeroIdentificacion } from '../../../domain/auth/value-objects/numero-identificacion.js';
import { Telefono } from '../../../domain/auth/value-objects/telefono.js';
import { GeneradorId } from '../../shared/generador-id.port.js';
import { Reloj } from '../../shared/reloj.port.js';
import {
  EnviadorCodigo,
  GeneradorCodigo,
  HasherCodigo,
  MensajeCodigo,
} from '../codigo-verificacion.port.js';
import { ConfiguracionRegistro } from '../configuracion-registro.js';
import {
  EmisorSesion,
  RefreshTokenGuardado,
  SesionEmitida,
  TitularSesion,
} from '../emisor-sesion.port.js';
import { CodigoInicioSesion } from '../../../domain/auth/codigo-inicio-sesion.js';
import {
  CuentaParaInicio,
  InicioSesionRepository,
} from '../../../domain/auth/inicio-sesion.repository.js';

export class RelojFijo implements Reloj {
  constructor(public actual: Date) {}
  ahora(): Date {
    return new Date(this.actual);
  }
  avanzarSegundos(segundos: number): void {
    this.actual = new Date(this.actual.getTime() + segundos * 1000);
  }
}

export class GeneradorIdSecuencial implements GeneradorId {
  private n = 0;
  generar(): string {
    this.n += 1;
    return `id-${this.n}`;
  }
}

export class GeneradorCodigoFijo implements GeneradorCodigo {
  constructor(public codigo = '123456') {}
  generar(): string {
    return this.codigo;
  }
}

/** Hash trivial: suficiente para probar la lógica sin el costo de bcrypt. */
export class HasherFalso implements HasherCodigo {
  hash(codigo: string): Promise<string> {
    return Promise.resolve(`hash:${codigo}`);
  }
  coincide(codigo: string, hash: string): Promise<boolean> {
    return Promise.resolve(hash === `hash:${codigo}`);
  }
}

export class EnviadorEnMemoria implements EnviadorCodigo {
  enviados: MensajeCodigo[] = [];
  /** true: el próximo envío falla como si el proveedor de correo o SMS no respondiera. */
  fallaSiguiente = false;
  enviar(mensaje: MensajeCodigo): Promise<void> {
    if (this.fallaSiguiente) {
      this.fallaSiguiente = false;
      return Promise.reject(new EnvioCodigoFallidoError());
    }
    this.enviados.push(mensaje);
    return Promise.resolve();
  }
}

/** Sesiones en memoria: el refresh token es simplemente su id. */
export class EmisorSesionFalso implements EmisorSesion {
  emitidas: TitularSesion[] = [];
  guardados = new Map<string, RefreshTokenGuardado>();
  private n = 0;

  constructor(private readonly duracionHoras = 12) {}

  iniciar(usuario: TitularSesion, ahora = new Date()): Promise<SesionEmitida> {
    this.emitidas.push(usuario);
    this.n += 1;
    const id = `rt-${this.n}`;
    const expiraEn = new Date(ahora.getTime() + this.duracionHoras * 3_600_000);
    this.guardados.set(id, {
      id,
      titular: usuario,
      expiraEn,
      revocadoEn: null,
      reemplazadoPorId: null,
      titularActivo: true,
    });
    return Promise.resolve({
      accessToken: `access-${id}`,
      accessTokenExpiraEn: ahora,
      refreshToken: id,
      refreshTokenExpiraEn: expiraEn,
    });
  }
  buscar(refreshToken: string): Promise<RefreshTokenGuardado | null> {
    const guardado = this.guardados.get(refreshToken);
    return Promise.resolve(guardado ? { ...guardado } : null);
  }
  async rotar(
    anterior: RefreshTokenGuardado,
    ahora: Date,
  ): Promise<SesionEmitida> {
    const sesion = await this.iniciar(anterior.titular, ahora);
    const actual = this.guardados.get(anterior.id)!;
    actual.revocadoEn = ahora;
    actual.reemplazadoPorId = sesion.refreshToken;
    return sesion;
  }
  revocar(id: string, ahora: Date): Promise<void> {
    const guardado = this.guardados.get(id);
    if (guardado && !guardado.revocadoEn) guardado.revocadoEn = ahora;
    return Promise.resolve();
  }
  revocarTodas(titular: TitularSesion, ahora: Date): Promise<void> {
    for (const guardado of this.guardados.values()) {
      if (guardado.titular.id === titular.id && !guardado.revocadoEn)
        guardado.revocadoEn = ahora;
    }
    return Promise.resolve();
  }
  activas(): RefreshTokenGuardado[] {
    return [...this.guardados.values()].filter((g) => !g.revocadoEn);
  }
}

/** Cuentas activas con sus contactos y los códigos de inicio de sesión emitidos. */
export class InicioSesionRepositoryEnMemoria implements InicioSesionRepository {
  cuentas: (CuentaParaInicio & { verificado: boolean })[] = [];
  codigos: CodigoInicioSesion[] = [];

  buscarCuenta(
    numero: NumeroIdentificacion,
    contacto: Correo | Telefono,
  ): Promise<CuentaParaInicio | null> {
    const cuenta = this.cuentas.find(
      (c) =>
        c.usuarioId === numero.valor &&
        c.destino.constructor === contacto.constructor &&
        c.destino.valor === contacto.valor,
    );
    return Promise.resolve(cuenta ?? null);
  }
  buscarCuentaPorContacto(id: string): Promise<CuentaParaInicio | null> {
    return Promise.resolve(
      this.cuentas.find((c) => c.metodoInicioId === id) ?? null,
    );
  }
  ultimoCodigoSinUsar(id: string): Promise<CodigoInicioSesion | null> {
    const codigo = this.codigos.findLast(
      (c) => c.metodoInicioId === id && !c.usadoEn,
    );
    return Promise.resolve(codigo ?? null);
  }
  emitirCodigo(codigo: CodigoInicioSesion): Promise<void> {
    for (const anterior of this.codigos) {
      if (
        anterior.metodoInicioId === codigo.metodoInicioId &&
        !anterior.usadoEn
      )
        anterior.marcarUsado(codigo.creadoEn);
    }
    this.codigos.push(codigo);
    return Promise.resolve();
  }
  // El caso de uso suma el intento fallido en memoria sobre este mismo objeto.
  reservarIntento(codigoId: string, maxIntentos: number): Promise<boolean> {
    const codigo = this.codigos.find((c) => c.id === codigoId);
    return Promise.resolve(
      !!codigo && !codigo.usadoEn && codigo.intentosFallidos < maxIntentos,
    );
  }
  confirmar(codigo: CodigoInicioSesion): Promise<void> {
    const cuenta = this.cuentas.find(
      (c) => c.metodoInicioId === codigo.metodoInicioId,
    );
    if (cuenta) cuenta.verificado = true;
    return Promise.resolve();
  }
}

/** Cuentas verificadas. */
export class UsuarioRepositoryEnMemoria implements UsuarioRepository {
  usuarios: Usuario[] = [];
  existePorIdentificacion(numero: NumeroIdentificacion): Promise<boolean> {
    return Promise.resolve(
      this.usuarios.some((u) => u.numeroIdentificacion.igualA(numero)),
    );
  }
  existePorTelefono(telefono: Telefono): Promise<boolean> {
    return Promise.resolve(
      this.usuarios.some((u) => u.telefono?.igualA(telefono)),
    );
  }
  existePorCorreo(correo: Correo): Promise<boolean> {
    return Promise.resolve(this.usuarios.some((u) => u.correo?.igualA(correo)));
  }
}

/** Registros sin verificar; al confirmar uno, pasa a ser una cuenta en `cuentas`. */
export class RegistroPendienteRepositoryEnMemoria implements RegistroPendienteRepository {
  registros = new Map<string, RegistroPendiente>();

  constructor(private readonly cuentas: UsuarioRepositoryEnMemoria) {}

  buscarPorId(id: string): Promise<RegistroPendiente | null> {
    return Promise.resolve(this.registros.get(id) ?? null);
  }
  buscarPorIdentificacion(
    numero: NumeroIdentificacion,
  ): Promise<RegistroPendiente | null> {
    const registro = [...this.registros.values()].find((r) =>
      r.numeroIdentificacion.igualA(numero),
    );
    return Promise.resolve(registro ?? null);
  }
  buscarPorContacto(
    contacto: Correo | Telefono,
  ): Promise<RegistroPendiente | null> {
    const registro = [...this.registros.values()].find(
      (r) =>
        r.telefono?.valor === contacto.valor ||
        r.correo?.valor === contacto.valor,
    );
    return Promise.resolve(registro ?? null);
  }
  guardar(registro: RegistroPendiente): Promise<void> {
    this.registros.set(registro.id, registro);
    return Promise.resolve();
  }
  reservarIntento(registroId: string, maxIntentos: number): Promise<boolean> {
    const registro = this.registros.get(registroId);
    return Promise.resolve(
      !!registro && registro.intentosFallidos < maxIntentos,
    );
  }
  confirmar(registro: RegistroPendiente): Promise<void> {
    this.registros.delete(registro.id);
    this.cuentas.usuarios.push(registro.confirmar());
    return Promise.resolve();
  }
  eliminar(id: string): Promise<void> {
    this.registros.delete(id);
    return Promise.resolve();
  }
}

export class AvisoPrivacidadRepositoryEnMemoria implements AvisoPrivacidadRepository {
  constructor(
    public aviso: AvisoPrivacidad | null = {
      version: 'v-prueba',
      contenido: 'Aviso de prueba',
      vigenteDesde: new Date('2026-01-01T00:00:00Z'),
    },
  ) {}
  vigente(): Promise<AvisoPrivacidad | null> {
    return Promise.resolve(this.aviso);
  }
}

export const configuracionPrueba: ConfiguracionRegistro = {
  politicaCodigo: {
    vigenciaMinutos: 10,
    maxIntentos: 3,
    esperaReenvioSegundos: 60,
  },
};

export class SesionRepositoryEnMemoria implements SesionRepository {
  sesiones: (SesionActiva & { revocada: boolean })[] = [];

  buscarActiva(sesionId: string): Promise<SesionActiva | null> {
    const sesion = this.sesiones.find(
      (s) => s.sesionId === sesionId && !s.revocada,
    );
    return Promise.resolve(sesion ?? null);
  }
  revocarDePersonal(personalId: string): Promise<void> {
    for (const sesion of this.sesiones) {
      if (sesion.usuarioId === personalId) sesion.revocada = true;
    }
    return Promise.resolve();
  }
}
