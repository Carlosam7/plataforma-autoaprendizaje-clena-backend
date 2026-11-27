/** BE-09: si la base de datos responde ahora mismo. Lo implementa la infraestructura. */
export abstract class EstadoBaseDatos {
  abstract disponible(): Promise<boolean>;
}
