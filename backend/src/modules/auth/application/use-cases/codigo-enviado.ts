import { RegistroPendiente } from '../../domain/entities/registro-pendiente.js';
import { CanalVerificacion } from '../../domain/tipos.js';

export interface CodigoEnviadoResultado {
  registroId: string;
  canal: CanalVerificacion;
  /** Destino enmascarado para que el usuario confirme dónde buscar el código. */
  destino: string;
  expiraEn: Date;
  puedeReenviarEn: Date;
}

export function resultadoCodigoEnviado(
  registro: RegistroPendiente,
  esperaReenvioSegundos: number,
): CodigoEnviadoResultado {
  return {
    registroId: registro.id,
    canal: registro.canal,
    destino: registro.destino.enmascarado(),
    expiraEn: registro.codigoExpiraEn,
    puedeReenviarEn: new Date(
      registro.codigoEnviadoEn.getTime() + esperaReenvioSegundos * 1000,
    ),
  };
}
