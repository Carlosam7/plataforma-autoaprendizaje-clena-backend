import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import type { Categoria } from '@/domain/guias/types';
import { SesionRequeridaError } from '@/domain/practica/errors';
import type { ModoPractica } from '@/domain/practica/types';
import { ProgresoError } from '@/domain/progreso/errors';
import type { ProgresoPaginado } from '@/domain/progreso/types';
import { container } from '@/main/container';

const LIMITE = 20;

const estiloBotonPrimario =
  'inline-flex items-center justify-center min-h-14 px-6 py-4 font-semibold text-btn-primary-fg bg-btn-primary-bg rounded-xl hover:bg-btn-primary-hover no-underline cursor-pointer border-2 border-btn-primary-border disabled:opacity-60 disabled:cursor-not-allowed';
const estiloBotonSecundario =
  'inline-flex items-center justify-center min-h-14 px-6 py-4 font-semibold text-btn-secondary-fg bg-btn-secondary-bg border-2 border-btn-secondary-border rounded-xl hover:border-btn-secondary-hover-border hover:bg-btn-secondary-hover-bg no-underline cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';

interface Resultado {
  clave: string;
  datos: ProgresoPaginado | null;
  error: string | null;
  sesionExpirada: boolean;
}

function InvitacionRegistro() {
  return (
    <div className="p-8 bg-card-bg border-2 border-card-border rounded-2xl max-w-176 mt-2">
      <h2 className="text-[1.333rem] font-bold text-card-title">
        ¿Aún no has iniciado sesión?
      </h2>
      <p className="mt-2 text-card-text">
        Para guardar tu progreso de manera permanente y acceder desde cualquier
        equipo del CLENA, crea tu cuenta o inicia sesión. Es opcional: puedes
        seguir aprendiendo sin cuenta, pero tu avance no se guardará.
      </p>
      <div className="flex flex-wrap gap-4 mt-6">
        <Link to="/registro" className={estiloBotonPrimario}>
          Crear cuenta gratuita
        </Link>
        <Link to="/iniciar-sesion" className={estiloBotonSecundario}>
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}

function Lista() {
  const [categoria, setCategoria] = useState('');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [pagina, setPagina] = useState(1);
  const [intento, setIntento] = useState(0);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const clave = `${categoria}|${pagina}|${intento}`;

  useEffect(() => {
    let activo = true;
    // El filtro es opcional: si el catálogo no responde, la lista sigue funcionando.
    container.guias.listarCategorias
      .ejecutar()
      .then((c) => activo && setCategorias(c))
      .catch(() => undefined);
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    let activo = true;
    container.progreso.listar
      .ejecutar({
        categoria: categoria || undefined,
        pagina,
        limite: LIMITE,
      })
      .then((datos) => {
        if (activo)
          setResultado({ clave, datos, error: null, sesionExpirada: false });
      })
      .catch((err: unknown) => {
        if (!activo) return;
        const expirada =
          err instanceof SesionRequeridaError ||
          (err instanceof ProgresoError && err.tipo === 'SESION');
        setResultado({
          clave,
          datos: null,
          sesionExpirada: expirada,
          error:
            err instanceof ProgresoError || err instanceof SesionRequeridaError
              ? err.message
              : 'No pudimos cargar tu progreso.',
        });
      });
    return () => {
      activo = false;
    };
  }, [categoria, pagina, clave]);

  const vigente = resultado?.clave === clave ? resultado : null;
  const datos = vigente?.datos ?? null;
  const totalPaginas = datos ? Math.max(1, Math.ceil(datos.total / LIMITE)) : 1;

  if (vigente?.sesionExpirada) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p role="alert" className="m-0 text-[1.111rem] font-semibold">
          Tu sesión terminó. Inicia sesión de nuevo para ver tu progreso.
        </p>
        <Link to="/iniciar-sesion" className={estiloBotonPrimario}>
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {categorias.length > 0 && (
        <label className="flex items-center gap-3 font-medium text-card-title">
          Categoría
          <select
            value={categoria}
            onChange={(e) => {
              setCategoria(e.target.value);
              setPagina(1);
            }}
            className="min-h-14 px-3 rounded-xl border-2 border-card-border bg-card-bg"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
      )}

      {!vigente ? (
        <p role="status" className="text-[1.111rem] text-hero-text">
          Cargando tu progreso…
        </p>
      ) : !datos ? (
        <div className="flex flex-col items-start gap-4">
          <p role="alert" className="m-0 text-[1.111rem] font-semibold">
            {vigente.error}
          </p>
          <button
            type="button"
            className={estiloBotonPrimario}
            onClick={() => {
              setResultado(null);
              setIntento((n) => n + 1);
            }}
          >
            Reintentar
          </button>
        </div>
      ) : datos.datos.length === 0 ? (
        <p
          role="status"
          className="p-8 bg-card-bg border-2 border-card-border rounded-2xl text-[1.222rem] font-semibold"
        >
          {categoria
            ? 'No hay guías en esta categoría.'
            : 'Todavía no hay guías publicadas.'}
        </p>
      ) : (
        <ul className="list-none p-0 m-0 flex flex-col gap-4">
          {datos.datos.map((g) => (
            <li
              key={g.slug}
              className="p-6 bg-card-bg border-2 border-card-border rounded-2xl flex flex-col md:flex-row md:items-center gap-4"
            >
              <div className="flex-1 flex flex-col gap-2">
                <h2 className="m-0 text-[1.333rem] font-bold text-card-title">
                  {g.titulo}
                </h2>
                <div className="flex items-center gap-3">
                  <div
                    role="progressbar"
                    aria-label={`Avance de ${g.titulo}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={g.porcentaje}
                    className="h-4 flex-1 max-w-80 rounded-full bg-card-border overflow-hidden"
                  >
                    <div
                      className="h-full bg-btn-primary-bg"
                      style={{ width: `${g.porcentaje}%` }}
                    />
                  </div>
                  <span className="font-bold">{g.porcentaje}%</span>
                </div>
                <p className="m-0 text-card-text">
                  {g.pasosLeidos} de {g.totalPasos} pasos leídos
                  {g.estado === 'COMPLETADA' && ' · Completada'}
                </p>
              </div>
              {g.estado === 'SIN_EMPEZAR' ? (
                <Link to={`/guias/${g.slug}`} className={estiloBotonPrimario}>
                  Empezar
                </Link>
              ) : g.estado === 'EN_CURSO' ? (
                <Link
                  to={
                    g.ultimoPaso != null
                      ? `/guias/${g.slug}?paso=${g.ultimoPaso}`
                      : `/guias/${g.slug}`
                  }
                  className={estiloBotonPrimario}
                >
                  {g.ultimoPaso != null
                    ? `Continuar en el paso ${g.ultimoPaso}`
                    : 'Continuar'}
                </Link>
              ) : (
                <Link to={`/guias/${g.slug}`} className={estiloBotonSecundario}>
                  Repasar guía
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}

      {datos && datos.total > LIMITE && (
        <nav
          aria-label="Paginación de progreso"
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
            Página {datos.pagina} de {totalPaginas}
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
    </div>
  );
}

export function ProgresoPage() {
  const [modo, setModo] = useState<ModoPractica | null>(null);

  useEffect(() => {
    let activo = true;
    void container.practica.determinarModo().then((m) => {
      if (activo) setModo(m);
    });
    return () => {
      activo = false;
    };
  }, []);

  return (
    <main
      id="contenido"
      className="max-w-360 mx-auto px-gutter py-12 md:py-16 flex flex-col gap-6"
    >
      <p className="text-[1.111rem] font-semibold text-eyebrow">
        MI APRENDIZAJE
      </p>
      <h1 className="text-[2rem] md:text-[2.444rem] font-bold leading-[1.13] text-hero-title">
        Mi progreso
      </h1>
      <p className="text-[1.111rem] text-hero-text max-w-176">
        Aquí puedes ver las guías que has completado y en cuál paso quedaste
        para seguir avanzando.
      </p>
      {modo === null ? (
        <p role="status" className="text-[1.111rem] text-hero-text">
          Verificando tu sesión…
        </p>
      ) : modo === 'REGISTRADO' ? (
        <Lista />
      ) : (
        <InvitacionRegistro />
      )}
    </main>
  );
}
