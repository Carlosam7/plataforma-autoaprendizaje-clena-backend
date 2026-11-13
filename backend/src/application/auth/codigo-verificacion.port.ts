import { CanalVerificacion } from '../../domain/auth/tipos.js';

export abstract class GeneradorCodigo {
  /** Código numérico corto que el usuario digita, por ejemplo «483920». */
  abstract generar(): string;
}

export abstract class HasherCodigo {
  abstract hash(codigo: string): Promise<string>;
  abstract coincide(codigo: string, hash: string): Promise<boolean>;
}

export type PropositoCodigo =
  'REGISTRO' | 'INICIO_SESION' | 'CAMBIO_PASSWORD_INICIAL' | 'ELIMINAR_CUENTA';

export interface MensajeCodigo {
  canal: CanalVerificacion;
  /** Correo o celular en formato E.164. */
  destino: string;
  codigo: string;
  proposito: PropositoCodigo;
  vigenciaMinutos: number;
}

/** Envía el código por correo o SMS. */
export abstract class EnviadorCodigo {
  abstract enviar(mensaje: MensajeCodigo): Promise<void>;
}
