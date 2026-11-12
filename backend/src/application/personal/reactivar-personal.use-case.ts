import { PersonalRepository } from '../../domain/personal/personal.repository.js';
import { buscarPersonalOFallar } from './buscar-personal.js';
import { aResumen, PersonalResumen } from './personal-resumen.js';

export class ReactivarPersonalUseCase {
  constructor(private readonly personal: PersonalRepository) {}

  async ejecutar(id: string): Promise<PersonalResumen> {
    const cuenta = await buscarPersonalOFallar(this.personal, id);
    cuenta.reactivar();
    await this.personal.actualizar(cuenta);
    return aResumen(cuenta);
  }
}
