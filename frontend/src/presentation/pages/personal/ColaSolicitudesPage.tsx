import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { SolicitudAyudaError } from '@/domain/ayuda/errors';
import {
  ETIQUETA_TEMA,
  LARGO_MAXIMO_COMENTARIO,
  TEMAS_AYUDA,
  type SolicitudEnCola,
  type TemaAyuda,
} from '@/domain/ayuda/types';
import type { SesionPersonal } from '@/domain/personal/types';
import { container } from '@/main/container';
import { LIMITE_POR_PAGINA, useColaSolicitudes } from './useColaSolicitudes';

type Pestana = 'PENDIENTE' | 'EN_ATENCION';

const formatearFecha = (fecha: Date) =>
  fecha.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });

function formatearEspera(desde: Date, ahora: number): string {
  const minutos = Math.max(0, Math.floor((ahora - desde.getTime()) / 60_000));
  if (minutos < 1) return 'Menos de 1 min';
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  return `${horas} h ${minutos % 60} min`;
}

function Mensaje({
  children,
  tipo,
}: {
  children: React.ReactNode;
  tipo: 'info' | 'error';
}) {
  return (
    <p
      role={tipo === 'error' ? 'alert' : 'status'}
      className={`m-0 p-4 rounded-xl border-2 font-medium ${
        tipo === 'error'
          ? 'bg-[#fdecea] border-[#c62828] text-[#7f1d1d]'
          : 'bg-tint border-border text-navy'
      }`}
    >
      {children}
    </p>
  );
}

function PaginaProtegida({ children }: { children: React.ReactNode }) {
  return (
    <main
      id="contenido"
      className="max-w-160 mx-auto px-4 md:px-8 py-16 flex flex-col items-center gap-6 text-center"
    >
      {children}
    </main>
  );
}

const estiloBotonPrimario =
  'inline-flex items-center justify-center min-h-14 px-6 font-semibold text-btn-primary-fg bg-btn-primary-bg rounded-xl hover:bg-btn-primary-hover disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer no-underline';
const estiloBotonSecundario =
  'inline-flex items-center justify-center min-h-14 px-6 font-semibold text-btn-secondary-fg bg-btn-secondary-bg border-2 border-btn-secondary-border rounded-xl hover:bg-btn-secondary-hover-bg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer no-underline';

export function ColaSolicitudesPage() {
  // undefined: leyendo la sesión; null: sin sesión
  const [sesion, setSesion] = useState<SesionPersonal | null | undefined>(
    undefined,
  );
  const [pestana, setPestana] = useState<Pestana>('PENDIENTE');
  const [tema, setTema] = useState<TemaAyuda | null>(null);
  const [pagina, setPagina] = useState(1);
  const [recarga, setRecarga] = useState(0);
  const [aviso, setAviso] = useState<{
    texto: string;
    tipo: 'info' | 'error';
  } | null>(null);
  const [tomando, setTomando] = useState<string | null>(null);
  const enCurso = useRef(false);
  const [resolviendo, setResolviendo] = useState<SolicitudEnCola | null>(null);

  useEffect(() => {
    let activo = true;
    void container.personal.obtenerSesion.ejecutar().then((s) => {
      if (activo) setSesion(s);
    });
    return () => {
      activo = false;
    };
  }, []);

  const autorizado =
    sesion != null &&
    (sesion.usuario.rol === 'PERSONAL' ||
      sesion.usuario.rol === 'ADMINISTRADOR') &&
    !sesion.usuario.debeCambiarPassword;

  const cola = useColaSolicitudes({
    token: autorizado ? sesion.accessToken : null,
    estado: pestana,
    tema,
    pagina,
    recarga,
  });

  const recargar = () => setRecarga((n) => n + 1);

  const manejarErrorAccion = (err: unknown, accion: string) => {
    if (!(err instanceof SolicitudAyudaError)) {
      setAviso({ texto: `No pudimos ${accion}.`, tipo: 'error' });
      return;
    }
    if (err.resultadoIncierto) {
      setAviso({
        texto: `No pudimos confirmar si se pudo ${accion}. Revisamos el estado actual de la cola; no se repitió la acción.`,
        tipo: 'error',
      });
    } else if (err.tipo === 'CONFLICTO') {
      setAviso({
        texto: `Esta solicitud ya no está disponible: ${err.message}`,
        tipo: 'error',
      });
    } else if (err.tipo === 'PERMISO') {
      setAviso({
        texto: `No puedes hacerlo: ${err.message}`,
        tipo: 'error',
      });
    } else {
      setAviso({ texto: err.message, tipo: 'error' });
    }
  };

  const tomar = async (s: SolicitudEnCola) => {
    if (!autorizado || enCurso.current) return;
    enCurso.current = true;
    setTomando(s.id);
    setAviso(null);
    try {
      const r = await container.ayuda.tomarSolicitud.ejecutar(
        sesion.accessToken,
        s.id,
      );
      setAviso({
        texto: `La solicitud del equipo ${r.equipo} ahora la atiende ${r.atendidaPor ?? 'tu cuenta'}.`,
        tipo: 'info',
      });
    } catch (err) {
      manejarErrorAccion(err, 'tomar la solicitud');
    } finally {
      enCurso.current = false;
      setTomando(null);
      recargar();
    }
  };

  const cambiarPestana = (nueva: Pestana) => {
    if (nueva === pestana) return;
    setPestana(nueva);
    setPagina(1);
    setAviso(null);
  };

  const cambiarTema = (valor: string) => {
    setTema(valor ? (valor as TemaAyuda) : null);
    setPagina(1);
  };

  if (sesion === undefined) {
    return (
      <PaginaProtegida>
        <p role="status" className="text-[1.111rem] text-muted">
          Verificando tu sesión…
        </p>
      </PaginaProtegida>
    );
  }

  if (sesion === null || cola.sesionExpirada) {
    return (
      <PaginaProtegida>
        <h1 className="text-[2rem] font-bold text-navy">
          {cola.sesionExpirada ? 'Tu sesión terminó' : 'Necesitas ingresar'}
        </h1>
        <p className="text-[1.111rem] text-muted max-w-120">
          La cola de solicitudes es solo para el personal del CLENA.
        </p>
        <Link to="/personal/acceso" className={estiloBotonPrimario}>
          Ir al acceso del personal
        </Link>
      </PaginaProtegida>
    );
  }

  if (sesion.usuario.debeCambiarPassword) {
    return (
      <PaginaProtegida>
        <h1 className="text-[2rem] font-bold text-navy">
          Primero cambia tu contraseña
        </h1>
        <Link to="/personal/primer-acceso" className={estiloBotonPrimario}>
          Cambiar contraseña
        </Link>
      </PaginaProtegida>
    );
  }

  if (!autorizado) {
    return (
      <PaginaProtegida>
        <h1 className="text-[2rem] font-bold text-navy">
          Acceso no autorizado (403)
        </h1>
        <p className="text-[1.111rem] text-muted max-w-120">
          Esta sección es solo para monitores y administradores.
        </p>
      </PaginaProtegida>
    );
  }

  const datos = cola.datos;
  const totalPaginas = datos
    ? Math.max(1, Math.ceil(datos.total / (datos.limite || LIMITE_POR_PAGINA)))
    : 1;
  const totalPendientes =
    pestana === 'PENDIENTE' ? datos?.total : cola.totalOtraPestana;
  const totalEnAtencion =
    pestana === 'EN_ATENCION' ? datos?.total : cola.totalOtraPestana;

  return (
    <main
      id="contenido"
      className="max-w-360 mx-auto px-4 md:px-12 lg:px-24 py-8 md:py-12 flex flex-col gap-6"
    >
      <header className="flex flex-col gap-2">
        <h1 className="text-[2rem] md:text-[2.333rem] font-bold text-navy m-0">
          Solicitudes de ayuda
        </h1>
        <p className="text-[1.111rem] text-muted m-0">
          Toma una solicitud pendiente para atenderla. La lista se actualiza
          sola cada 15 segundos.
        </p>
      </header>

      <div
        role="group"
        aria-label="Estado de las solicitudes"
        className="flex flex-wrap gap-3"
      >
        {(
          [
            ['PENDIENTE', 'Pendientes', totalPendientes],
            ['EN_ATENCION', 'En atención', totalEnAtencion],
          ] as const
        ).map(([valor, etiqueta, total]) => (
          <button
            key={valor}
            type="button"
            aria-pressed={pestana === valor}
            onClick={() => cambiarPestana(valor)}
            className={`min-h-14 px-5 rounded-xl font-semibold border-2 cursor-pointer ${
              pestana === valor
                ? 'bg-btn-primary-bg text-btn-primary-fg border-btn-primary-bg'
                : 'bg-surface text-navy border-border hover:bg-tint'
            }`}
          >
            {etiqueta}
            {total != null ? ` (${total})` : ''}
          </button>
        ))}

        <label className="ml-auto flex items-center gap-3 font-medium text-navy">
          Tema
          <select
            value={tema ?? ''}
            onChange={(e) => cambiarTema(e.target.value)}
            className="min-h-14 px-3 rounded-xl border-2 border-border bg-surface text-ink"
          >
            <option value="">Todos los temas</option>
            {TEMAS_AYUDA.map((t) => (
              <option key={t} value={t}>
                {ETIQUETA_TEMA[t]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {aviso && <Mensaje tipo={aviso.tipo}>{aviso.texto}</Mensaje>}

      {cola.error && datos && (
        <Mensaje tipo="error">
          No pudimos actualizar la lista ({cola.error}). Mostramos la última
          información recibida; se volverá a intentar sola.
        </Mensaje>
      )}

      {cola.cargando ? (
        <p role="status" className="text-[1.111rem] text-muted">
          Cargando solicitudes…
        </p>
      ) : !datos ? (
        <div className="flex flex-col items-start gap-4">
          <Mensaje tipo="error">
            {cola.error ?? 'No pudimos cargar las solicitudes.'}
          </Mensaje>
          <button
            type="button"
            onClick={recargar}
            className={estiloBotonPrimario}
          >
            Reintentar
          </button>
        </div>
      ) : datos.datos.length === 0 ? (
        <p
          role="status"
          className="p-8 bg-surface border-2 border-border rounded-2xl text-[1.222rem] font-semibold text-navy"
        >
          {pestana === 'PENDIENTE'
            ? 'No hay solicitudes pendientes'
            : 'No hay solicitudes en atención'}
        </p>
      ) : (
        <ul className="list-none p-0 m-0 flex flex-col gap-4">
          {datos.datos.map((s) => (
            <li
              key={s.id}
              className="bg-surface border-2 border-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4"
            >
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2 flex-1 m-0">
                <div>
                  <dt className="text-muted text-[0.95rem]">Equipo</dt>
                  <dd className="m-0 font-bold text-navy">{s.equipo}</dd>
                </div>
                <div>
                  <dt className="text-muted text-[0.95rem]">Tema</dt>
                  <dd className="m-0">{ETIQUETA_TEMA[s.tema]}</dd>
                </div>
                <div>
                  <dt className="text-muted text-[0.95rem]">Estado</dt>
                  <dd className="m-0">
                    {s.estado === 'PENDIENTE' ? 'Pendiente' : 'En atención'}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted text-[0.95rem]">Guía</dt>
                  <dd className="m-0">
                    {s.guia?.titulo ?? 'Sin guía asociada'}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted text-[0.95rem]">Paso</dt>
                  <dd className="m-0">
                    {s.paso != null ? `Paso ${s.paso}` : 'No especificado'}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted text-[0.95rem]">Solicitada</dt>
                  <dd className="m-0">
                    <time dateTime={s.creadaEn.toISOString()}>
                      {formatearFecha(s.creadaEn)}
                    </time>
                    {s.estado === 'PENDIENTE' &&
                      ` · espera ${formatearEspera(s.creadaEn, cola.actualizadoEn)}`}
                  </dd>
                </div>
                {s.estado === 'EN_ATENCION' && (
                  <>
                    <div>
                      <dt className="text-muted text-[0.95rem]">Atiende</dt>
                      <dd className="m-0 font-semibold">
                        {s.atendidaPor ?? 'No indicado'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted text-[0.95rem]">Tomada</dt>
                      <dd className="m-0">
                        {s.tomadaEn
                          ? formatearFecha(s.tomadaEn)
                          : 'No indicado'}
                      </dd>
                    </div>
                  </>
                )}
              </dl>
              {s.estado === 'PENDIENTE' ? (
                <button
                  type="button"
                  disabled={tomando !== null}
                  onClick={() => void tomar(s)}
                  className={estiloBotonPrimario}
                >
                  {tomando === s.id ? 'Tomando solicitud…' : 'Tomar solicitud'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setResolviendo(s)}
                  className={estiloBotonSecundario}
                >
                  Marcar como resuelta
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {datos && datos.total > 0 && (
        <nav
          aria-label="Paginación de solicitudes"
          className="flex flex-wrap items-center gap-4"
        >
          <button
            type="button"
            disabled={pagina <= 1}
            onClick={() => setPagina((p) => p - 1)}
            className={estiloBotonSecundario}
          >
            Anterior
          </button>
          <span aria-live="polite">
            Página {datos.pagina} de {totalPaginas} · {datos.total}{' '}
            {datos.total === 1 ? 'resultado' : 'resultados'}
          </span>
          <button
            type="button"
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
            className={estiloBotonSecundario}
          >
            Siguiente
          </button>
        </nav>
      )}

      {resolviendo && (
        <ResolverDialogo
          solicitud={resolviendo}
          token={sesion.accessToken}
          onCerrar={() => setResolviendo(null)}
          onTerminar={(texto, tipo) => {
            setResolviendo(null);
            setAviso({ texto, tipo });
            recargar();
          }}
          onRefrescar={recargar}
        />
      )}
    </main>
  );
}

interface ResolverDialogoProps {
  solicitud: SolicitudEnCola;
  token: string;
  onCerrar: () => void;
  onTerminar: (texto: string, tipo: 'info' | 'error') => void;
  onRefrescar: () => void;
}

function ResolverDialogo({
  solicitud,
  token,
  onCerrar,
  onTerminar,
  onRefrescar,
}: ResolverDialogoProps) {
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enCurso = useRef(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enCurso.current) return;
    if (comentario.length > LARGO_MAXIMO_COMENTARIO) {
      setError(
        `El comentario puede tener máximo ${LARGO_MAXIMO_COMENTARIO} letras.`,
      );
      return;
    }
    enCurso.current = true;
    setEnviando(true);
    setError(null);
    try {
      await container.ayuda.resolverSolicitud.ejecutar(
        token,
        solicitud.id,
        comentario,
      );
      onTerminar(
        `La solicitud del equipo ${solicitud.equipo} quedó resuelta.`,
        'info',
      );
    } catch (err) {
      if (err instanceof SolicitudAyudaError) {
        if (err.resultadoIncierto) {
          setError(
            'No pudimos confirmar si se resolvió. Revisamos el estado actual; no se repitió el envío.',
          );
          onRefrescar();
        } else if (err.tipo === 'PERMISO' || err.tipo === 'CONFLICTO') {
          onTerminar(
            err.tipo === 'PERMISO'
              ? `Otro monitor es responsable de esta solicitud. ${err.message}`
              : `Esta solicitud ya no está disponible: ${err.message}`,
            'error',
          );
        } else {
          setError(err.message);
        }
      } else {
        setError('No pudimos resolver la solicitud.');
      }
      setEnviando(false);
    } finally {
      enCurso.current = false;
    }
  };

  return (
    <dialog
      open
      aria-labelledby="titulo-resolver"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !enviando) onCerrar();
      }}
      className="fixed inset-0 m-auto max-w-xl w-[calc(100%-2rem)] p-0 rounded-2xl bg-surface border-2 border-border shadow-2xl z-50 text-ink"
    >
      <form
        onSubmit={(e) => void enviar(e)}
        className="p-6 md:p-8 flex flex-col gap-5"
      >
        <h2
          id="titulo-resolver"
          className="text-[1.5rem] font-bold text-navy m-0"
        >
          Resolver solicitud
        </h2>
        <p className="m-0">
          Equipo <strong>{solicitud.equipo}</strong> ·{' '}
          {ETIQUETA_TEMA[solicitud.tema]}
          {solicitud.guia ? ` · ${solicitud.guia.titulo}` : ''}
        </p>
        <label className="flex flex-col gap-2 font-medium text-navy">
          Comentario (opcional)
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            maxLength={LARGO_MAXIMO_COMENTARIO}
            rows={4}
            disabled={enviando}
            className="p-3 rounded-xl border-2 border-border bg-surface text-ink font-normal"
          />
          <span className="text-muted font-normal text-[0.95rem]">
            {comentario.length} / {LARGO_MAXIMO_COMENTARIO}
          </span>
        </label>
        {error && <Mensaje tipo="error">{error}</Mensaje>}
        <div className="flex flex-wrap gap-3 justify-end">
          <button
            type="button"
            onClick={onCerrar}
            disabled={enviando}
            className={estiloBotonSecundario}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className={estiloBotonPrimario}
          >
            {enviando ? 'Resolviendo…' : 'Marcar como resuelta'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
