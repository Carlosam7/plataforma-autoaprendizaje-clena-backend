import type { PersonalRepository } from './ports';
import type { CodigoPasswordEnviado } from '@/domain/personal/types';

export class SolicitarCodigoPasswordInicial {
  constructor(private readonly repository: PersonalRepository) {}

  async ejecutar(token: string): Promise<CodigoPasswordEnviado> {
    return this.repository.solicitarCodigoPasswordInicial(token);
  }
}
