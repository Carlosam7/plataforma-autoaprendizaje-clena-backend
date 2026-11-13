import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import type { DetalleGuia } from '../../domain/guias/types';
import { container } from '../../main/container';

export function GuiaPracticaPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [detalle, setDetalle] = useState<DetalleGuia | null>(null);
  const [cargando, setCargando] = useState(true);

  // Estado del flujo de preguntas
  const [preguntaIndex, setPreguntaIndex] = useState(0);
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<
    'A' | 'B' | 'C' | null
  >(null);
  const [revisado, setRevisado] = useState(false);
  const [aciertos, setAciertos] = useState(0);

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
        Cargando práctica interactiva...
      </main>
    );
  }

  if (!detalle || detalle.preguntas.length === 0) {
    return (
      <main
        id="contenido"
        className="max-w-[1440px] mx-auto px-4 md:px-12 lg:px-24 py-16 flex flex-col items-center gap-6 text-center"
      >
        <h1 className="text-[2rem] font-bold text-[#17324d]">
          Esta guía no tiene práctica disponible aún
        </h1>
        <p className="text-[1.111rem] text-[#526575] max-w-[500px]">
          Puedes repasar el contenido teórico o explorar otras guías de la sala.
        </p>
        <Link
          to={`/guias/${slug}`}
          className="inline-flex items-center justify-center min-h-14 px-8 font-semibold text-white bg-[#0d6258] rounded-xl hover:bg-[#09473f] no-underline"
        >
          Volver a la guía
        </Link>
      </main>
    );
  }

  const { guia, preguntas } = detalle;
  const totalPreguntas = preguntas.length;
  const preguntaActual = preguntas[preguntaIndex];
  const esUltimaPregunta = preguntaIndex === totalPreguntas - 1;
  const porcentajeProgreso = Math.round(
    ((preguntaIndex + 1) / totalPreguntas) * 100,
  );

  const esCorrecta = opcionSeleccionada === preguntaActual.opcionCorrecta;

  const comprobarRespuesta = () => {
    if (!opcionSeleccionada) return;
    setRevisado(true);
    if (opcionSeleccionada === preguntaActual.opcionCorrecta) {
      setAciertos((prev) => prev + 1);
    }
  };

  const avanzarSiguientePregunta = () => {
    if (!esUltimaPregunta) {
      setPreguntaIndex((prev) => prev + 1);
      setOpcionSeleccionada(null);
      setRevisado(false);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    } else {
      // Navegar a resultados pasando el resultado en estado
      const finalAciertos = aciertos + (esCorrecta ? 0 : 0); // ya fue sumado al comprobar
      navigate(`/guias/${slug}/resultados`, {
        state: {
          total: totalPreguntas,
          aciertos: finalAciertos,
        },
      });
    }
  };

  return (
    <main
      id="contenido"
      className="max-w-[1440px] mx-auto px-4 md:px-12 lg:px-24 py-8 md:py-10 flex flex-col gap-8"
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
            {guia.titulo}
          </Link>{' '}
          <span aria-hidden="true">/</span>{' '}
          <span className="text-[#17324d] font-semibold" aria-current="page">
            Practicar
          </span>
        </nav>

        <div>
          <h1 className="text-[2rem] md:text-[2.333rem] font-bold leading-[1.2] text-[#17324d]">
            Pon en práctica lo aprendido
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

      {/* Cuadrícula de práctica: Pregunta (Izquierda) + Mensaje simulado (Derecha) */}
      <section
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        aria-label="Pregunta interactiva y mensaje simulado"
      >
        {/* Columna Izquierda: Pregunta y opciones */}
        <div className="lg:col-span-7 bg-white border border-[#d7e2e7] rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-sm">
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
            <div className="bg-[#dce7e7] h-[10px] rounded-full overflow-hidden w-full">
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

          {/* Opciones de respuesta */}
          <fieldset className="flex flex-col gap-4 border-none p-0 m-0">
            <legend className="sr-only">Opciones de respuesta</legend>

            {preguntaActual.opciones.map((opcion) => {
              const estaSeleccionada = opcionSeleccionada === opcion.id;
              const esLaCorrecta = opcion.id === preguntaActual.opcionCorrecta;

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
                  className={`flex items-start gap-4 p-4 md:p-5 rounded-xl border ${bordeColor} ${bgColor} cursor-pointer transition-all hover:bg-[#f8fafc]`}
                >
                  <input
                    type="radio"
                    name={`pregunta-${preguntaActual.id}`}
                    value={opcion.id}
                    checked={estaSeleccionada}
                    disabled={revisado}
                    onChange={() => setOpcionSeleccionada(opcion.id)}
                    className="sr-only"
                  />
                  <span
                    className={`flex items-center justify-center size-10 rounded-lg font-bold text-[1.111rem] border shrink-0 ${badgeColor}`}
                    aria-hidden="true"
                  >
                    {opcion.id}
                  </span>
                  <span className="text-[1.111rem] md:text-[1.222rem] text-[#17324d] font-medium pt-1 leading-normal">
                    {opcion.texto}
                  </span>
                </label>
              );
            })}
          </fieldset>

          {/* Panel de retroalimentación posterior a responder */}
          {revisado && (
            <div
              className={`p-6 rounded-2xl border-2 flex flex-col gap-2 ${
                esCorrecta
                  ? 'bg-[#e7f2ee] border-[#0d6258] text-[#0d6258]'
                  : 'bg-[#fff3d8] border-[#fde6b3] text-[#17324d]'
              }`}
              role="alert"
            >
              <p className="font-bold text-[1.222rem] flex items-center gap-2">
                <span aria-hidden="true">{esCorrecta ? '✓' : 'ℹ️'}</span>
                {esCorrecta
                  ? '¡Muy bien! Identificaste la respuesta segura.'
                  : 'Casi. Pero para eso estamos aprendiendo juntos.'}
              </p>
              <p className="text-[1.111rem] text-[#172b3a] leading-relaxed">
                {preguntaActual.explicacion}
              </p>
            </div>
          )}

          {/* Botón de acción: Comprobar o Continuar */}
          <div className="pt-2">
            {!revisado ? (
              <button
                type="button"
                onClick={comprobarRespuesta}
                disabled={!opcionSeleccionada}
                className={`inline-flex items-center justify-center min-h-14 px-8 py-4 font-semibold text-[1.111rem] rounded-xl transition-colors focus:outline-none focus:ring-4 focus:ring-[#0d6258]/30 ${
                  opcionSeleccionada
                    ? 'bg-[#0d6258] text-white hover:bg-[#09473f] cursor-pointer'
                    : 'bg-[#e3e9ed] text-[#526575] cursor-not-allowed'
                }`}
              >
                Comprobar respuesta
              </button>
            ) : (
              <button
                type="button"
                onClick={avanzarSiguientePregunta}
                className="inline-flex items-center justify-center min-h-14 px-8 py-4 font-semibold text-[1.111rem] text-white bg-[#0d6258] rounded-xl hover:bg-[#09473f] cursor-pointer transition-colors focus:outline-none focus:ring-4 focus:ring-[#0d6258]/30"
              >
                {esUltimaPregunta
                  ? 'Ver mis resultados →'
                  : 'Siguiente pregunta →'}
              </button>
            )}
          </div>
        </div>

        {/* Columna Derecha: Mensaje simulado asociado a la pregunta */}
        <div className="lg:col-span-5 bg-[#e7f2ee] border border-[#c2ded3] rounded-2xl p-6 md:p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <p className="text-[0.95rem] font-bold text-[#0d6258] uppercase tracking-wider">
              {preguntaActual.mensajeSimulado.titulo}
            </p>
            <span className="text-[0.85rem] font-semibold bg-[#0d6258]/10 text-[#0d6258] px-2.5 py-1 rounded-md">
              Simulado
            </span>
          </div>

          <div className="bg-white border border-[#d7e2e7] rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
            <p className="font-semibold text-[#17324d] text-[1.111rem]">
              {preguntaActual.mensajeSimulado.remitente}
            </p>

            <div className="bg-[#f1f5f5] rounded-xl p-5 flex flex-col gap-3 border border-[#e2e8f0]">
              <p className="text-[#172b3a] text-[1.111rem] leading-relaxed">
                {preguntaActual.mensajeSimulado.contenido}
              </p>
              {preguntaActual.mensajeSimulado.enlaceODetalle && (
                <p className="text-[#0d6258] font-mono text-[0.95rem] bg-white/70 px-3 py-1.5 rounded-lg border border-[#d7e2e7] inline-block self-start select-all">
                  {preguntaActual.mensajeSimulado.enlaceODetalle}
                </p>
              )}
            </div>

            {/* Señal de alerta destacada si se ha revisado o como guía */}
            {preguntaActual.mensajeSimulado.senalAlerta && (
              <div
                className={`rounded-xl px-4 py-3 text-[1rem] font-semibold flex items-center gap-2 ${
                  revisado
                    ? 'bg-[#fff3d8] text-[#17324d] border border-[#fde6b3]'
                    : 'bg-[#f1f5f5] text-[#526575]'
                }`}
              >
                <span>{preguntaActual.mensajeSimulado.senalAlerta}</span>
              </div>
            )}
          </div>

          <aside className="bg-white/80 border border-[#c2ded3] rounded-xl p-5 flex flex-col gap-1 text-[#17324d]">
            <p className="font-bold text-[1rem]">Tu tranquilidad primero</p>
            <p className="text-[0.95rem] text-[#526575]">
              Esta es una práctica pedagógica segura. No necesitas ingresar
              ningún dato real ni contraseñas.
            </p>
          </aside>
        </div>
      </section>

      {/* Cierre institucional */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-[#d7e2e7] text-[#526575]">
        <p className="text-[1rem]">
          Kamá · Aprende a tu ritmo. Estamos para acompañarte.
        </p>
        <Link
          to="/ayuda"
          className="inline-flex items-center gap-2 px-5 py-3 font-semibold text-[#0d6258] bg-white border border-[#0d6258] rounded-full hover:bg-[#e7f2ee] no-underline"
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
