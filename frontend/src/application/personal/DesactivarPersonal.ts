import type { PersonalRepository } from './ports';
import type { Personal } from '@/domain/personal/types';

export class DesactivarPersonal {
  constructor(private readonly repository: PersonalRepository) {}

  async ejecutar(token: string, id: string): Promise<Personal> {
    return this.repository.desactivarPersonal(token, id);
  }
}
