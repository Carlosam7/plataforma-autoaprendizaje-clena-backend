import {
  AvisoPrivacidad,
  AvisoPrivacidadRepository,
} from '../../../domain/auth/aviso-privacidad.repository.js';
import { RegistroPendiente } from '../../../domain/auth/registro-pendiente.js';
import { RegistroPendienteRepository } from '../../../domain/auth/registro-pendiente.repository.js';
import { Rol } from '../../../domain/auth/tipos.js';
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
import { EmisorSesion, SesionEmitida } from '../emisor-sesion.port.js';

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
  emitidas: { id: string; rol: Rol }[] = [];
  iniciar(usuario: { id: string; rol: Rol }): Promise<SesionEmitida> {
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
