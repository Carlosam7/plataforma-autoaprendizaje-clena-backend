import { SesionRepository } from '../../domain/auth/sesion.repository.js';
import { PersonalRepository } from '../../domain/personal/personal.repository.js';
import { Reloj } from '../shared/reloj.port.js';
import { buscarPersonalOFallar } from './buscar-personal.js';
import { aResumen, PersonalResumen } from './personal-resumen.js';

/**
 * HU-04: el monitor que deja el CLENA ya no puede entrar. Se cierran sus sesiones abiertas
 * para que la desactivación aplique de inmediato; sus registros históricos se conservan.
 */
export class DesactivarPersonalUseCase {
  constructor(
    private readonly personal: PersonalRepository,
    private readonly sesiones: SesionRepository,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(
    id: string,
    administradorId: string,
  ): Promise<PersonalResumen> {
    const cuenta = await buscarPersonalOFallar(this.personal, id);
    cuenta.desactivar(administradorId);
    await this.personal.actualizar(cuenta);
    await this.sesiones.revocarDePersonal(cuenta.id, this.reloj.ahora());
    return aResumen(cuenta);
  }
}
