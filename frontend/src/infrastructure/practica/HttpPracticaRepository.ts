import type { PracticaRepository } from '@/application/practica/ports';
import {
  AccesoDenegadoPracticaError,
  ActividadNoEncontradaError,
  ConexionPracticaError,
  EvaluacionInvitadoNoDisponibleError,
  IntentoFinalizadoError,
  IntentoNoEncontradoError,
  PracticaError,
  PracticaNoDisponibleError,
  PreguntaNoEncontradaError,
  PreguntaYaRespondidaError,
  RespuestaInesperadaError,
  RespuestaInvalidaError,
  SesionRequeridaError,
} from '@/domain/practica/errors';
import type {
  Actividad,
  Feedback,
  IntentoIniciado,
  Opcion,
  RespuestaComando,
  RespuestaEvaluada,
  Resultado,
} from '@/domain/practica/types';

export interface HttpPracticaOpciones {
  baseUrl?: string;
  /** Tiempo máximo de espera por petición (ms). */
  timeoutMs?: number;
  /**
   * C-04 sigue PROPUESTO. Mientras BE-01 no entregue el endpoint, la evaluación
   * de invitados queda desactivada y lanza un error explícito sin llamar a la red.
   */
  evaluacionInvitadoHabilitada?: boolean;
}

interface ErrorBackend {
  statusCode?: number;
  codigo?: string;
  mensaje?: string | string[];
}

type Json = Record<string, unknown>;

const TIMEOUT_POR_DEFECTO_MS = 15_000;

// ---- Validación/mapeo estricto del contrato: solo se copian campos conocidos ----

function esObjeto(valor: unknown): valor is Json {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function texto(valor: unknown): string {
  if (typeof valor !== 'string') throw new RespuestaInesperadaError();
  return valor;
}

function entero(valor: unknown): number {
  if (typeof valor !== 'number' || !Number.isInteger(valor)) {
    throw new RespuestaInesperadaError();
  }
  return valor;
}

function booleano(valor: unknown): boolean {
  if (typeof valor !== 'boolean') throw new RespuestaInesperadaError();
  return valor;
}

function objeto(valor: unknown): Json {
  if (!esObjeto(valor)) throw new RespuestaInesperadaError();
  return valor;
}

function arreglo(valor: unknown): unknown[] {
  if (!Array.isArray(valor)) throw new RespuestaInesperadaError();
  return valor;
}

function mapearOpcion(valor: unknown): Opcion {
  const o = objeto(valor);
  return { id: texto(o.id), texto: texto(o.texto) };
}

export function mapearActividad(valor: unknown): Actividad {
  const a = objeto(valor);
  return {
    titulo: texto(a.titulo),
    porcentajeAprobacion: entero(a.porcentajeAprobacion),
    totalPreguntas: entero(a.totalPreguntas),
    // Se descarta cualquier campo extra (p. ej. esCorrecta): nunca se expone antes de responder.
    preguntas: arreglo(a.preguntas).map((p) => {
      const pregunta = objeto(p);
      return {
        id: texto(pregunta.id),
        enunciado: texto(pregunta.enunciado),
        opciones: arreglo(pregunta.opciones).map(mapearOpcion),
      };
    }),
  };
}

function mapearIntento(valor: unknown): IntentoIniciado {
  const i = objeto(valor);
  return { id: texto(i.id), totalPreguntas: entero(i.totalPreguntas) };
}

function mapearFeedback(valor: unknown): Feedback {
  const f = objeto(valor);
  return {
    esCorrecta: booleano(f.esCorrecta),
    opcionCorrecta: mapearOpcion(f.opcionCorrecta),
    explicacion: texto(f.explicacion),
  };
}

function mapearResultado(valor: unknown): Resultado | null {
  if (valor === null) return null;
  const r = objeto(valor);
  return {
    respuestasCorrectas: entero(r.respuestasCorrectas),
    totalPreguntas: entero(r.totalPreguntas),
    porcentaje: entero(r.porcentaje),
    aprobado: booleano(r.aprobado),
    porcentajeAprobacion: entero(r.porcentajeAprobacion),
  };
}

function mapearRespuestaEvaluada(valor: unknown): RespuestaEvaluada {
  const r = objeto(valor);
  if (!('resultado' in r)) throw new RespuestaInesperadaError();
  return {
    ...mapearFeedback(r),
    respondidas: entero(r.respondidas),
    totalPreguntas: entero(r.totalPreguntas),
    resultado: mapearResultado(r.resultado),
  };
}

// ---- Adaptador ----

export class HttpPracticaRepository implements PracticaRepository {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly evaluacionInvitadoHabilitada: boolean;

  constructor(opciones: HttpPracticaOpciones = {}) {
    this.baseUrl = opciones.baseUrl ?? '/api/v1';
    this.timeoutMs = opciones.timeoutMs ?? TIMEOUT_POR_DEFECTO_MS;
    this.evaluacionInvitadoHabilitada =
      opciones.evaluacionInvitadoHabilitada ?? true;
  }

  async obtenerActividad(slug: string): Promise<Actividad> {
    const json = await this.solicitar(
      `/guias/${encodeURIComponent(slug)}/actividad`,
      { method: 'GET' },
      { esActividad: true },
    );
    return mapearActividad(json);
  }

  async iniciarIntentoAutenticado(
    slug: string,
    accessToken: string,
  ): Promise<IntentoIniciado> {
    const json = await this.solicitar(
      `/guias/${encodeURIComponent(slug)}/actividad/intentos`,
      { method: 'POST', accessToken },
      { esActividad: true },
    );
    return mapearIntento(json);
  }

  async responderAutenticado(
    intentoId: string,
    respuesta: RespuestaComando,
    accessToken: string,
  ): Promise<RespuestaEvaluada> {
    const json = await this.solicitar(
      `/intentos/${encodeURIComponent(intentoId)}/respuestas`,
      {
        method: 'POST',
        accessToken,
        body: {
          preguntaId: respuesta.preguntaId,
          opcionId: respuesta.opcionId,
        },
      },
      { esActividad: false },
    );
    return mapearRespuestaEvaluada(json);
  }

  async evaluarInvitado(
    slug: string,
    respuesta: RespuestaComando,
  ): Promise<Feedback> {
    if (!this.evaluacionInvitadoHabilitada) {
      throw new EvaluacionInvitadoNoDisponibleError();
    }
    // Stateless (C-04): un reintento no duplica datos, pero no se reintenta automáticamente.
    const json = await this.solicitar(
      `/guias/${encodeURIComponent(slug)}/actividad/evaluar-respuesta`,
      {
        method: 'POST',
        body: {
          preguntaId: respuesta.preguntaId,
          opcionId: respuesta.opcionId,
        },
      },
      { esActividad: true, esEvaluacionInvitado: true },
    );
    return mapearFeedback(json);
  }

  private async solicitar(
    ruta: string,
    peticion: { method: 'GET' | 'POST'; accessToken?: string; body?: Json },
    contexto: { esActividad: boolean; esEvaluacionInvitado?: boolean },
  ): Promise<unknown> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (peticion.body) headers['Content-Type'] = 'application/json';
    if (peticion.accessToken) {
      headers.Authorization = `Bearer ${peticion.accessToken}`;
    }

    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), this.timeoutMs);

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${ruta}`, {
        method: peticion.method,
        headers,
        credentials: 'include',
        body: peticion.body ? JSON.stringify(peticion.body) : undefined,
        signal: controlador.signal,
      });
    } catch {
      // Red caída o timeout: en POST con estado (intento/respuesta) el resultado es ambiguo.
      const ambigua =
        peticion.method === 'POST' && !contexto.esEvaluacionInvitado;
      throw new ConexionPracticaError(ambigua);
    } finally {
      clearTimeout(temporizador);
    }

    if (!res.ok) {
      await this.lanzarErrorHttp(res, contexto);
    }

    try {
      return await res.json();
    } catch {
      throw new RespuestaInesperadaError();
    }
  }

  private async lanzarErrorHttp(
    res: Response,
    contexto: { esActividad: boolean; esEvaluacionInvitado?: boolean },
  ): Promise<never> {
    let cuerpo: ErrorBackend = {};
    try {
      const json: unknown = await res.json();
      if (esObjeto(json)) cuerpo = json as ErrorBackend;
    } catch {
      // Cuerpo vacío o no JSON: se usa el mensaje por defecto del error tipado.
    }

    const mensaje = Array.isArray(cuerpo.mensaje)
      ? cuerpo.mensaje.join('. ')
      : typeof cuerpo.mensaje === 'string' && cuerpo.mensaje.trim()
        ? cuerpo.mensaje
        : undefined;
    const codigo = typeof cuerpo.codigo === 'string' ? cuerpo.codigo : '';

    switch (codigo) {
      case 'ACTIVIDAD_NO_ENCONTRADA':
        throw new ActividadNoEncontradaError(mensaje);
      case 'PREGUNTA_NO_ENCONTRADA':
        throw new PreguntaNoEncontradaError(mensaje);
      case 'INTENTO_NO_ENCONTRADO':
        throw new IntentoNoEncontradoError(mensaje);
      case 'PREGUNTA_YA_RESPONDIDA':
        throw new PreguntaYaRespondidaError(mensaje);
      case 'INTENTO_FINALIZADO':
        throw new IntentoFinalizadoError(mensaje);
      case 'RESPUESTA_INVALIDA':
        throw new RespuestaInvalidaError(mensaje);
    }

    const status = res.status;
    if (status === 400) {
      throw new RespuestaInvalidaError(
        mensaje ?? 'Los datos enviados no son válidos.',
        codigo || 'DATOS_INVALIDOS',
      );
    }
    if (status === 401) throw new SesionRequeridaError(mensaje);
    if (status === 403) throw new AccesoDenegadoPracticaError(mensaje);
    if (status === 404) {
      // Ruta C-04 aún inexistente en el servidor: 404 genérico, sin código de negocio.
      if (contexto.esEvaluacionInvitado && codigo === 'NO_ENCONTRADO') {
        throw new EvaluacionInvitadoNoDisponibleError();
      }
      if (contexto.esActividad) throw new ActividadNoEncontradaError(mensaje);
      throw new IntentoNoEncontradoError(mensaje);
    }
    if (status === 409) {
      throw new PracticaError(
        mensaje ?? 'Esta práctica cambió hace un momento.',
        409,
        codigo || 'CONFLICTO',
      );
    }
    if (status >= 500) throw new PracticaNoDisponibleError(mensaje, status);

    throw new PracticaError(
      mensaje ?? 'Ocurrió un error al procesar tu práctica.',
      status,
      codigo || undefined,
    );
  }
}
