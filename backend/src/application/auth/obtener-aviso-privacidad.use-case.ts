import {
  AvisoPrivacidad,
  AvisoPrivacidadRepository,
} from '../../domain/auth/aviso-privacidad.repository.js';
import { AvisoPrivacidadNoDisponibleError } from '../../domain/auth/errores.js';
import { Reloj } from '../shared/reloj.port.js';

/** HU-01: la pantalla de registro muestra el aviso vigente antes de pedir el consentimiento. */
export class ObtenerAvisoPrivacidadUseCase {
  constructor(
    private readonly avisos: AvisoPrivacidadRepository,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(): Promise<AvisoPrivacidad> {
    const aviso = await this.avisos.vigente(this.reloj.ahora());
    if (!aviso) throw new AvisoPrivacidadNoDisponibleError();
    return aviso;
  }
}
