export interface ConsultaGuia {
  guiaId: string;
  /** Número de identificación del usuario público; null si no inició sesión (sin datos personales). */
  usuarioId: string | null;
  consultadaEn: Date;
}

/** Aperturas de guías para las estadísticas del panel (HU-10, HU-31). */
export abstract class ConsultaGuiaRepository {
  abstract registrar(consulta: ConsultaGuia): Promise<void>;
}
