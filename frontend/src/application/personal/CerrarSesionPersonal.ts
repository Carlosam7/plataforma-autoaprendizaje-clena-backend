import type { PersonalRepository } from './ports';

export class CerrarSesionPersonal {
  constructor(private readonly repository: PersonalRepository) {}

  async ejecutar(): Promise<void> {
    await this.repository.cerrarSesionPersonal();
  }
}
