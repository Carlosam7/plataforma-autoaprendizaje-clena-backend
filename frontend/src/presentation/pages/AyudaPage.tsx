import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  AyudaError,
  ConexionAyudaError,
  DatosAyudaInvalidosError,
  EquipoConSolicitudActivaError,
  SolicitudCambioEstadoError,
  SolicitudNoEncontradaError,
} from '@/domain/ayuda/errors';
import {
  MAX_LARGO_EQUIPO,
  solicitudActiva,
  TEMAS_AYUDA,
  type SolicitudAyuda,
  type TemaAyuda,
} from '@/domain/ayuda/types';
import { container } from '@/main/container';
import { EstadoSolicitudAyuda } from '@/presentation/ayuda/EstadoSolicitudAyuda';
import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from '@/presentation/ayuda/estilos';
import { contextoDeAyuda } from '@/presentation/ayuda/rutaAyuda';
import { ETIQUETAS_TEMA } from '@/presentation/ayuda/temas';

interface ErrorFormulario {
  mensaje: string;
  campo?: 'equipo' | 'tema';
}

function mensajeDe(error: unknown): string {
  return error instanceof AyudaError
    ? error.message
    : 'No pudimos enviar tu pedido de ayuda. Intenta de nuevo.';
}

/**
 * HU-28/29 · Llamar a un monitor (C-05). Sin preguntas frecuentes ni glosario publicados,
 * la única opción es «Llamar a un monitor». La solicitud vive solo en memoria: si se recarga,
 * enviar otra vez el mismo equipo recupera la misma solicitud (200 `yaExistia`).
 */
export function AyudaPage() {
  const [params] = useSearchParams();
  const { guiaSlug, pasoOrden } = contextoDeAyuda(params);

  const [equipo, setEquipo] = useState('');
  const [tema, setTema] = useState<TemaAyuda | ''>('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<ErrorFormulario | null>(null);

  const [solicitud, setSolicitud] = useState<SolicitudAyuda | null>(null);
  const [yaExistia, setYaExistia] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [perdida, setPerdida] = useState<string | null>(null);
  const [confirmandoCancelacion, setConfirmandoCancelacion] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  const equipoRef = useRef<HTMLInputElement>(null);
  const temaRef = useRef<HTMLInputElement>(null);
  const tituloEstadoRef = useRef<HTMLHeadingElement>(null);
  const tituloPerdidaRef = useRef<HTMLHeadingElement>(null);

  // Seguimiento cada 15 s mientras la solicitud está activa; se detiene al cerrarse o al salir.
  const idEnSeguimiento =
    solicitud && solicitudActiva(solicitud.estado) ? solicitud.id : null;
  useEffect(() => {
    if (!idEnSeguimiento) return;
    return container.ayuda.seguimiento.iniciar(idEnSeguimiento, (evento) => {
      if (evento.tipo === 'actualizada') {
        setSolicitud(evento.solicitud);
        setAviso(null);
      } else if (evento.tipo === 'error-temporal') {
        setAviso(
          'No pudimos actualizar el estado. Lo intentaremos otra vez en unos segundos.',
        );
      } else {
        setSolicitud(null);
        setPerdida(evento.error.message);
      }
    });
  }, [idEnSeguimiento]);

  // Al pasar del formulario al estado, el foco va al título para que se anuncie.
  const idMostrado = solicitud?.id ?? null;
  useEffect(() => {
    if (idMostrado) tituloEstadoRef.current?.focus();
  }, [idMostrado]);
  useEffect(() => {
    if (perdida) tituloPerdidaRef.current?.focus();
  }, [perdida]);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const creada = await container.ayuda.solicitar.ejecutar({
        equipo,
        tema,
        guiaSlug,
        pasoOrden,
      });
      setYaExistia(creada.yaExistia);
      setAviso(null);
      setPerdida(null);
      setConfirmandoCancelacion(false);
      setSolicitud(creada);
    } catch (e) {
      const campo =
        e instanceof DatosAyudaInvalidosError
          ? e.campo
          : e instanceof EquipoConSolicitudActivaError
            ? 'equipo'
            : undefined;
      setError({ mensaje: mensajeDe(e), campo });
      if (campo === 'tema') temaRef.current?.focus();
      else equipoRef.current?.focus();
    } finally {
      setEnviando(false);
    }
  }

  async function cancelar() {
    if (!solicitud || cancelando) return;
    setCancelando(true);
    try {
      await container.ayuda.cancelar.ejecutar(solicitud.id);
      setSolicitud({ ...solicitud, estado: 'CANCELADA', posicion: null });
      setAviso(null);
    } catch (e) {
      if (e instanceof SolicitudNoEncontradaError) {
        setSolicitud(null);
        setPerdida(e.message);
      } else if (
        e instanceof SolicitudCambioEstadoError ||
        (e instanceof ConexionAyudaError && e.ambigua)
      ) {
        // El estado cambió (un monitor la tomó) o no sabemos si se canceló: se vuelve a leer.
        setAviso(
          e instanceof SolicitudCambioEstadoError
            ? `${e.message} Este es su estado actual.`
            : e.message,
        );
        await recargar(solicitud.id);
      } else {
        setAviso(mensajeDe(e));
      }
    } finally {
      setCancelando(false);
      setConfirmandoCancelacion(false);
    }
  }

  async function recargar(id: string) {
    try {
      setSolicitud(await container.ayuda.consultar.ejecutar(id));
    } catch (e) {
      if (e instanceof SolicitudNoEncontradaError) {
        setSolicitud(null);
        setPerdida(e.message);
      }
      // Otros errores: el seguimiento lo reintentará en el siguiente ciclo.
    }
  }

  function pedirOtraVez() {
    setSolicitud(null);
    setPerdida(null);
    setAviso(null);
    setYaExistia(false);
    setError(null);
  }

  const errorEquipo = error?.campo === 'equipo' ? error.mensaje : null;
  const errorTema = error?.campo === 'tema' ? error.mensaje : null;
  const errorGeneral = error && !error.campo ? error.mensaje : null;

  return (
    <main
      id="contenido"
      className="max-w-360 w-full mx-auto px-gutter py-12 md:py-16 flex flex-col gap-6"
    >
      <p className="text-[1.111rem] font-semibold text-eyebrow">
        ACOMPAÑAMIENTO CLENA
      </p>
      <h1 className="text-[2rem] md:text-[2.444rem] font-bold leading-[1.13] text-hero-title">
        Solicitar ayuda
      </h1>
      <p className="text-[1.111rem] text-hero-text max-w-176">
        No tienes que aprender a solas. Si algún paso o término no queda claro,
        un monitor de la Sala de Internet del CLENA puede acercarse y
        acompañarte.
      </p>

      {solicitud ? (
        <EstadoSolicitudAyuda
          solicitud={solicitud}
          yaExistia={yaExistia}
          aviso={aviso}
          confirmandoCancelacion={confirmandoCancelacion}
          cancelando={cancelando}
          onPedirCancelacion={() => setConfirmandoCancelacion(true)}
          onConfirmarCancelacion={cancelar}
          onSeguirEsperando={() => setConfirmandoCancelacion(false)}
          onPedirOtraVez={pedirOtraVez}
          tituloRef={tituloEstadoRef}
        />
      ) : perdida ? (
        <section
          aria-labelledby="titulo-perdida"
          className="p-6 md:p-8 bg-card-bg border-2 border-card-border rounded-2xl max-w-176 flex flex-col gap-4"
        >
          <h2
            id="titulo-perdida"
            ref={tituloPerdidaRef}
            tabIndex={-1}
            className="text-[1.556rem] font-bold text-card-title"
          >
            No encontramos tu solicitud
          </h2>
          <p role="alert" className="text-card-text">
            {perdida}
          </p>
          <div>
            <button
              type="button"
              className={BOTON_PRIMARIO}
              onClick={pedirOtraVez}
            >
              Pedir ayuda otra vez
            </button>
          </div>
        </section>
      ) : (
        <form
          noValidate
          onSubmit={enviar}
          aria-labelledby="titulo-llamar-monitor"
          className="p-6 md:p-8 bg-card-bg border-2 border-card-border rounded-2xl max-w-176 flex flex-col gap-6"
        >
          <h2
            id="titulo-llamar-monitor"
            className="text-[1.333rem] font-bold text-card-title"
          >
            Llamar a un monitor
          </h2>

          {guiaSlug && (
            <p className="p-4 bg-notice text-ink rounded-xl">
              {pasoOrden
                ? 'Le contaremos al monitor en qué guía y en qué paso estabas.'
                : 'Le contaremos al monitor en qué guía estabas.'}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <label
              htmlFor="equipo"
              className="font-semibold text-card-title text-[1.111rem]"
            >
              ¿En qué equipo estás?
            </label>
            <p id="ayuda-equipo" className="text-muted">
              Escribe el número pegado en el computador, por ejemplo «12».
            </p>
            <input
              ref={equipoRef}
              id="equipo"
              name="equipo"
              type="text"
              autoComplete="off"
              required
              aria-required="true"
              maxLength={MAX_LARGO_EQUIPO}
              aria-invalid={Boolean(errorEquipo)}
              aria-describedby={
                errorEquipo ? 'ayuda-equipo error-equipo' : 'ayuda-equipo'
              }
              value={equipo}
              onChange={(e) => {
                setEquipo(e.target.value);
                if (error) setError(null);
              }}
              className="w-full min-h-14 p-4 bg-surface text-ink text-[1.111rem] border-2 border-border-input rounded-xl"
            />
            {errorEquipo && (
              <p
                id="error-equipo"
                role="alert"
                className="p-4 bg-notice text-ink rounded-xl font-semibold"
              >
                {errorEquipo}
              </p>
            )}
          </div>

          <fieldset
            className="flex flex-col gap-3"
            aria-describedby={errorTema ? 'error-tema' : undefined}
          >
            <legend className="font-semibold text-card-title text-[1.111rem] mb-2">
              ¿Sobre qué necesitas ayuda?
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {TEMAS_AYUDA.map((valor, indice) => (
                <label
                  key={valor}
                  className="flex items-center gap-3 min-h-14 px-4 py-3 border-2 border-border-input rounded-xl text-ink cursor-pointer has-checked:border-primary has-checked:font-semibold"
                >
                  <input
                    ref={indice === 0 ? temaRef : undefined}
                    type="radio"
                    name="tema"
                    value={valor}
                    checked={tema === valor}
                    aria-invalid={Boolean(errorTema)}
                    onChange={() => {
                      setTema(valor);
                      if (error) setError(null);
                    }}
                    className="size-6 shrink-0 accent-primary"
                  />
                  {ETIQUETAS_TEMA[valor]}
                </label>
              ))}
            </div>
            {errorTema && (
              <p
                id="error-tema"
                role="alert"
                className="p-4 bg-notice text-ink rounded-xl font-semibold"
              >
                {errorTema}
              </p>
            )}
          </fieldset>

          {errorGeneral && (
            <p role="alert" className="p-4 bg-notice text-ink rounded-xl">
              {errorGeneral}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className={BOTON_PRIMARIO}
              disabled={enviando}
              aria-busy={enviando}
            >
              {enviando ? 'Llamando…' : 'Llamar a un monitor'}
            </button>
          </div>
        </form>
      )}

      <div>
        <Link
          to={guiaSlug ? `/guias/${guiaSlug}` : '/'}
          className={BOTON_SECUNDARIO}
        >
          {guiaSlug ? 'Volver a la guía' : 'Regresar al inicio'}
        </Link>
      </div>
    </main>
  );
}
