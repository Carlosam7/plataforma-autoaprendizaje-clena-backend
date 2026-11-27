import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  AccesoDenegadoPracticaError,
  ActividadNoEncontradaError,
  ConexionPracticaError,
  EvaluacionInvitadoNoDisponibleError,
  IntentoFinalizadoError,
  IntentoNoEncontradoError,
  PracticaError,
  PreguntaNoEncontradaError,
  PreguntaYaRespondidaError,
  SesionRequeridaError,
} from '@/domain/practica/errors';
import type {
  Actividad,
  Feedback,
  ModoPractica,
  Resultado,
} from '@/domain/practica/types';
import { container } from '@/main/container';
import { rutaAyuda } from '@/presentation/ayuda/rutaAyuda';

type EstadoPantalla =
  | { tipo: 'cargando' }
  | { tipo: 'sin_actividad'; mensaje: string }
  | { tipo: 'sesion_requerida'; mensaje: string }
  | { tipo: 'error_carga'; mensaje: string }
  | {
      tipo: 'activa';
      modo: ModoPractica;
      actividad: Actividad;
      /** Solo en modo REGISTRADO; en INVITADO siempre null (sin persistencia). */
      intentoId: string | null;
    };

interface ErrorEnvio {
  mensaje: string;
  requiereReiniciar: boolean;
  requiereSesion: boolean;
}

const LETRAS_OPCION = ['A', 'B', 'C', 'D'] as const;

function letraDeOpcion(indice: number): string {
  return LETRAS_OPCION[indice] ?? String(indice + 1);
}

function clasificarErrorEnvio(error: unknown): ErrorEnvio {
  if (
    error instanceof SesionRequeridaError ||
    error instanceof AccesoDenegadoPracticaError
  ) {
    return {
      mensaje: error.message,
      requiereReiniciar: false,
      requiereSesion: true,
    };
  }
  if (
    error instanceof IntentoNoEncontradoError ||
    error instanceof PreguntaNoEncontradaError ||
    error instanceof PreguntaYaRespondidaError ||
    error instanceof IntentoFinalizadoError
  ) {
    return {
      mensaje: error.message,
      requiereReiniciar: true,
      requiereSesion: false,
    };
  }
  if (error instanceof ConexionPracticaError && error.ambigua) {
    return {
      mensaje: error.message,
      requiereReiniciar: true,
      requiereSesion: false,
    };
  }
  if (error instanceof PracticaError) {
    return {
      mensaje: error.message,
      requiereReiniciar: false,
      requiereSesion: false,
    };
  }
  return {
    mensaje: 'No pudimos comprobar tu respuesta. Intenta de nuevo.',
    requiereReiniciar: false,
    requiereSesion: false,
  };
}

export function GuiaPracticaPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [pantalla, setPantalla] = useState<EstadoPantalla>({
    tipo: 'cargando',
  });
  const [reinicioSeq, setReinicioSeq] = useState(0);

  // Estado del recorrido de preguntas (en invitados vive únicamente en memoria React)
  const [preguntaIndex, setPreguntaIndex] = useState(0);
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<string | null>(
    null,
  );
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [aciertosInvitado, setAciertosInvitado] = useState(0);
  const [resultadoFinal, setResultadoFinal] = useState<Resultado | null>(null);
  const [errorEnvio, setErrorEnvio] = useState<ErrorEnvio | null>(null);

  // Bloqueo síncrono contra doble clic en el mismo tick de render
  const enviandoRef = useRef(false);

  const reiniciarPractica = useCallback(() => {
    enviandoRef.current = false;
    setPreguntaIndex(0);
    setOpcionSeleccionada(null);
    setEnviando(false);
    setFeedback(null);
    setAciertosInvitado(0);
    setResultadoFinal(null);
    setErrorEnvio(null);
    setPantalla({ tipo: 'cargando' });
    setReinicioSeq((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!slug) return;

    let cancelado = false;

    const cargar = async () => {
      try {
        const [actividad, modo] = await Promise.all([
          container.practica.obtenerActividad.ejecutar(slug),
          container.practica.determinarModo(),
        ]);

        if (cancelado) return;

        if (modo === 'INVITADO') {
          // C-04: invitados practican sin crear intento ni guardar filas en BD.
          // Todo el avance y aciertos viven solo en memoria de React.
          enviandoRef.current = false;
          setPreguntaIndex(0);
          setOpcionSeleccionada(null);
          setEnviando(false);
          setFeedback(null);
          setAciertosInvitado(0);
          setResultadoFinal(null);
          setErrorEnvio(null);
          setPantalla({
            tipo: 'activa',
            modo: 'INVITADO',
            actividad,
            intentoId: null,
          });
          return;
        }

        const intento =
          await container.practica.iniciarIntentoAutenticado.ejecutar(slug);

        if (cancelado) return;

        enviandoRef.current = false;
        setPreguntaIndex(0);
        setOpcionSeleccionada(null);
        setEnviando(false);
        setFeedback(null);
        setAciertosInvitado(0);
        setResultadoFinal(null);
        setErrorEnvio(null);
        setPantalla({
          tipo: 'activa',
          modo: 'REGISTRADO',
          actividad,
          intentoId: intento.id,
        });
      } catch (err) {
        if (cancelado) return;
        if (err instanceof ActividadNoEncontradaError) {
          setPantalla({ tipo: 'sin_actividad', mensaje: err.message });
          return;
        }
        if (
          err instanceof SesionRequeridaError ||
          err instanceof AccesoDenegadoPracticaError
        ) {
          setPantalla({ tipo: 'sesion_requerida', mensaje: err.message });
          return;
        }
        if (err instanceof EvaluacionInvitadoNoDisponibleError) {
          setPantalla({ tipo: 'sesion_requerida', mensaje: err.message });
          return;
        }
        const mensaje =
          err instanceof PracticaError
            ? err.message
            : 'No pudimos cargar la práctica en este momento. Intenta de nuevo.';
        setPantalla({ tipo: 'error_carga', mensaje });
      }
    };

    void cargar();

    return () => {
      cancelado = true;
    };
  }, [slug, reinicioSeq]);

  if (!slug) {
    return (
      <main
        id="contenido"
        className="max-w-360 mx-auto px-4 md:px-12 lg:px-24 py-16 flex flex-col items-center gap-6 text-center"
      >
        <h1 className="text-[2rem] font-bold text-[#17324d]">
          Esta guía no tiene práctica disponible aún
        </h1>
        <p className="text-[1.111rem] text-[#526575] max-w-125">
          No encontramos la guía de esta práctica.
        </p>
        <Link
          to="/guias"
          className="inline-flex items-center justify-center min-h-14 px-8 font-semibold text-white bg-[#0d6258] rounded-xl hover:bg-[#09473f] no-underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0d6258]/40"
        >
          Volver a las guías
        </Link>
      </main>
    );
  }

  if (pantalla.tipo === 'cargando') {
    return (
      <main
        id="contenido"
        className="max-w-360 mx-auto px-4 md:px-12 lg:px-24 py-16 text-center text-[1.111rem] text-[#526575]"
        role="status"
      >
        Cargando práctica interactiva...
      </main>
    );
  }

  if (pantalla.tipo === 'sin_actividad') {
    return (
      <main
        id="contenido"
        className="max-w-360 mx-auto px-4 md:px-12 lg:px-24 py-16 flex flex-col items-center gap-6 text-center"
      >
        <h1 className="text-[2rem] font-bold text-[#17324d]">
          Esta guía no tiene práctica disponible aún
        </h1>
        <p className="text-[1.111rem] text-[#526575] max-w-125">
          {pantalla.mensaje}
        </p>
        <Link
          to={slug ? `/guias/${slug}` : '/guias'}
          className="inline-flex items-center justify-center min-h-14 px-8 font-semibold text-white bg-[#0d6258] rounded-xl hover:bg-[#09473f] no-underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0d6258]/40"
        >
          Volver a la guía
        </Link>
      </main>
    );
  }

  if (pantalla.tipo === 'sesion_requerida') {
    return (
      <main
        id="contenido"
        className="max-w-360 mx-auto px-4 md:px-12 lg:px-24 py-16 flex flex-col items-center gap-6 text-center"
      >
        <h1 className="text-[2rem] font-bold text-[#17324d]">
          Tu sesión necesita renovarse
        </h1>
        <p className="text-[1.111rem] text-[#526575] max-w-135" role="alert">
          {pantalla.mensaje}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/iniciar-sesion"
            className="inline-flex items-center justify-center min-h-14 px-8 py-4 font-semibold text-white bg-[#0d6258] rounded-xl hover:bg-[#09473f] no-underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0d6258]/40"
          >
            Iniciar sesión
          </Link>
          <Link
            to={slug ? `/guias/${slug}` : '/guias'}
            className="inline-flex items-center justify-center min-h-14 px-8 py-4 font-semibold text-[#17324d] bg-white border border-[#d7e2e7] rounded-xl hover:bg-[#f1f5f5] no-underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0d6258]/40"
          >
            Volver a la guía
          </Link>
        </div>
      </main>
    );
  }

  if (pantalla.tipo === 'error_carga') {
    return (
      <main
        id="contenido"
        className="max-w-360 mx-auto px-4 md:px-12 lg:px-24 py-16 flex flex-col items-center gap-6 text-center"
      >
        <h1 className="text-[2rem] font-bold text-[#17324d]">
          No pudimos cargar la práctica
        </h1>
        <p className="text-[1.111rem] text-[#526575] max-w-135" role="alert">
          {pantalla.mensaje}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={reiniciarPractica}
            className="inline-flex items-center justify-center min-h-14 px-8 py-4 font-semibold text-white bg-[#0d6258] rounded-xl hover:bg-[#09473f] cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0d6258]/40"
          >
            Reintentar
          </button>
          <Link
            to={slug ? `/guias/${slug}` : '/guias'}
            className="inline-flex items-center justify-center min-h-14 px-8 py-4 font-semibold text-[#17324d] bg-white border border-[#d7e2e7] rounded-xl hover:bg-[#f1f5f5] no-underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0d6258]/40"
          >
            Volver a la guía
          </Link>
        </div>
      </main>
    );
  }

  const { actividad, intentoId, modo } = pantalla;
  const { preguntas, totalPreguntas } = actividad;
  const preguntaActual = preguntas[preguntaIndex];
  const esUltimaPregunta = preguntaIndex === totalPreguntas - 1;
  const porcentajeProgreso = Math.round(
    ((preguntaIndex + 1) / totalPreguntas) * 100,
  );
  const revisado = feedback !== null;

  const comprobarRespuesta = async () => {
    if (!opcionSeleccionada || revisado || enviandoRef.current) return;

    enviandoRef.current = true;
    setEnviando(true);
    setErrorEnvio(null);

    try {
      if (modo === 'REGISTRADO' && intentoId) {
        const evaluada = await container.practica.responderAutenticado.ejecutar(
          {
            intentoId,
            preguntaId: preguntaActual.id,
            opcionId: opcionSeleccionada,
          },
        );

        setFeedback({
          esCorrecta: evaluada.esCorrecta,
          opcionCorrecta: evaluada.opcionCorrecta,
          explicacion: evaluada.explicacion,
        });

        if (evaluada.resultado) {
          setResultadoFinal(evaluada.resultado);
        }
      } else {
        const evaluada = await container.practica.evaluarInvitado.ejecutar({
          slug,
          preguntaId: preguntaActual.id,
          opcionId: opcionSeleccionada,
        });

        setFeedback(evaluada);

        const nuevosAciertos = aciertosInvitado + (evaluada.esCorrecta ? 1 : 0);
        setAciertosInvitado(nuevosAciertos);

        if (esUltimaPregunta) {
          const calculo = container.guias.calcularResultado.ejecutar({
            guiaSlug: slug,
            totalPreguntas,
            aciertos: nuevosAciertos,
            umbralAprobacion: actividad.porcentajeAprobacion,
          });
          setResultadoFinal({
            respuestasCorrectas: calculo.aciertos,
            totalPreguntas: calculo.totalPreguntas,
            porcentaje: calculo.porcentaje,
            aprobado: calculo.aprobada,
            porcentajeAprobacion: calculo.umbralAprobacion,
          });
        }
      }
    } catch (err) {
      setErrorEnvio(clasificarErrorEnvio(err));
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  };

  const avanzarSiguientePregunta = () => {
    if (!revisado) return;

    if (!esUltimaPregunta) {
      setPreguntaIndex((prev) => prev + 1);
      setOpcionSeleccionada(null);
      setFeedback(null);
      setErrorEnvio(null);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    if (resultadoFinal) {
      navigate(`/guias/${slug}/resultados`, {
        state: {
          total: resultadoFinal.totalPreguntas,
          aciertos: resultadoFinal.respuestasCorrectas,
          porcentaje: resultadoFinal.porcentaje,
          aprobado: resultadoFinal.aprobado,
          porcentajeAprobacion: resultadoFinal.porcentajeAprobacion,
          modo,
        },
      });
    } else {
      navigate(`/guias/${slug}`);
    }
  };

  return (
    <main
      id="contenido"
      className="max-w-360 mx-auto px-4 md:px-12 lg:px-24 py-8 md:py-10 flex flex-col gap-8"
    >
      {/* Encabezado y migas de pan */}
      <section className="flex flex-col gap-4">
        <nav
          aria-label="Ubicación actual"
          className="text-[1rem] font-medium text-[#526575]"
        >
          <Link to="/" className="text-[#0d6258] hover:underline">
            Inicio
          </Link>{' '}
          <span aria-hidden="true">/</span>{' '}
          <Link to="/guias" className="text-[#0d6258] hover:underline">
            Guías
          </Link>{' '}
          <span aria-hidden="true">/</span>{' '}
          <Link
            to={`/guias/${slug}`}
            className="text-[#0d6258] hover:underline"
          >
            Guía
          </Link>{' '}
          <span aria-hidden="true">/</span>{' '}
          <span className="text-[#17324d] font-semibold" aria-current="page">
            Practicar
          </span>
        </nav>

        <div>
          <h1 className="text-[2rem] md:text-[2.333rem] font-bold leading-[1.2] text-[#17324d]">
            {actividad.titulo}
          </h1>
          <p className="text-[1.111rem] md:text-[1.222rem] text-[#526575] mt-2">
            Puedes equivocarte con total tranquilidad. Cada intento es una
            oportunidad para aprender sin riesgos.
          </p>
        </div>
      </section>

      {/* Región dinámica anunciada para lectores de pantalla */}
      <div className="sr-only" aria-live="polite">
        Pregunta {preguntaIndex + 1} de {totalPreguntas}:{' '}
        {preguntaActual.enunciado}
      </div>

      {/* Tarjeta principal de pregunta y opciones */}
      <section
        className="max-w-4xl mx-auto w-full flex flex-col gap-6"
        aria-label="Pregunta interactiva"
      >
        <div className="bg-white border border-[#d7e2e7] rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-sm">
          {/* Barra de avance en preguntas */}
          <div
            className="flex flex-col gap-2"
            role="progressbar"
            aria-valuenow={preguntaIndex + 1}
            aria-valuemin={1}
            aria-valuemax={totalPreguntas}
            aria-label={`Pregunta ${preguntaIndex + 1} de ${totalPreguntas}`}
          >
            <div className="flex justify-between items-center text-[1.111rem] font-semibold text-[#0d6258]">
              <span>
                Pregunta {preguntaIndex + 1} de {totalPreguntas}
              </span>
              <span className="text-[#526575] font-medium text-[0.95rem]">
                {porcentajeProgreso}%
              </span>
            </div>
            <div className="bg-[#dce7e7] h-2.5 rounded-full overflow-hidden w-full">
              <div
                className="bg-[#0d6258] h-full rounded-full transition-all duration-300"
                style={{ width: `${porcentajeProgreso}%` }}
              />
            </div>
          </div>

          <h2 className="text-[1.333rem] md:text-[1.5rem] font-bold text-[#17324d] leading-snug">
            {preguntaActual.enunciado}
          </h2>

          <p className="text-[1rem] font-medium text-[#526575]">
            Elige la respuesta que consideres más segura:
          </p>

          {/* Opciones de respuesta (2 a 4 opciones con UUID del backend) */}
          <fieldset
            className="flex flex-col gap-4 border-none p-0 m-0"
            disabled={revisado || enviando}
          >
            <legend className="sr-only">Opciones de respuesta</legend>

            {preguntaActual.opciones.map((opcion, indice) => {
              const estaSeleccionada = opcionSeleccionada === opcion.id;
              const esLaCorrecta =
                revisado && feedback.opcionCorrecta.id === opcion.id;

              let bordeColor = 'border-[#d7e2e7]';
              let bgColor = 'bg-white';
              let badgeColor = 'bg-[#e7f2ee] text-[#0d6258] border-[#c2ded3]';

              if (revisado) {
                if (esLaCorrecta) {
                  bordeColor = 'border-2 border-[#0d6258]';
                  bgColor = 'bg-[#e7f2ee]/50';
                  badgeColor = 'bg-[#0d6258] text-white border-[#0d6258]';
                } else if (estaSeleccionada && !esLaCorrecta) {
                  bordeColor = 'border-2 border-[#b91c1c]';
                  bgColor = 'bg-red-50/40';
                  badgeColor = 'bg-[#b91c1c] text-white border-[#b91c1c]';
                }
              } else if (estaSeleccionada) {
                bordeColor = 'border-2 border-[#0d6258]';
                bgColor = 'bg-[#f1f5f5]';
                badgeColor = 'bg-[#0d6258] text-white border-[#0d6258]';
              }

              return (
                <label
                  key={opcion.id}
                  className={`flex items-start gap-4 p-4 md:p-5 min-h-14 rounded-xl border ${bordeColor} ${bgColor} ${
                    revisado || enviando
                      ? 'cursor-default'
                      : 'cursor-pointer hover:bg-[#f8fafc]'
                  } transition-all focus-within:ring-4 focus-within:ring-[#0d6258]/40`}
                >
                  <input
                    type="radio"
                    name={`pregunta-${preguntaActual.id}`}
                    value={opcion.id}
                    checked={estaSeleccionada}
                    disabled={revisado || enviando}
                    onChange={() => setOpcionSeleccionada(opcion.id)}
                    className="sr-only"
                  />
                  <span
                    className={`flex items-center justify-center size-10 rounded-lg font-bold text-[1.111rem] border shrink-0 ${badgeColor}`}
                    aria-hidden="true"
                  >
                    {letraDeOpcion(indice)}
                  </span>
                  <span className="text-[1.111rem] md:text-[1.222rem] text-[#17324d] font-medium pt-1 leading-normal">
                    {opcion.texto}
                  </span>
                </label>
              );
            })}
          </fieldset>

          {/* Error explícito al enviar respuesta */}
          {errorEnvio && (
            <div
              className="p-5 rounded-2xl border-2 border-[#b91c1c] bg-red-50 flex flex-col gap-4 text-[#7f1d1d]"
              role="alert"
            >
              <p className="font-bold text-[1.111rem] m-0">
                <span aria-hidden="true">⚠ </span>
                {errorEnvio.mensaje}
              </p>
              <div className="flex flex-wrap gap-3">
                {errorEnvio.requiereSesion && (
                  <Link
                    to="/iniciar-sesion"
                    className="inline-flex items-center justify-center min-h-12 px-6 py-3 font-semibold text-white bg-[#0d6258] rounded-xl hover:bg-[#09473f] no-underline"
                  >
                    Iniciar sesión
                  </Link>
                )}
                {errorEnvio.requiereReiniciar && (
                  <button
                    type="button"
                    onClick={reiniciarPractica}
                    className="inline-flex items-center justify-center min-h-12 px-6 py-3 font-semibold text-white bg-[#0d6258] rounded-xl hover:bg-[#09473f] cursor-pointer"
                  >
                    Reiniciar práctica
                  </button>
                )}
                <Link
                  to={`/guias/${slug}`}
                  className="inline-flex items-center justify-center min-h-12 px-6 py-3 font-semibold text-[#17324d] bg-white border border-[#d7e2e7] rounded-xl hover:bg-[#f1f5f5] no-underline"
                >
                  Volver a la guía
                </Link>
              </div>
            </div>
          )}

          {/* Panel de retroalimentación posterior a responder */}
          {revisado && (
            <div
              className={`p-6 rounded-2xl border-2 flex flex-col gap-2 ${
                feedback.esCorrecta
                  ? 'bg-[#e7f2ee] border-[#0d6258] text-[#0d6258]'
                  : 'bg-[#fff3d8] border-[#fde6b3] text-[#17324d]'
              }`}
              role="alert"
            >
              <p className="font-bold text-[1.222rem] flex items-center gap-2 m-0">
                <span aria-hidden="true">
                  {feedback.esCorrecta ? '✓' : 'ℹ️'}
                </span>
                {feedback.esCorrecta
                  ? '¡Muy bien! Identificaste la respuesta segura.'
                  : 'Casi. Pero para eso estamos aprendiendo juntos.'}
              </p>
              {!feedback.esCorrecta && (
                <p className="text-[1.111rem] font-semibold text-[#17324d] m-0">
                  La respuesta correcta es: {feedback.opcionCorrecta.texto}
                </p>
              )}
              <p className="text-[1.111rem] text-[#172b3a] leading-relaxed m-0">
                {feedback.explicacion}
              </p>
            </div>
          )}

          {/* Botón de acción: Comprobar o Continuar */}
          <div className="pt-2">
            {!revisado ? (
              <button
                type="button"
                onClick={() => void comprobarRespuesta()}
                disabled={!opcionSeleccionada || enviando}
                className={`inline-flex items-center justify-center min-h-14 px-8 py-4 font-semibold text-[1.111rem] rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0d6258]/40 ${
                  opcionSeleccionada && !enviando
                    ? 'bg-[#0d6258] text-white hover:bg-[#09473f] cursor-pointer'
                    : 'bg-[#e3e9ed] text-[#526575] cursor-not-allowed'
                }`}
              >
                {enviando ? 'Comprobando respuesta...' : 'Comprobar respuesta'}
              </button>
            ) : (
              <button
                type="button"
                onClick={avanzarSiguientePregunta}
                className="inline-flex items-center justify-center min-h-14 px-8 py-4 font-semibold text-[1.111rem] text-white bg-[#0d6258] rounded-xl hover:bg-[#09473f] cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0d6258]/40"
              >
                {esUltimaPregunta
                  ? 'Ver mis resultados →'
                  : 'Siguiente pregunta →'}
              </button>
            )}
          </div>
        </div>

        <aside className="bg-[#e7f2ee] border border-[#c2ded3] rounded-2xl p-5 flex flex-col gap-2 text-[#17324d]">
          <p className="font-bold text-[1rem] m-0">Tu tranquilidad primero</p>
          <p className="text-[0.95rem] text-[#253b38] m-0">
            Esta es una práctica pedagógica segura. No necesitas ingresar ningún
            dato real ni contraseñas.
          </p>
          {modo === 'INVITADO' && (
            <p className="text-[0.95rem] text-[#253b38] m-0">
              Estás practicando sin cuenta: tu progreso es temporal y se
              reinicia si recargas la página. Si quieres guardar tu avance,{' '}
              <Link
                to="/registro"
                className="font-semibold text-[#0d6258] underline"
              >
                puedes crear una cuenta gratuita
              </Link>
              .
            </p>
          )}
        </aside>
      </section>

      {/* Cierre institucional */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-[#d7e2e7] text-[#526575]">
        <p className="text-[1rem]">
          Kamá · Aprende a tu ritmo. Estamos para acompañarte.
        </p>
        <Link
          to={rutaAyuda(slug)}
          className="inline-flex items-center gap-2 min-h-12 px-5 py-3 font-semibold text-[#0d6258] bg-white border border-[#0d6258] rounded-full hover:bg-[#e7f2ee] no-underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0d6258]/40"
        >
          <span className="font-bold text-[1.2rem]" aria-hidden="true">
            ?
          </span>
          Necesito ayuda
        </Link>
      </footer>
    </main>
  );
}
