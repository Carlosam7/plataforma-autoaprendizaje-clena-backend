import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { AuthSessionExpiredError } from '@/domain/auth/errors';
import type { EliminacionSolicitada } from '@/domain/auth/types';
import { container } from '@/main/container';
import {
  avisarCambioSesion,
  useSesionPublica,
} from '@/presentation/auth/useSesionPublica';

type Fase = 'INICIO' | 'CODIGO' | 'ELIMINADA';

const tarjeta =
  'bg-surface border-2 border-border-subtle rounded-2xl p-6 md:p-8 flex flex-col gap-5 shadow-sm';
const botonPrimario =
  'inline-flex items-center justify-center min-h-14 px-6 py-4 font-bold text-[1.111rem] text-btn-primary-fg bg-btn-primary-bg rounded-xl hover:bg-btn-primary-hover transition-colors cursor-pointer border-2 border-btn-primary-border disabled:opacity-50 disabled:cursor-not-allowed';
const botonSecundario =
  'inline-flex items-center justify-center min-h-14 px-6 py-4 font-semibold text-[1.111rem] text-btn-secondary-fg bg-btn-secondary-bg border-2 border-btn-secondary-border rounded-xl hover:border-btn-secondary-hover-border hover:bg-btn-secondary-hover-bg cursor-pointer no-underline disabled:opacity-50';

/**
 * HU-02 y HU-05 (C-08): la cuenta del usuario público. Cerrar sesión y eliminar la cuenta
 * (derecho de supresión, Ley 1581). Eliminar exige entender las consecuencias y escribir un
 * código: nunca se borra con un solo clic.
 */
export function MiCuentaPage() {
  const navigate = useNavigate();
  const sesion = useSesionPublica();

  const [fase, setFase] = useState<Fase>('INICIO');
  const [entiende, setEntiende] = useState(false);
  const [solicitud, setSolicitud] = useState<EliminacionSolicitada | null>(
    null,
  );
  const [codigo, setCodigo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sesionVencida, setSesionVencida] = useState(false);

  // Al cambiar de paso, el foco va al título del paso nuevo (lector de pantalla y teclado).
  const tituloFase = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (fase !== 'INICIO') tituloFase.current?.focus();
  }, [fase]);

  const mostrarError = (err: unknown, porDefecto: string) => {
    if (err instanceof AuthSessionExpiredError) setSesionVencida(true);
    setError(err instanceof Error ? err.message : porDefecto);
  };

  const cerrarSesion = async () => {
    setCargando(true);
    await container.auth.cerrarSesion.ejecutar();
    avisarCambioSesion();
    navigate('/');
  };

  const pedirCodigo = async () => {
    setError(null);
    setCargando(true);
    try {
      const enviado =
        await container.auth.solicitarEliminacionCuenta.ejecutar();
      setSolicitud(enviado);
      setCodigo('');
      setFase('CODIGO');
    } catch (err) {
      mostrarError(err, 'No se pudo enviar el código. Inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  const confirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solicitud) return;
    setError(null);
    setCargando(true);
    try {
      await container.auth.confirmarEliminacionCuenta.ejecutar({
        solicitudId: solicitud.solicitudId,
        codigo,
      });
      setFase('ELIMINADA');
      avisarCambioSesion();
    } catch (err) {
      mostrarError(err, 'No se pudo eliminar la cuenta. Inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  const contenedor = (hijos: React.ReactNode) => (
    <main
      id="contenido"
      className="max-w-160 mx-auto px-4 md:px-8 py-12 md:py-16 flex flex-col gap-8"
    >
      {hijos}
    </main>
  );

  if (fase === 'ELIMINADA') {
    return contenedor(
      <section className={tarjeta} aria-labelledby="titulo-eliminada">
        <h1
          id="titulo-eliminada"
          ref={tituloFase}
          tabIndex={-1}
          className="text-[2rem] font-bold text-navy leading-tight"
        >
          Tu cuenta fue eliminada
        </h1>
        <p className="text-[1.111rem] text-ink" role="status">
          Borramos tus datos personales y tu progreso, y cerramos tu sesión en
          este equipo. Puedes seguir usando las guías sin cuenta cuando quieras.
        </p>
        <Link to="/" className={botonPrimario}>
          Ir al inicio
        </Link>
      </section>,
    );
  }

  if (sesion === undefined) {
    return contenedor(
      <p className="text-[1.111rem] text-muted" role="status">
        Cargando tu cuenta…
      </p>,
    );
  }

  if (sesion === null || sesionVencida) {
    return contenedor(
      <section className={tarjeta} aria-labelledby="titulo-sin-sesion">
        <h1
          id="titulo-sin-sesion"
          className="text-[2rem] font-bold text-navy leading-tight"
        >
          Mi cuenta
        </h1>
        <p className="text-[1.111rem] text-ink" role="status">
          {sesionVencida
            ? 'Tu sesión terminó. Vuelve a iniciar sesión para continuar.'
            : 'Para ver tu cuenta primero inicia sesión.'}
        </p>
        <Link to="/iniciar-sesion" className={botonPrimario}>
          Iniciar sesión
        </Link>
      </section>,
    );
  }

  return contenedor(
    <>
      <div className="flex flex-col gap-3">
        <h1 className="text-[2rem] md:text-[2.444rem] font-bold text-navy leading-tight">
          Mi cuenta
        </h1>
        <p className="text-[1.111rem] text-muted">
          Hola, {sesion.usuario.nombre}.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="p-5 bg-notice border-2 border-border-input rounded-xl text-ink"
        >
          <p className="font-bold text-[1.111rem] m-0">Atención</p>
          <p className="text-[1rem] mt-1 mb-0">{error}</p>
        </div>
      )}

      <section className={tarjeta} aria-labelledby="titulo-sesion">
        <h2
          id="titulo-sesion"
          className="text-[1.5rem] font-bold text-navy m-0"
        >
          Cerrar sesión
        </h2>
        <p className="text-[1.111rem] text-ink m-0">
          Si estás en un computador de la sala, cierra la sesión al terminar
          para que nadie más entre a tu cuenta.
        </p>
        <button
          type="button"
          onClick={() => void cerrarSesion()}
          disabled={cargando}
          className={botonSecundario}
        >
          Cerrar sesión
        </button>
      </section>

      <section className={tarjeta} aria-labelledby="titulo-eliminar">
        <h2
          id="titulo-eliminar"
          ref={fase === 'CODIGO' ? tituloFase : undefined}
          tabIndex={-1}
          className="text-[1.5rem] font-bold text-navy m-0"
        >
          Eliminar mi cuenta
        </h2>

        {fase === 'INICIO' && (
          <>
            <div id="consecuencias" className="flex flex-col gap-2 text-ink">
              <p className="text-[1.111rem] m-0">Si eliminas tu cuenta:</p>
              <ul className="list-disc pl-6 text-[1.111rem] flex flex-col gap-1 m-0">
                <li>
                  Borramos tu nombre, tu documento, tu fecha de nacimiento y tu
                  correo o celular.
                </li>
                <li>Pierdes tu progreso y tus prácticas guardadas.</li>
                <li>
                  Solo guardamos cifras sin tu nombre, como cuántas veces se
                  abrió una guía.
                </li>
                <li>
                  <strong>No se puede deshacer.</strong>
                </li>
              </ul>
            </div>
            <label className="flex items-start gap-3 min-h-11 cursor-pointer text-[1.111rem] text-ink">
              <input
                type="checkbox"
                checked={entiende}
                onChange={(e) => setEntiende(e.target.checked)}
                aria-describedby="consecuencias"
                className="mt-1 size-6 shrink-0 accent-primary cursor-pointer"
              />
              Entiendo que mi cuenta y mis datos se borrarán para siempre.
            </label>
            <button
              type="button"
              onClick={() => void pedirCodigo()}
              disabled={!entiende || cargando}
              className={botonPrimario}
            >
              {cargando
                ? 'Enviando código…'
                : 'Enviarme un código para eliminarla'}
            </button>
          </>
        )}

        {fase === 'CODIGO' && solicitud && (
          <form
            onSubmit={(e) => void confirmar(e)}
            noValidate
            className="flex flex-col gap-5"
          >
            <p className="text-[1.111rem] text-ink m-0" role="status">
              {solicitud.mensaje}
            </p>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="codigo-eliminacion"
                className="text-[1.111rem] font-bold text-navy"
              >
                Código de 6 números
              </label>
              <input
                id="codigo-eliminacion"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                aria-required="true"
                aria-invalid={Boolean(error)}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                className="min-h-14 px-4 text-[1.333rem] tracking-[0.3em] bg-white border-2 border-border-input rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 text-ink"
              />
            </div>
            <button
              type="submit"
              disabled={codigo.length !== 6 || cargando}
              className={botonPrimario}
            >
              {cargando ? 'Eliminando…' : 'Eliminar mi cuenta para siempre'}
            </button>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void pedirCodigo()}
                disabled={cargando}
                className={botonSecundario}
              >
                Enviar otro código
              </button>
              <button
                type="button"
                onClick={() => {
                  setFase('INICIO');
                  setEntiende(false);
                  setSolicitud(null);
                  setError(null);
                }}
                disabled={cargando}
                className={botonSecundario}
              >
                No eliminar
              </button>
            </div>
          </form>
        )}
      </section>
    </>,
  );
}
