import { PersonalRepository } from '../../domain/personal/personal.repository.js';
import { buscarPersonalOFallar } from './buscar-personal.js';
import { aResumen, PersonalResumen } from './personal-resumen.js';

export class ObtenerPersonalUseCase {
  constructor(private readonly personal: PersonalRepository) {}

  async ejecutar(id: string): Promise<PersonalResumen> {
    return aResumen(await buscarPersonalOFallar(this.personal, id));
  }
}
