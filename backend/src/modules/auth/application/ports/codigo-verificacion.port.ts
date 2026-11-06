import { CanalVerificacion } from '../../domain/tipos.js';

export interface GeneradorCodigo {
  /** Código numérico corto que el usuario digita, por ejemplo «483920». */
  generar(): string;
}

export interface HasherCodigo {
  hash(codigo: string): Promise<string>;
  coincide(codigo: string, hash: string): Promise<boolean>;
}

export type PropositoCodigo = 'REGISTRO';

export interface MensajeCodigo {
  canal: CanalVerificacion;
  /** Correo o celular en formato E.164. */
  destino: string;
  codigo: string;
  proposito: PropositoCodigo;
  vigenciaMinutos: number;
}

/** Envía el código por correo o SMS. */
export interface EnviadorCodigo {
  enviar(mensaje: MensajeCodigo): Promise<void>;
}
