import {
  CodigoExpiradoError,
  IntentosAgotadosError,
  ReenvioMuyProntoError,
} from '../auth/errores.js';
import { PoliticaCodigo } from '../auth/registro-pendiente.js';

export type PropositoCodigoPersonal = 'CAMBIO_PASSWORD_INICIAL';

export interface CodigoPersonalProps {
  id: string;
  personalId: string;
  proposito: PropositoCodigoPersonal;
  codigoHash: string;
  intentosFallidos: number;
  creadoEn: Date;
  expiraEn: Date;
  usadoEn: Date | null;
}

/** Código de un solo uso que se envía al correo de una persona del personal para verificar su identidad. */
export class CodigoPersonal {
  private constructor(private props: CodigoPersonalProps) {}

  static emitir(datos: {
    id: string;
    personalId: string;
    proposito: PropositoCodigoPersonal;
    codigoHash: string;
    ahora: Date;
    politica: PoliticaCodigo;
  }): CodigoPersonal {
    return new CodigoPersonal({
      id: datos.id,
      personalId: datos.personalId,
      proposito: datos.proposito,
      codigoHash: datos.codigoHash,
      intentosFallidos: 0,
      creadoEn: datos.ahora,
      expiraEn: new Date(
        datos.ahora.getTime() + datos.politica.vigenciaMinutos * 60_000,
      ),
      usadoEn: null,
    });
  }

  static reconstituir(props: CodigoPersonalProps): CodigoPersonal {
    return new CodigoPersonal({ ...props });
  }

  /** Lanza un error si este código se envió hace muy poco para mandar otro. */
  asegurarQuePuedeReenviar(ahora: Date, politica: PoliticaCodigo): void {
    const transcurridos =
      (ahora.getTime() - this.props.creadoEn.getTime()) / 1000;
    if (transcurridos < politica.esperaReenvioSegundos) {
      throw new ReenvioMuyProntoError(
        Math.ceil(politica.esperaReenvioSegundos - transcurridos),
      );
    }
  }

  asegurarUtilizable(ahora: Date, politica: PoliticaCodigo): void {
    if (this.props.intentosFallidos >= politica.maxIntentos)
      throw new IntentosAgotadosError();
    if (ahora.getTime() >= this.props.expiraEn.getTime())
      throw new CodigoExpiradoError();
  }

  /** Registra un intento fallido y devuelve cuántos quedan. */
  registrarIntentoFallido(politica: PoliticaCodigo): number {
    this.props.intentosFallidos += 1;
    return Math.max(politica.maxIntentos - this.props.intentosFallidos, 0);
  }

  marcarUsado(ahora: Date): void {
    this.props.usadoEn = ahora;
  }

  get id(): string {
    return this.props.id;
  }
  get personalId(): string {
    return this.props.personalId;
  }
  get proposito(): PropositoCodigoPersonal {
    return this.props.proposito;
  }
  get codigoHash(): string {
    return this.props.codigoHash;
  }
  get intentosFallidos(): number {
    return this.props.intentosFallidos;
  }
  get creadoEn(): Date {
    return this.props.creadoEn;
  }
  get expiraEn(): Date {
    return this.props.expiraEn;
  }
  get usadoEn(): Date | null {
    return this.props.usadoEn;
  }
}
