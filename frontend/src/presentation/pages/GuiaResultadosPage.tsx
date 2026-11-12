import { Link, useLocation, useParams } from 'react-router';
import { container } from '../../main/container';

export function GuiaResultadosPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();

  // Obtener estado recibido de la práctica o valores por defecto
  const state = (location.state as { total?: number; aciertos?: number }) || {};
  const totalPreguntas = state.total ?? 5;
  const aciertos = state.aciertos ?? 4;

  const resultado = container.guias.calcularResultado.ejecutar({
    guiaSlug: slug ?? 'smishing',
    totalPreguntas,
    aciertos,
    umbralAprobacion: 70,
  });

  return (
    <main
      id="contenido"
      className="max-w-[1440px] mx-auto px-4 md:px-12 lg:px-24 py-12 md:py-16 flex flex-col items-center"
    >
      <div className="w-full max-w-[880px] bg-white border border-[#d7e2e7] rounded-[24px] p-8 md:p-12 flex flex-col gap-8 shadow-sm">
        {/* Encabezado del resultado */}
        <div className="flex flex-col gap-3">
          <span className="inline-flex items-center gap-2 text-[1rem] font-bold text-[#0d6258] uppercase tracking-wider">
            <span aria-hidden="true">✓</span> PRÁCTICA COMPLETADA
          </span>
          <h1 className="text-[2.222rem] md:text-[2.666rem] font-bold text-[#17324d] leading-tight">
            {resultado.aprobada
              ? '¡Vas por muy buen camino!'
              : '¡Buen intento! Cada práctica suma.'}
          </h1>
          <p className="text-[1.222rem] text-[#526575]">
            {resultado.aprobada
              ? 'Ya reconoces las principales señales de alerta de los mensajes sospechosos.'
              : 'Identificar engaños digitales requiere práctica. Puedes repasar la guía y volver a intentarlo.'}
          </p>
        </div>

        {/* Cajas de métricas de desempeño */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-[#e7f2ee] rounded-2xl p-6 flex flex-col justify-center border border-[#c2ded3]">
            <p className="text-[2.444rem] md:text-[2.888rem] font-bold text-[#0d6258] leading-none">
              {resultado.aciertos} de {resultado.totalPreguntas}
            </p>
            <p className="text-[1.111rem] font-medium text-[#253b38] mt-2">
              respuestas correctas
            </p>
          </div>

          <div
            className={`rounded-2xl p-6 flex flex-col justify-center border ${
              resultado.aprobada
                ? 'bg-[#e7f2ee] border-[#c2ded3]'
                : 'bg-[#fff3d8] border-[#fde6b3]'
            }`}
          >
            <p
              className={`text-[2.444rem] md:text-[2.888rem] font-bold leading-none ${
                resultado.aprobada ? 'text-[#0d6258]' : 'text-[#b45309]'
              }`}
            >
              {resultado.porcentaje} %
            </p>
            <p className="text-[1.111rem] font-medium text-[#17324d] mt-2">
              {resultado.aprobada ? 'Actividad aprobada' : 'Por reforzar'}
            </p>
          </div>
        </div>

        {/* Regla y consejo pedagógico */}
        <div className="flex flex-col gap-4 text-[#526575] text-[1.111rem] border-t border-b border-[#e2e8f0] py-6">
          <p>
            Se aprueba con al menos el {resultado.umbralAprobacion} %. Con{' '}
            {resultado.totalPreguntas} preguntas, necesitas al menos{' '}
            {Math.ceil(
              (resultado.totalPreguntas * resultado.umbralAprobacion) / 100,
            )}{' '}
            aciertos.
          </p>
          <p className="text-[#17324d] font-semibold">
            Recuerda siempre: detente, no abras enlaces apresurados y verifica
            cualquier duda por los canales oficiales que conoces.
          </p>
        </div>

        {/* Invitación opcional a crear cuenta (AC-HU03-02) */}
        <div className="bg-[#f8fafc] border border-[#d7e2e7] rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-[#17324d] text-[1.111rem]">
              ¿Quieres guardar este logro?
            </p>
            <p className="text-[#526575] text-[0.95rem]">
              Crea tu cuenta gratuita para registrar tu avance y retomar cuando
              vuelvas a la sala.
            </p>
          </div>
          <Link
            to="/registro"
            className="inline-flex items-center justify-center min-h-[48px] px-6 py-2.5 font-semibold text-[#0d6258] bg-white border border-[#0d6258] rounded-xl hover:bg-[#e7f2ee] no-underline shrink-0"
          >
            Crear cuenta
          </Link>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-4 pt-2">
          <Link
            to="/mi-progreso"
            className="inline-flex items-center justify-center min-h-[56px] px-8 py-4 font-semibold text-white bg-[#0d6258] rounded-xl hover:bg-[#09473f] no-underline cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#0d6258]/30"
          >
            Ver mi progreso
          </Link>

          <Link
            to={`/guias/${slug}/practica`}
            className="inline-flex items-center justify-center min-h-[56px] px-8 py-4 font-semibold text-[#17324d] bg-white border border-[#d7e2e7] rounded-xl hover:bg-[#f1f5f5] no-underline cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#17324d]/20"
          >
            Repetir práctica
          </Link>

          <Link
            to="/guias"
            className="inline-flex items-center justify-center min-h-[56px] px-6 py-4 font-semibold text-[#526575] hover:text-[#17324d] hover:underline no-underline"
          >
            Explorar otras guías
          </Link>
        </div>
      </div>

      {/* Cierre institucional */}
      <footer className="w-full max-w-[880px] flex flex-col sm:flex-row items-center justify-between gap-4 py-8 mt-6 border-t border-[#d7e2e7] text-[#526575]">
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
