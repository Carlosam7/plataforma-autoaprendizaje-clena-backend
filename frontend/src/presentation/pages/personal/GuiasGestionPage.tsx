import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import type { Categoria } from '@/domain/guias/types';
import {
  ESTADOS_GUIA,
  type EstadoGuiaGestion,
  type GuiaGestionResumen,
} from '@/domain/gestion/types';
import { SesionPersonalExpiradaError } from '@/domain/personal/errors';
import { container } from '@/main/container';
import { BOTON_PRIMARIO } from '@/presentation/ayuda/estilos';
import { ETIQUETA_ESTADO } from '@/presentation/gestion/etiquetas';
import { NavegacionPersonal } from '@/presentation/personal/NavegacionPersonal';
import { useSesionPersonal } from '@/presentation/personal/useSesionPersonal';

const campo =
  'min-h-12 px-3 text-[1.111rem] bg-white border-2 border-border-input rounded-xl text-ink focus:outline-none focus:ring-4 focus:ring-primary/20';

/** HU-13, HU-15 (FE-05): las guías del personal, en cualquier estado. */
export function GuiasGestionPage() {
  const navigate = useNavigate();
  const sesion = useSesionPersonal();
  const [guias, setGuias] = useState<GuiaGestionResumen[] | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [estado, setEstado] = useState<EstadoGuiaGestion | ''>('');
  const [categoria, setCategoria] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Se vuelve a pedir al cambiar un filtro; una respuesta vieja no pisa a la nueva.
  useEffect(() => {
    if (!sesion) return;
    let vigente = true;
    container.gestionGuias.listar
      .ejecutar({
        estado: estado || undefined,
        categoria: categoria || undefined,
      })
      .then((res) => {
        if (!vigente) return;
        setGuias(res.datos);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!vigente) return;
        if (err instanceof SesionPersonalExpiradaError) {
          navigate('/personal/acceso');
          return;
        }
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar las guías.',
        );
      });
    return () => {
      vigente = false;
    };
  }, [sesion, estado, categoria, navigate]);

  useEffect(() => {
    void container.guias.listarCategorias
      .ejecutar()
      .then(setCategorias)
      .catch(() => setCategorias([]));
  }, []);

  if (!sesion) {
    return (
      <main id="contenido" className="max-w-300 mx-auto px-4 md:px-8 py-12">
        <p role="status" className="text-[1.111rem] text-muted">
          Comprobando tu sesión…
        </p>
      </main>
    );
  }

  const nombreCategoria = (slug: string) =>
    categorias.find((c) => c.slug === slug)?.nombre ?? slug;

  return (
    <main
      id="contenido"
      className="max-w-300 mx-auto px-4 md:px-8 py-10 flex flex-col gap-8"
    >
      <NavegacionPersonal sesion={sesion} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-[2rem] md:text-[2.444rem] font-bold text-navy leading-tight m-0">
            Guías
          </h1>
          <p className="text-[1.111rem] text-muted m-0">
            Crea, edita, publica u oculta las guías. Las nuevas empiezan como
            borrador y nadie las ve hasta que las publiques.
          </p>
        </div>
        <Link to="/personal/guias/nueva" className={BOTON_PRIMARIO}>
          Nueva guía
        </Link>
      </div>

      <form
        className="flex flex-wrap gap-4 items-end"
        onSubmit={(e) => e.preventDefault()}
        aria-label="Filtrar guías"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="filtro-estado" className="font-semibold text-navy">
            Estado
          </label>
          <select
            id="filtro-estado"
            value={estado}
            onChange={(e) =>
              setEstado(e.target.value as EstadoGuiaGestion | '')
            }
            className={campo}
          >
            <option value="">Todos</option>
            {ESTADOS_GUIA.map((e) => (
              <option key={e} value={e}>
                {ETIQUETA_ESTADO[e]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="filtro-categoria" className="font-semibold text-navy">
            Categoría
          </label>
          <select
            id="filtro-categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className={campo}
          >
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      </form>

      {error && (
        <div
          role="alert"
          className="p-5 bg-notice border-2 border-border-input rounded-xl text-ink"
        >
          <p className="font-bold text-[1.111rem] m-0">Atención</p>
          <p className="text-[1rem] mt-1 mb-0">{error}</p>
        </div>
      )}

      {!guias && !error && (
        <p role="status" className="text-[1.111rem] text-muted">
          Cargando guías…
        </p>
      )}

      {guias && guias.length === 0 && (
        <p className="text-[1.111rem] text-ink">
          No hay guías con estos filtros.
        </p>
      )}

      {guias && guias.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[1rem]">
            <caption className="sr-only">
              Guías ({guias.length}), de la editada más recientemente a la más
              antigua
            </caption>
            <thead>
              <tr className="border-b-2 border-border-subtle text-navy">
                <th scope="col" className="py-3 pr-4">
                  Guía
                </th>
                <th scope="col" className="py-3 pr-4">
                  Estado
                </th>
                <th scope="col" className="py-3 pr-4">
                  Categoría
                </th>
                <th scope="col" className="py-3 pr-4">
                  Pasos
                </th>
                <th scope="col" className="py-3 pr-4">
                  Última edición
                </th>
              </tr>
            </thead>
            <tbody>
              {guias.map((g) => (
                <tr key={g.slug} className="border-b border-border-subtle">
                  <th scope="row" className="py-3 pr-4 font-semibold">
                    <Link
                      to={`/personal/guias/${g.slug}`}
                      className="text-primary underline"
                    >
                      {g.titulo}
                    </Link>
                  </th>
                  <td className="py-3 pr-4">{ETIQUETA_ESTADO[g.estado]}</td>
                  <td className="py-3 pr-4">{nombreCategoria(g.categoria)}</td>
                  <td className="py-3 pr-4">{g.totalPasos}</td>
                  <td className="py-3 pr-4">
                    {g.actualizadoEn.toLocaleDateString('es-CO')} ·{' '}
                    {g.actualizadaPor}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
