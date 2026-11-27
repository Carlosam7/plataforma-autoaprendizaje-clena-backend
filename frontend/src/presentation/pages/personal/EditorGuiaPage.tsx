import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { GuiaInvalidaError } from '@/application/gestion/casos';
import type { Categoria } from '@/domain/guias/types';
import {
  type GuardarGuiaComando,
  type GuiaGestionDetalle,
  LIMITES,
  NIVELES,
  type Nivel,
  type PasoGuia,
} from '@/domain/gestion/types';
import {
  PersonalError,
  SesionPersonalExpiradaError,
} from '@/domain/personal/errors';
import { container } from '@/main/container';
import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from '@/presentation/ayuda/estilos';
import { EditorPasos } from '@/presentation/gestion/EditorPasos';
import { NavegacionPersonal } from '@/presentation/personal/NavegacionPersonal';
import { useSesionPersonal } from '@/presentation/personal/useSesionPersonal';
import {
  ETIQUETA_ESTADO,
  ETIQUETA_NIVEL,
} from '@/presentation/gestion/etiquetas';

const campo =
  'w-full min-h-12 p-3 text-[1.111rem] bg-white border-2 border-border-input rounded-xl text-ink focus:outline-none focus:ring-4 focus:ring-primary/20';

const VACIA: GuardarGuiaComando = {
  titulo: '',
  objetivo: '',
  descripcion: '',
  categoria: '',
  nivel: 'BASICO',
  duracionEstimadaMin: 10,
  palabrasClave: [],
  pasos: [{ titulo: '', bloques: [{ tipo: 'texto', texto: '' }] }],
};

function desdeDetalle(g: GuiaGestionDetalle): GuardarGuiaComando {
  return {
    titulo: g.titulo,
    objetivo: g.objetivo,
    descripcion: g.descripcion ?? '',
    categoria: g.categoria,
    nivel: g.nivel,
    duracionEstimadaMin: g.duracionEstimadaMin,
    palabrasClave: g.palabrasClave,
    pasos: g.pasos.map(({ id, titulo, bloques }) => ({ id, titulo, bloques })),
  };
}

/**
 * HU-13, HU-15 (FE-05): crear o editar una guía. Al guardar se envían todos los pasos en
 * orden (los que ya existían conservan su id, y con él el progreso de quienes los leyeron).
 * Publicar exige al menos un paso; ocultar la saca del catálogo sin borrar nada.
 */
export function EditorGuiaPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const sesion = useSesionPersonal();
  const [guia, setGuia] = useState<GuiaGestionDetalle | null>(null);
  const [form, setForm] = useState<GuardarGuiaComando>(VACIA);
  const [palabras, setPalabras] = useState('');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [errores, setErrores] = useState<{ campo: string; mensaje: string }[]>(
    [],
  );
  const [aviso, setAviso] = useState<string | null>(null);
  const [cargando, setCargando] = useState(Boolean(slug));
  const [ocupado, setOcupado] = useState(false);
  const resumen = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void container.guias.listarCategorias
      .ejecutar()
      .then(setCategorias)
      .catch(() => setCategorias([]));
  }, []);

  useEffect(() => {
    if (!sesion || !slug) return;
    let vigente = true;
    container.gestionGuias.obtener
      .ejecutar(slug)
      .then((g) => {
        if (!vigente) return;
        setGuia(g);
        setForm(desdeDetalle(g));
        setPalabras(g.palabrasClave.join(', '));
      })
      .catch((err) => vigente && fallo(err, 'No se pudo cargar la guía.'))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
    // fallo solo usa navigate y setters estables.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesion, slug]);

  useEffect(() => {
    if (errores.length > 0) resumen.current?.focus();
  }, [errores]);

  function fallo(err: unknown, porDefecto: string) {
    if (err instanceof SesionPersonalExpiradaError) {
      navigate('/personal/acceso');
      return;
    }
    if (err instanceof GuiaInvalidaError) {
      setErrores(err.errores);
      return;
    }
    const mensaje = err instanceof Error ? err.message : porDefecto;
    const campoError = err instanceof PersonalError ? err.campo : undefined;
    setErrores([{ campo: campoError ?? 'general', mensaje }]);
  }

  const comando = (): GuardarGuiaComando => ({
    ...form,
    palabrasClave: palabras
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean),
  });

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrores([]);
    setAviso(null);
    setOcupado(true);
    try {
      const guardada = await container.gestionGuias.guardar.ejecutar(
        comando(),
        guia?.slug,
      );
      setGuia(guardada);
      setForm(desdeDetalle(guardada));
      setAviso(
        guia
          ? 'Cambios guardados.'
          : 'Guía creada como borrador. Publícala cuando esté lista.',
      );
      if (!guia)
        navigate(`/personal/guias/${guardada.slug}`, { replace: true });
    } catch (err) {
      fallo(err, 'No se pudo guardar la guía.');
    } finally {
      setOcupado(false);
    }
  };

  const cambiarEstado = async (accion: 'publicar' | 'ocultar') => {
    if (!guia) return;
    setErrores([]);
    setAviso(null);
    setOcupado(true);
    try {
      const nueva =
        accion === 'publicar'
          ? await container.gestionGuias.publicar.ejecutar(guia)
          : await container.gestionGuias.ocultar.ejecutar(guia.slug);
      setGuia(nueva);
      setAviso(
        accion === 'publicar'
          ? 'Guía publicada: ya aparece en el catálogo.'
          : 'Guía oculta: ya no aparece en el catálogo. Sus datos y el progreso se conservan.',
      );
    } catch (err) {
      fallo(err, 'No se pudo cambiar el estado de la guía.');
    } finally {
      setOcupado(false);
    }
  };

  if (!sesion || cargando) {
    return (
      <main id="contenido" className="max-w-300 mx-auto px-4 md:px-8 py-12">
        <p role="status" className="text-[1.111rem] text-muted">
          Cargando…
        </p>
      </main>
    );
  }

  const errorDe = (nombre: string) =>
    errores.filter((e) => e.campo === nombre).map((e) => e.mensaje);
  const erroresPasos: Record<string, string[]> = {};
  for (const e of errores) {
    if (e.campo.startsWith('paso-'))
      (erroresPasos[e.campo] ??= []).push(e.mensaje);
  }
  const describe = (nombre: string, ayuda?: string) =>
    [ayuda, errorDe(nombre).length ? `error-${nombre}` : undefined]
      .filter(Boolean)
      .join(' ') || undefined;
  const mensajeCampo = (nombre: string) =>
    errorDe(nombre).length > 0 && (
      <p id={`error-${nombre}`} className="text-ink font-semibold m-0">
        ⚠ {errorDe(nombre).join(' ')}
      </p>
    );

  return (
    <main
      id="contenido"
      className="max-w-300 mx-auto px-4 md:px-8 py-10 flex flex-col gap-8"
    >
      <NavegacionPersonal sesion={sesion} />
      <div className="flex flex-col gap-2">
        <Link to="/personal/guias" className="text-primary underline">
          ← Volver a las guías
        </Link>
        <h1 className="text-[2rem] md:text-[2.444rem] font-bold text-navy leading-tight m-0">
          {guia ? `Editar «${guia.titulo}»` : 'Nueva guía'}
        </h1>
        {guia && (
          <p className="text-[1.111rem] text-muted m-0">
            Estado: <strong>{ETIQUETA_ESTADO[guia.estado]}</strong> ·{' '}
            {guia.totalPasos} pasos · editada por {guia.actualizadaPor}
          </p>
        )}
      </div>

      <div aria-live="polite">
        {aviso && (
          <p className="p-4 bg-notice border-2 border-border-input rounded-xl text-ink m-0">
            {aviso}
          </p>
        )}
      </div>

      {errores.length > 0 && (
        <div
          ref={resumen}
          tabIndex={-1}
          role="alert"
          className="p-5 bg-notice border-2 border-border-input rounded-xl text-ink"
        >
          <p className="font-bold text-[1.111rem] m-0">
            Revisa{' '}
            {errores.length === 1 ? 'esto' : `estos ${errores.length} puntos`}{' '}
            antes de guardar:
          </p>
          <ul className="mt-2 mb-0 pl-6">
            {errores.map((e) => (
              <li key={`${e.campo}-${e.mensaje}`}>{e.mensaje}</li>
            ))}
          </ul>
        </div>
      )}

      <form
        onSubmit={(e) => void guardar(e)}
        noValidate
        className="flex flex-col gap-6"
      >
        <fieldset className="bg-surface border-2 border-border-subtle rounded-2xl p-5 flex flex-col gap-4">
          <legend className="px-2 text-[1.333rem] font-bold text-navy">
            Datos de la guía
          </legend>
          <div className="flex flex-col gap-1">
            <label htmlFor="titulo" className="font-semibold text-navy">
              Título *
            </label>
            <input
              id="titulo"
              required
              maxLength={LIMITES.titulo}
              value={form.titulo}
              aria-invalid={errorDe('titulo').length > 0}
              aria-describedby={describe('titulo')}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              className={campo}
            />
            {mensajeCampo('titulo')}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="objetivo" className="font-semibold text-navy">
              Objetivo * («Al terminar sabrás…»)
            </label>
            <input
              id="objetivo"
              required
              maxLength={LIMITES.objetivo}
              value={form.objetivo}
              aria-invalid={errorDe('objetivo').length > 0}
              aria-describedby={describe('objetivo')}
              onChange={(e) => setForm({ ...form, objetivo: e.target.value })}
              className={campo}
            />
            {mensajeCampo('objetivo')}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="descripcion" className="font-semibold text-navy">
              Descripción (opcional)
            </label>
            <textarea
              id="descripcion"
              rows={3}
              maxLength={LIMITES.descripcion}
              value={form.descripcion ?? ''}
              aria-describedby={describe('descripcion')}
              onChange={(e) =>
                setForm({ ...form, descripcion: e.target.value })
              }
              className={campo}
            />
            {mensajeCampo('descripcion')}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="categoria" className="font-semibold text-navy">
                Categoría *
              </label>
              <select
                id="categoria"
                required
                value={form.categoria}
                aria-invalid={errorDe('categoria').length > 0}
                aria-describedby={describe('categoria')}
                onChange={(e) =>
                  setForm({ ...form, categoria: e.target.value })
                }
                className={campo}
              >
                <option value="">Elige una categoría</option>
                {categorias.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              {mensajeCampo('categoria')}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="nivel" className="font-semibold text-navy">
                Nivel *
              </label>
              <select
                id="nivel"
                value={form.nivel}
                onChange={(e) =>
                  setForm({ ...form, nivel: e.target.value as Nivel })
                }
                className={campo}
              >
                {NIVELES.map((n) => (
                  <option key={n} value={n}>
                    {ETIQUETA_NIVEL[n]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="duracion" className="font-semibold text-navy">
                Duración (minutos) *
              </label>
              <input
                id="duracion"
                type="number"
                inputMode="numeric"
                min={LIMITES.duracionMin}
                max={LIMITES.duracionMax}
                value={form.duracionEstimadaMin}
                aria-invalid={errorDe('duracionEstimadaMin').length > 0}
                aria-describedby={describe('duracionEstimadaMin')}
                onChange={(e) =>
                  setForm({
                    ...form,
                    duracionEstimadaMin: Number(e.target.value),
                  })
                }
                className={campo}
              />
              {mensajeCampo('duracionEstimadaMin')}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="palabras" className="font-semibold text-navy">
              Palabras clave (opcional)
            </label>
            <input
              id="palabras"
              value={palabras}
              aria-describedby={describe('palabrasClave', 'ayuda-palabras')}
              onChange={(e) => setPalabras(e.target.value)}
              className={campo}
            />
            <p id="ayuda-palabras" className="text-muted m-0">
              Sepáralas con comas. Máximo {LIMITES.palabrasClave}, de hasta{' '}
              {LIMITES.palabraClave} letras cada una.
            </p>
            {mensajeCampo('palabrasClave')}
          </div>
        </fieldset>

        <section aria-labelledby="titulo-pasos" className="flex flex-col gap-4">
          <h2
            id="titulo-pasos"
            className="text-[1.5rem] font-bold text-navy m-0"
          >
            Pasos ({form.pasos?.length ?? 0})
          </h2>
          {mensajeCampo('pasos')}
          <EditorPasos
            pasos={form.pasos ?? []}
            onChange={(pasos: PasoGuia[]) => setForm({ ...form, pasos })}
            errores={erroresPasos}
          />
        </section>

        <div className="flex flex-wrap gap-3 border-t-2 border-border-subtle pt-6">
          <button type="submit" disabled={ocupado} className={BOTON_PRIMARIO}>
            {ocupado ? 'Guardando…' : guia ? 'Guardar cambios' : 'Crear guía'}
          </button>
          {guia && guia.estado !== 'PUBLICADA' && (
            <button
              type="button"
              disabled={ocupado}
              onClick={() => void cambiarEstado('publicar')}
              className={BOTON_SECUNDARIO}
            >
              Publicar
            </button>
          )}
          {guia && guia.estado === 'PUBLICADA' && (
            <button
              type="button"
              disabled={ocupado}
              onClick={() => void cambiarEstado('ocultar')}
              className={BOTON_SECUNDARIO}
            >
              Ocultar del catálogo
            </button>
          )}
        </div>
        {guia && (
          <p className="text-muted m-0">
            Publicar u ocultar usa lo último guardado: guarda primero tus
            cambios.
          </p>
        )}
      </form>
    </main>
  );
}
