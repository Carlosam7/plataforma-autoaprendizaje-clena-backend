import type { PersonalRepository } from './ports';
import type { SesionPersonal } from '@/domain/personal/types';

export class ObtenerSesionPersonal {
  constructor(private readonly repository: PersonalRepository) {}

  async ejecutar(): Promise<SesionPersonal | null> {
    return this.repository.obtenerSesionPersonal();
  }
}
