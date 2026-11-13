import type { PersonalRepository } from './ports';
import type { EditarPersonalComando, Personal } from '@/domain/personal/types';

export class EditarPersonal {
  constructor(private readonly repository: PersonalRepository) {}

  async ejecutar(
    token: string,
    id: string,
    comando: EditarPersonalComando,
  ): Promise<Personal> {
    return this.repository.editarPersonal(token, id, comando);
  }
}
