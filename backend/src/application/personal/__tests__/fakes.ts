import { Correo } from '../../../domain/auth/value-objects/correo.js';
import { NombrePersona } from '../../../domain/auth/value-objects/nombre-persona.js';
import {
  CodigoPersonal,
  PropositoCodigoPersonal,
} from '../../../domain/personal/codigo-personal.js';
import { CodigoPersonalRepository } from '../../../domain/personal/codigo-personal.repository.js';
import { Personal, RolPersonal } from '../../../domain/personal/personal.js';
import {
  CriterioPersonal,
  PersonalRepository,
} from '../../../domain/personal/personal.repository.js';
import { Pagina } from '../../../domain/shared/pagina.js';
import { HasherPassword } from '../hasher-password.port.js';

export class PersonalRepositoryEnMemoria implements PersonalRepository {
  cuentas = new Map<string, Personal>();

  buscarPorId(id: string): Promise<Personal | null> {
    return Promise.resolve(this.cuentas.get(id) ?? null);
  }
  existeCorreo(correo: Correo, exceptoId?: string): Promise<boolean> {
    return Promise.resolve(
      [...this.cuentas.values()].some(
        (p) => p.correo.igualA(correo) && p.id !== exceptoId,
      ),
    );
  }
  crear(personal: Personal): Promise<void> {
    this.cuentas.set(personal.id, personal);
    return Promise.resolve();
  }
  actualizar(personal: Personal): Promise<void> {
    this.cuentas.set(personal.id, personal);
    return Promise.resolve();
  }
  listar(criterio: CriterioPersonal): Promise<Pagina<Personal>> {
    const todos = [...this.cuentas.values()].filter(
      (p) =>
        (criterio.rol === undefined || p.rol === criterio.rol) &&
        (criterio.activo === undefined || p.activo === criterio.activo),
    );
    const inicio = (criterio.pagina - 1) * criterio.limite;
    return Promise.resolve({
      elementos: todos.slice(inicio, inicio + criterio.limite),
      total: todos.length,
    });
  }
}

export class CodigoPersonalRepositoryEnMemoria implements CodigoPersonalRepository {
  codigos: CodigoPersonal[] = [];

  ultimoSinUsar(
    personalId: string,
    proposito: PropositoCodigoPersonal,
  ): Promise<CodigoPersonal | null> {
    const codigo = this.codigos.findLast(
      (c) =>
        c.personalId === personalId && c.proposito === proposito && !c.usadoEn,
    );
    return Promise.resolve(codigo ?? null);
  }
  emitir(codigo: CodigoPersonal): Promise<void> {
    for (const anterior of this.codigos) {
      if (anterior.personalId === codigo.personalId && !anterior.usadoEn)
        anterior.marcarUsado(codigo.creadoEn);
    }
    this.codigos.push(codigo);
    return Promise.resolve();
  }
  actualizar(): Promise<void> {
    return Promise.resolve();
  }
}

export class HasherPasswordFalso implements HasherPassword {
  hash(password: string): Promise<string> {
    return Promise.resolve(`pw:${password}`);
  }
  coincide(password: string, hash: string): Promise<boolean> {
    return Promise.resolve(hash === `pw:${password}`);
  }
}

export function cuentaPersonal(
  id: string,
  datos: { correo?: string; rol?: RolPersonal; password?: string } = {},
): Personal {
  return Personal.crear({
    id,
    nombre: NombrePersona.crear(`Persona ${id}`),
    correo: Correo.crear(datos.correo ?? `${id}@clena.example`),
    rol: datos.rol ?? 'PERSONAL',
    passwordHash: `pw:${datos.password ?? 'Temporal2026'}`,
    creadoPorId: null,
    ahora: new Date('2026-11-01T00:00:00Z'),
  });
}
