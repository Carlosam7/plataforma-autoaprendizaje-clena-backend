import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import type { DetalleGuia } from '../../domain/guias/types';
import { container } from '../../main/container';

export function GuiaDetallePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [detalle, setDetalle] = useState<DetalleGuia | null>(null);
  const [cargando, setCargando] = useState(true);
  const [pasoIndex, setPasoIndex] = useState(0);

  useEffect(() => {
    if (!slug) return;
    container.guias.obtenerDetalle
      .ejecutar(slug)
      .then((data) => {
        setDetalle(data);
      })
      .finally(() => {
        setCargando(false);
      });
  }, [slug]);

  if (cargando) {
    return (
      <main
        id="contenido"
        className="max-w-[1440px] mx-auto px-4 md:px-12 lg:px-24 py-16 text-center text-[1.111rem] text-[#526575]"
        role="status"
      >
        Cargando guía educativa...
      </main>
    );
  }

  if (!detalle) {
    return (
      <main
        id="contenido"
        className="max-w-[1440px] mx-auto px-4 md:px-12 lg:px-24 py-16 flex flex-col items-center gap-6 text-center"
      >
        <h1 className="text-[2rem] font-bold text-[#17324d]">
          Guía no encontrada
        </h1>
        <p className="text-[1.111rem] text-[#526575] max-w-[500px]">
          La guía que buscas no está disponible o ha cambiado de dirección.
        </p>
        <Link
          to="/guias"
          className="inline-flex items-center justify-center min-h-14 px-8 font-semibold text-white bg-[#0d6258] rounded-xl hover:bg-[#09473f] no-underline"
        >
          Volver a todas las guías
        </Link>
      </main>
    );
  }

  const { guia, pasos, preguntas } = detalle;
  const totalPasos = pasos.length;
  const pasoActual = pasos[pasoIndex];
  const esUltimoPaso = pasoIndex === totalPasos - 1;
  const porcentajeAvance = Math.round(((pasoIndex + 1) / totalPasos) * 100);

  const irPasoAnterior = () => {
    if (pasoIndex > 0) {
      setPasoIndex((prev) => prev - 1);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const irPasoSiguiente = () => {
    if (!esUltimoPaso) {
      setPasoIndex((prev) => prev + 1);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    } else if (preguntas.length > 0) {
      navigate(`/guias/${slug}/practica`);
    } else {
      navigate('/guias');
    }
  };

  return (
    <main
      id="contenido"
      className="max-w-[1440px] mx-auto px-4 md:px-12 lg:px-24 py-8 md:py-10 flex flex-col gap-8"
    >
      {/* Migas de pan y encabezado de la guía */}
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
          <span className="text-[#17324d] font-semibold" aria-current="page">
            {guia.titulo}
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2">
          <div className="flex flex-col gap-2">
            <h1 className="text-[2rem] md:text-[2.333rem] font-bold leading-[1.2] text-[#17324d]">
              {guia.subtitulo}
            </h1>
            <p className="text-[1.111rem] md:text-[1.222rem] text-[#526575]">
              Guía de {guia.titulo} · {guia.descripcion}
            </p>
          </div>

          {/* Widget de progreso visual del paso */}
          <div
            className="w-full lg:w-[320px] shrink-0 flex flex-col gap-2"
            role="progressbar"
            aria-valuenow={pasoIndex + 1}
            aria-valuemin={1}
            aria-valuemax={totalPasos}
            aria-label={`Paso ${pasoIndex + 1} de ${totalPasos}`}
          >
            <div className="flex justify-between items-center text-[1.111rem] font-semibold text-[#0d6258]">
              <span>
                Paso {pasoIndex + 1} de {totalPasos}
              </span>
              <span className="text-[#526575] font-medium text-[0.95rem]">
                {porcentajeAvance}%
              </span>
            </div>
            <div className="bg-[#dce7e7] h-[10px] rounded-full overflow-hidden w-full">
              <div
                className="bg-[#0d6258] h-full rounded-full transition-all duration-300"
                style={{ width: `${porcentajeAvance}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Región dinámica anunciada para tecnologías asistivas */}
      <div className="sr-only" aria-live="polite">
        Paso {pasoIndex + 1} de {totalPasos}: {pasoActual.titulo}
      </div>

      {/* Tarjetas de aprendizaje (dos columnas en escritorio fiel a Figma 4:3956) */}
      <section
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        aria-label="Contenido del paso educativo"
      >
        {/* Columna Izquierda: Tu aprendizaje */}
        <div className="lg:col-span-6 bg-white border border-[#d7e2e7] rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-sm">
          <div>
            <p className="text-[0.95rem] font-bold text-[#0d6258] uppercase tracking-wider">
              TU OBJETIVO
            </p>
            <p className="text-[1.222rem] font-medium text-[#17324d] mt-2">
              {guia.objetivo}
            </p>
          </div>

          <hr className="border-t border-[#e2e8f0]" />

          <div>
            <h2 className="text-[1.555rem] md:text-[1.666rem] font-bold text-[#17324d]">
              {pasoActual.titulo}
            </h2>
            <p className="text-[1.111rem] md:text-[1.222rem] text-[#172b3a] leading-relaxed mt-4">
              {pasoActual.contenido}
            </p>
          </div>

          {pasoActual.recordatorio && (
            <aside
              className="bg-[#fff3d8] border border-[#fde6b3] rounded-xl p-5 flex flex-col gap-1 text-[#17324d]"
              aria-label="Consejo importante para recordar"
            >
              <p className="font-bold text-[1rem] flex items-center gap-2">
                <span aria-hidden="true">💡</span>{' '}
                {pasoActual.recordatorio.titulo}
              </p>
              <p className="text-[1.111rem] font-medium leading-relaxed">
                {pasoActual.recordatorio.consejo}
              </p>
            </aside>
          )}

          {esUltimoPaso && (
            <div
              className="bg-[#e7f2ee] border-2 border-[#0d6258] rounded-xl p-5 flex flex-col gap-2 text-[#0d6258]"
              role="alert"
            >
              <p className="font-bold text-[1.222rem] flex items-center gap-2">
                <span aria-hidden="true">✓</span> ¡Felicitaciones! Llegaste al
                final de la guía.
              </p>
              <p className="text-[1.111rem] text-[#17324d]">
                Has completado todos los pasos explicativos. Ahora puedes poner
                a prueba lo aprendido con la práctica interactiva sin ningún
                riesgo.
              </p>
            </div>
          )}
        </div>

        {/* Columna Derecha: Observa este ejemplo */}
        <div className="lg:col-span-6 bg-[#e7f2ee] border border-[#c2ded3] rounded-2xl p-6 md:p-8 flex flex-col gap-5">
          <p className="text-[0.95rem] font-bold text-[#0d6258] uppercase tracking-wider">
            OBSERVA ESTE EJEMPLO
          </p>

          {/* Si el paso trae una imagen del backend, la mostramos */}
          {pasoActual.bloques?.find((b) => b.tipo === 'imagen') && (
            <figure className="bg-white border border-[#d7e2e7] rounded-2xl p-4 flex flex-col items-center gap-3 shadow-sm">
              <img
                src={
                  (
                    pasoActual.bloques.find((b) => b.tipo === 'imagen') as {
                      url: string;
                    }
                  ).url
                }
                alt={
                  (
                    pasoActual.bloques.find((b) => b.tipo === 'imagen') as {
                      textoAlternativo: string;
                    }
                  ).textoAlternativo
                }
                className="max-w-full h-auto rounded-xl object-contain max-h-[350px]"
              />
              <figcaption className="text-[#526575] text-[0.95rem] italic text-center">
                {
                  (
                    pasoActual.bloques.find((b) => b.tipo === 'imagen') as {
                      textoAlternativo: string;
                    }
                  ).textoAlternativo
                }
              </figcaption>
            </figure>
          )}

          {pasoActual.ejemplo ? (
            <div className="bg-white border border-[#d7e2e7] rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-[#17324d] text-[1.111rem]">
                  {pasoActual.ejemplo.titulo}
                </p>
                <p className="text-[#526575] text-[0.95rem]">
                  {pasoActual.ejemplo.remitente}
                </p>
              </div>

              {/* Burbuja de mensaje simulado */}
              <div className="bg-[#f1f5f5] rounded-xl p-5 flex flex-col gap-3 border border-[#e2e8f0]">
                <p className="text-[#172b3a] text-[1.111rem] md:text-[1.222rem] leading-relaxed whitespace-pre-line font-normal">
                  {pasoActual.ejemplo.contenido}
                </p>
                {pasoActual.ejemplo.enlaceODetalle && (
                  <p
                    className="text-[#0d6258] font-mono text-[1rem] select-all bg-white/70 px-3 py-1.5 rounded-lg border border-[#d7e2e7] inline-block self-start"
                    aria-label={`Enlace inerte simulado: ${pasoActual.ejemplo.enlaceODetalle}`}
                  >
                    {pasoActual.ejemplo.enlaceODetalle}
                  </p>
                )}
              </div>

              {pasoActual.ejemplo.senalAlerta && (
                <div className="bg-[#fff3d8] rounded-xl px-4 py-3 text-[#17324d] font-semibold text-[1rem] flex items-center gap-2">
                  <span>{pasoActual.ejemplo.senalAlerta}</span>
                </div>
              )}

              <p className="text-[#526575] text-[0.95rem] italic text-center pt-2">
                {pasoActual.ejemplo.textoAlternativo}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-[#d7e2e7] rounded-2xl p-8 text-center text-[#526575]">
              <p className="text-[1.111rem]">
                Sigue las indicaciones del panel izquierdo para comprender este
                concepto.
              </p>
            </div>
          )}

          <p className="text-[#526575] text-[0.95rem] text-center">
            Ejemplo simulado con fines educativos. Ningún enlace es real.
          </p>
        </div>
      </section>

      {/* Barra de navegación de pasos inferior */}
      <section
        className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#d7e2e7]"
        aria-label="Navegación entre pasos"
      >
        <button
          type="button"
          onClick={irPasoAnterior}
          disabled={pasoIndex === 0}
          className={`inline-flex items-center justify-center min-h-14 px-6 py-4 font-semibold text-[1.111rem] rounded-xl border border-[#d7e2e7] transition-colors focus:outline-none focus:ring-4 focus:ring-[#0d6258]/30 ${
            pasoIndex === 0
              ? 'bg-[#e3e9ed] text-[#526575] cursor-not-allowed border-transparent'
              : 'bg-white text-[#17324d] hover:bg-[#f1f5f5] cursor-pointer'
          }`}
        >
          ← Anterior
        </button>

        <p className="text-[1.111rem] text-[#526575] font-medium text-center">
          Tómate el tiempo que necesites.
        </p>

        <button
          type="button"
          onClick={irPasoSiguiente}
          className="inline-flex items-center justify-center min-h-14 px-8 py-4 font-semibold text-[1.111rem] text-white bg-[#0d6258] rounded-xl hover:bg-[#09473f] cursor-pointer transition-colors focus:outline-none focus:ring-4 focus:ring-[#0d6258]/30"
        >
          {esUltimoPaso
            ? preguntas.length > 0
              ? 'Ir a la práctica interactiva →'
              : 'Terminar guía →'
            : 'Siguiente →'}
        </button>
      </section>

      {/* Cierre institucional con botón de ayuda siempre presente */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-[#d7e2e7] text-[#526575]">
        <p className="text-[1rem]">
          Kamá · Aprende a tu ritmo. Estamos para acompañarte.
        </p>
        <Link
          to="/ayuda"
          className="inline-flex items-center gap-2 px-5 py-3 font-semibold text-[#0d6258] bg-white border border-[#0d6258] rounded-full hover:bg-[#e7f2ee] no-underline focus:outline-none focus:ring-4 focus:ring-[#0d6258]/30"
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
