import { GeneradorId } from '../../../src/shared/application/generador-id.port.js';
import { Reloj } from '../../../src/shared/application/reloj.port.js';
import { ConfiguracionRegistro } from '../../../src/modules/auth/application/configuracion-registro.js';
import {
  EnviadorCodigo,
  GeneradorCodigo,
  HasherCodigo,
  MensajeCodigo,
} from '../../../src/modules/auth/application/ports/codigo-verificacion.port.js';
import {
  EmisorSesion,
  SesionEmitida,
} from '../../../src/modules/auth/application/ports/emisor-sesion.port.js';
import { RegistroPendiente } from '../../../src/modules/auth/domain/entities/registro-pendiente.js';
import { Usuario } from '../../../src/modules/auth/domain/entities/usuario.js';
import { RegistroPendienteRepository } from '../../../src/modules/auth/domain/repositories/registro-pendiente.repository.js';
import { UsuarioRepository } from '../../../src/modules/auth/domain/repositories/usuario.repository.js';
import { Correo } from '../../../src/modules/auth/domain/value-objects/correo.js';
import { NumeroIdentificacion } from '../../../src/modules/auth/domain/value-objects/numero-identificacion.js';
import { Telefono } from '../../../src/modules/auth/domain/value-objects/telefono.js';

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
  enviar(mensaje: MensajeCodigo): Promise<void> {
    this.enviados.push(mensaje);
    return Promise.resolve();
  }
}

export class EmisorSesionFalso implements EmisorSesion {
  emitidas: { id: string; rol: string }[] = [];
  iniciar(usuario: {
    id: string;
    rol: Usuario['rol'];
  }): Promise<SesionEmitida> {
    this.emitidas.push(usuario);
    const ahora = new Date();
    return Promise.resolve({
      accessToken: `access-${usuario.id}`,
      accessTokenExpiraEn: ahora,
      refreshToken: `refresh-${usuario.id}`,
      refreshTokenExpiraEn: ahora,
    });
  }
}

export class UsuarioRepositoryEnMemoria implements UsuarioRepository {
  usuarios: Usuario[] = [];
  existePorIdentificacion(numero: NumeroIdentificacion): Promise<boolean> {
    return Promise.resolve(
      this.usuarios.some((u) => u.numeroIdentificacion?.igualA(numero)),
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
  crear(usuario: Usuario): Promise<void> {
    this.usuarios.push(usuario);
    return Promise.resolve();
  }
}

export class RegistroPendienteRepositoryEnMemoria implements RegistroPendienteRepository {
  registros = new Map<string, RegistroPendiente>();
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
  guardar(registro: RegistroPendiente): Promise<void> {
    this.registros.set(registro.id, registro);
    return Promise.resolve();
  }
  eliminar(id: string): Promise<void> {
    this.registros.delete(id);
    return Promise.resolve();
  }
}

export const configuracionPrueba: ConfiguracionRegistro = {
  versionAvisoPrivacidad: 'v-prueba',
  politicaCodigo: {
    vigenciaMinutos: 10,
    maxIntentos: 3,
    esperaReenvioSegundos: 60,
  },
};
