import type { PersonalRepository } from './ports';
import type {
  ListarPersonalCriterio,
  PersonalPaginado,
} from '@/domain/personal/types';

export class ListarPersonal {
  constructor(private readonly repository: PersonalRepository) {}

  async ejecutar(
    token: string,
    criterio?: ListarPersonalCriterio,
  ): Promise<PersonalPaginado> {
    return this.repository.listarPersonal(token, criterio);
  }
}
