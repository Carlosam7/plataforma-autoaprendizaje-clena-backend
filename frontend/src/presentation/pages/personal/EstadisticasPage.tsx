import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { EstadisticaError } from '@/domain/estadistica/errors';
import { validarPeriodo } from '@/domain/estadistica/periodo';
import type {
  CriterioResumen,
  ResumenEstadisticas,
} from '@/domain/estadistica/types';
import type { SesionPersonal } from '@/domain/personal/types';
import { container } from '@/main/container';
import { ETIQUETAS_TEMA } from '@/presentation/ayuda/temas';

const botonPrimario =
  'inline-flex items-center justify-center min-h-14 px-6 font-semibold text-btn-primary-fg bg-btn-primary-bg rounded-xl hover:bg-btn-primary-hover disabled:opacity-60 cursor-pointer no-underline';
const botonSecundario =
  'inline-flex items-center justify-center min-h-14 px-6 font-semibold text-btn-secondary-fg bg-btn-secondary-bg border-2 border-btn-secondary-border rounded-xl hover:bg-btn-secondary-hover-bg cursor-pointer no-underline';
const campo =
  'min-h-14 px-3 rounded-xl border-2 border-border bg-surface text-ink';

interface Resultado {
  clave: string;
  datos: ResumenEstadisticas | null;
  error: string | null;
  sesionExpirada: boolean;
}

function Restringido({
  titulo,
  accion,
}: {
  titulo: string;
  accion: React.ReactNode;
}) {
  return (
    <main
      id="contenido"
      className="max-w-160 mx-auto px-4 md:px-8 py-16 flex flex-col items-center gap-6 text-center"
    >
      <h1 className="text-[2rem] font-bold text-navy">{titulo}</h1>
      <p className="text-[1.111rem] text-muted max-w-120">
        Las estadísticas son solo para el personal del CLENA.
      </p>
      {accion}
    </main>
  );
}

/** Tabla accesible; la barra es solo un apoyo visual (la cifra siempre está en texto). */
function TablaConBarras({
  titulo,
  columna,
  filas,
  vacio,
}: {
  titulo: string;
  columna: string;
  filas: { clave: string; nombre: string; valor: number }[];
  vacio: string;
}) {
  const maximo = Math.max(1, ...filas.map((f) => f.valor));
  return (
    <section className="flex flex-col gap-3">
      <h2 className="m-0 text-[1.333rem] font-bold text-navy">{titulo}</h2>
      {filas.length === 0 ? (
        <p role="status" className="m-0 text-muted">
          {vacio}
        </p>
      ) : (
        <div className="overflow-x-auto bg-surface border-2 border-border rounded-2xl">
          <table className="w-full text-left border-collapse">
            <caption className="sr-only">{titulo}</caption>
            <thead>
              <tr className="bg-tint/40 border-b-2 border-border text-navy font-bold">
                <th scope="col" className="p-4">
                  {columna}
                </th>
                <th scope="col" className="p-4 text-right">
                  Cantidad
                </th>
                <th scope="col" className="p-4 w-1/3">
                  <span className="sr-only">Proporción</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr
                  key={f.clave}
                  className="border-b border-border last:border-0"
                >
                  <th scope="row" className="p-4 font-medium">
                    {f.nombre}
                  </th>
                  <td className="p-4 text-right font-bold">{f.valor}</td>
                  <td className="p-4" aria-hidden="true">
                    <div className="h-4 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full bg-btn-primary-bg"
                        style={{ width: `${(f.valor / maximo) * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function EstadisticasPage() {
  // undefined: leyendo la sesión; null: sin sesión
  const [sesion, setSesion] = useState<SesionPersonal | null | undefined>(
    undefined,
  );
  const [criterio, setCriterio] = useState<CriterioResumen>({});
  const [borrador, setBorrador] = useState({ desde: '', hasta: '' });
  const [errorPeriodo, setErrorPeriodo] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    let activo = true;
    void container.personal.obtenerSesion.ejecutar().then((s) => {
      if (activo) setSesion(s);
    });
    return () => {
      activo = false;
    };
  }, []);

  const token =
    sesion && !sesion.usuario.debeCambiarPassword ? sesion.accessToken : null;
  const clave = `${token ?? ''}|${criterio.desde ?? ''}|${criterio.hasta ?? ''}|${recarga}`;

  useEffect(() => {
    if (!token) return;
    let activo = true;
    // Promise.resolve: un periodo inválido se convierte en rechazo, no en excepción.
    Promise.resolve()
      .then(() => container.estadistica.resumen.ejecutar(token, criterio))
      .then((datos) => {
        if (!activo) return;
        setResultado({ clave, datos, error: null, sesionExpirada: false });
        // Con el periodo por defecto, los campos muestran el que eligió el servidor.
        setBorrador((b) =>
          b.desde || b.hasta
            ? b
            : { desde: datos.periodo.desde, hasta: datos.periodo.hasta },
        );
      })
      .catch((err: unknown) => {
        if (!activo) return;
        setResultado({
          clave,
          datos: null,
          error:
            err instanceof EstadisticaError
              ? err.message
              : 'No pudimos cargar las estadísticas.',
          sesionExpirada:
            err instanceof EstadisticaError && err.tipo === 'SESION',
        });
      });
    return () => {
      activo = false;
    };
  }, [clave, token, criterio]);

  const vigente = resultado?.clave === clave ? resultado : null;

  if (sesion === undefined) {
    return <Restringido titulo="Verificando tu sesión…" accion={null} />;
  }
  if (sesion === null || vigente?.sesionExpirada) {
    return (
      <Restringido
        titulo={
          vigente?.sesionExpirada ? 'Tu sesión terminó' : 'Necesitas ingresar'
        }
        accion={
          <Link to="/personal/acceso" className={botonPrimario}>
            Ir al acceso del personal
          </Link>
        }
      />
    );
  }
  if (sesion.usuario.debeCambiarPassword) {
    return (
      <Restringido
        titulo="Primero cambia tu contraseña"
        accion={
          <Link to="/personal/primer-acceso" className={botonPrimario}>
            Cambiar contraseña
          </Link>
        }
      />
    );
  }

  const consultar = (e: React.FormEvent) => {
    e.preventDefault();
    const problema = validarPeriodo(borrador);
    setErrorPeriodo(problema);
    if (problema) return;
    setCriterio({
      ...(borrador.desde ? { desde: borrador.desde } : {}),
      ...(borrador.hasta ? { hasta: borrador.hasta } : {}),
    });
  };

  const ultimosSieteDias = () => {
    setErrorPeriodo(null);
    setBorrador({ desde: '', hasta: '' });
    setCriterio({});
  };

  const datos = vigente?.datos ?? null;

  return (
    <main
      id="contenido"
      className="max-w-360 mx-auto px-4 md:px-12 lg:px-24 py-8 md:py-12 flex flex-col gap-8"
    >
      <header className="flex flex-col gap-2">
        <h1 className="m-0 text-[2rem] md:text-[2.333rem] font-bold text-navy">
          Estadísticas de uso
        </h1>
        <p className="m-0 text-[1.111rem] text-muted">
          Consultas a las guías y solicitudes de ayuda. Los días se cuentan en
          hora de Bogotá, con ambos extremos incluidos.
        </p>
      </header>

      <form
        onSubmit={consultar}
        noValidate
        className="flex flex-wrap items-end gap-4"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="est-desde" className="font-medium text-navy">
            Desde
          </label>
          <input
            id="est-desde"
            type="date"
            className={campo}
            value={borrador.desde}
            onChange={(e) =>
              setBorrador((b) => ({ ...b, desde: e.target.value }))
            }
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="est-hasta" className="font-medium text-navy">
            Hasta
          </label>
          <input
            id="est-hasta"
            type="date"
            className={campo}
            value={borrador.hasta}
            onChange={(e) =>
              setBorrador((b) => ({ ...b, hasta: e.target.value }))
            }
          />
        </div>
        <button type="submit" className={botonPrimario}>
          Consultar
        </button>
        <button
          type="button"
          className={botonSecundario}
          onClick={ultimosSieteDias}
        >
          Últimos 7 días
        </button>
      </form>
      {errorPeriodo && (
        <p
          role="alert"
          className="m-0 p-4 rounded-xl border-2 border-[#c62828] bg-[#fdecea] text-[#7f1d1d] font-medium"
        >
          {errorPeriodo}
        </p>
      )}

      {!vigente ? (
        <p role="status" className="text-[1.111rem] text-muted">
          Cargando estadísticas…
        </p>
      ) : !datos ? (
        <div className="flex flex-col items-start gap-4">
          <p role="alert" className="m-0 font-semibold">
            {vigente.error}
          </p>
          <button
            type="button"
            className={botonPrimario}
            onClick={() => {
              setResultado(null);
              setRecarga((n) => n + 1);
            }}
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <p className="m-0 font-semibold text-navy">
            Periodo: {datos.periodo.desde} a {datos.periodo.hasta}
          </p>

          {!datos.hayDatos ? (
            <p
              role="status"
              className="p-8 bg-surface border-2 border-border rounded-2xl text-[1.222rem] font-semibold text-navy m-0"
            >
              No hubo consultas ni solicitudes de ayuda en este periodo.
            </p>
          ) : (
            <>
              <dl className="grid gap-4 sm:grid-cols-2 m-0">
                <div className="p-6 bg-surface border-2 border-border rounded-2xl">
                  <dt className="text-muted">Consultas a guías</dt>
                  <dd className="m-0 text-[2.333rem] font-bold text-navy">
                    {datos.totales.consultasGuias}
                  </dd>
                </div>
                <div className="p-6 bg-surface border-2 border-border rounded-2xl">
                  <dt className="text-muted">Solicitudes de ayuda</dt>
                  <dd className="m-0 text-[2.333rem] font-bold text-navy">
                    {datos.totales.solicitudesAyuda}
                  </dd>
                </div>
              </dl>

              <TablaConBarras
                titulo="Guías más consultadas (hasta 10)"
                columna="Guía"
                filas={datos.topGuias.map((g) => ({
                  clave: g.slug,
                  nombre: g.titulo,
                  valor: g.consultas,
                }))}
                vacio="No hubo consultas a guías en este periodo."
              />
              <TablaConBarras
                titulo="Consultas por categoría"
                columna="Categoría"
                filas={datos.consultasPorCategoria.map((c) => ({
                  clave: c.slug,
                  nombre: c.nombre,
                  valor: c.consultas,
                }))}
                vacio="No hubo consultas a guías en este periodo."
              />
              <TablaConBarras
                titulo="Solicitudes de ayuda por tema"
                columna="Tema"
                filas={datos.solicitudesPorTema.map((t) => ({
                  clave: t.tema,
                  nombre: ETIQUETAS_TEMA[t.tema],
                  valor: t.cantidad,
                }))}
                vacio="No hubo solicitudes de ayuda en este periodo."
              />
            </>
          )}
        </>
      )}
    </main>
  );
}
