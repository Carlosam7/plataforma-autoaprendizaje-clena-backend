import { PoliticaCodigo } from '../domain/entities/registro-pendiente.js';

export interface ConfiguracionRegistro {
  /** Versión del aviso de privacidad vigente; es la que queda registrada como aceptada. */
  versionAvisoPrivacidad: string;
  politicaCodigo: PoliticaCodigo;
}
