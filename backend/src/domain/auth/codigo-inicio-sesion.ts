import {
  CodigoExpiradoError,
  IntentosAgotadosError,
  ReenvioMuyProntoError,
} from './errores.js';
import { PoliticaCodigo } from './registro-pendiente.js';

export interface CodigoInicioSesionProps {
  id: string;
  /** Correo o celular de la cuenta al que se envió el código. */
  metodoInicioId: string;
  codigoHash: string;
  intentosFallidos: number;
  creadoEn: Date;
  expiraEn: Date;
  usadoEn: Date | null;
}

/** HU-02: código de un solo uso que el usuario público digita para entrar. */
export class CodigoInicioSesion {
  private constructor(private props: CodigoInicioSesionProps) {}

  static emitir(datos: {
    id: string;
    metodoInicioId: string;
    codigoHash: string;
    ahora: Date;
    politica: PoliticaCodigo;
  }): CodigoInicioSesion {
    return new CodigoInicioSesion({
      id: datos.id,
      metodoInicioId: datos.metodoInicioId,
      codigoHash: datos.codigoHash,
      intentosFallidos: 0,
      creadoEn: datos.ahora,
      expiraEn: new Date(
        datos.ahora.getTime() + datos.politica.vigenciaMinutos * 60_000,
      ),
      usadoEn: null,
    });
  }

  static reconstituir(props: CodigoInicioSesionProps): CodigoInicioSesion {
    return new CodigoInicioSesion({ ...props });
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

  /** Lanza un error si el código ya venció o se agotaron los intentos. */
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

  /** Momento desde el que se puede pedir otro código. */
  puedeReenviarEn(politica: PoliticaCodigo): Date {
    return new Date(
      this.props.creadoEn.getTime() + politica.esperaReenvioSegundos * 1000,
    );
  }

  get id(): string {
    return this.props.id;
  }
  get metodoInicioId(): string {
    return this.props.metodoInicioId;
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
