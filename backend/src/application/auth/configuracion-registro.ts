import { PoliticaCodigo } from '../../domain/auth/registro-pendiente.js';

/** Parámetros del registro; el módulo los arma desde las variables de entorno. */
export abstract class ConfiguracionRegistro {
  abstract readonly politicaCodigo: PoliticaCodigo;
}
