import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import type {
  CalificacionPractica,
  ResultadoPractica,
} from '../../domain/guias/types';
import { container } from '../../main/container';
import { rutaAyuda } from '@/presentation/ayuda/rutaAyuda';

export interface ResultadosLocationState {
  resultado?: CalificacionPractica | null;
  totalPreguntas?: number;
  respuestasCorrectas?: number;
  porcentaje?: number;
  aprobado?: boolean;
  porcentajeAprobacion?: number;
  total?: number;
  aciertos?: number;
  umbralAprobacion?: number;
  esInvitado?: boolean;
  modo?: 'REGISTRADO' | 'INVITADO';
}

function esCalificacionValida(valor: unknown): valor is CalificacionPractica {
  if (!valor || typeof valor !== 'object') return false;
  const c = valor as Partial<CalificacionPractica>;
  return (
    typeof c.totalPreguntas === 'number' &&
    Number.isInteger(c.totalPreguntas) &&
    c.totalPreguntas > 0 &&
    typeof c.respuestasCorrectas === 'number' &&
    Number.isInteger(c.respuestasCorrectas) &&
    c.respuestasCorrectas >= 0 &&
    c.respuestasCorrectas <= c.totalPreguntas &&
    typeof c.porcentaje === 'number' &&
    Number.isFinite(c.porcentaje) &&
    typeof c.aprobado === 'boolean' &&
    typeof c.porcentajeAprobacion === 'number' &&
    c.porcentajeAprobacion >= 1 &&
    c.porcentajeAprobacion <= 100
  );
}

function extraerResultadoPractica(
  slug: string,
  rawState: unknown,
): ResultadoPractica | null {
  if (!rawState || typeof rawState !== 'object') {
    return null;
  }

  const state = rawState as ResultadosLocationState;
  if (esCalificacionValida(state.resultado)) {
    return container.guias.calcularResultado.desdeCalificacion(
      slug,
      state.resultado,
    );
  }

  const totalPreguntas = state.totalPreguntas ?? state.total;
  const respuestasCorrectas = state.respuestasCorrectas ?? state.aciertos;
  const porcentajeAprobacion =
    state.porcentajeAprobacion ?? state.umbralAprobacion ?? 70;

  if (
    typeof totalPreguntas !== 'number' ||
    !Number.isInteger(totalPreguntas) ||
    totalPreguntas <= 0 ||
    typeof respuestasCorrectas !== 'number' ||
    !Number.isInteger(respuestasCorrectas) ||
    respuestasCorrectas < 0 ||
    respuestasCorrectas > totalPreguntas
  ) {
    return null;
  }

  if (
    typeof state.porcentaje === 'number' &&
    Number.isFinite(state.porcentaje) &&
    typeof state.aprobado === 'boolean' &&
    porcentajeAprobacion >= 1 &&
    porcentajeAprobacion <= 100
  ) {
    return container.guias.calcularResultado.desdeCalificacion(slug, {
      respuestasCorrectas,
      totalPreguntas,
      porcentaje: state.porcentaje,
      aprobado: state.aprobado,
      porcentajeAprobacion,
    });
  }

  return container.guias.calcularResultado.ejecutar({
    guiaSlug: slug,
    totalPreguntas,
    respuestasCorrectas,
    porcentajeAprobacion,
  });
}

function resolverEsInvitadoInicial(
  state: ResultadosLocationState | null,
): boolean | undefined {
  if (!state) return undefined;
  if (typeof state.esInvitado === 'boolean') return state.esInvitado;
  if (state.modo === 'REGISTRADO') return false;
  if (state.modo === 'INVITADO') return true;
  return undefined;
}

export function GuiaResultadosPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const rawState = location.state as ResultadosLocationState | null;
  const esInvitadoInicial = resolverEsInvitadoInicial(rawState);

  const [esInvitado, setEsInvitado] = useState<boolean>(
    esInvitadoInicial ?? true,
  );

  useEffect(() => {
    if (esInvitadoInicial !== undefined) return;
    let activo = true;
    container.auth.authRepository
      .obtenerSesion()
      .then((sesion) => {
        if (!activo) return;
        setEsInvitado(!sesion || sesion.usuario.rol !== 'USUARIO_PUBLICO');
      })
      .catch(() => {
        if (activo) setEsInvitado(true);
      });
    return () => {
      activo = false;
    };
  }, [esInvitadoInicial]);

  const guiaSlug = slug ?? '';
  const resultado = guiaSlug
    ? extraerResultadoPractica(guiaSlug, rawState)
    : null;

  const rutaPractica = guiaSlug ? `/guias/${guiaSlug}/practica` : '/guias';
  const rutaGuia = guiaSlug ? `/guias/${guiaSlug}` : '/guias';

  if (!resultado) {
    return (
      <main
        id="contenido"
        className="max-w-[1440px] mx-auto px-4 md:px-12 lg:px-24 py-12 md:py-16 flex flex-col items-center"
      >
        <div className="w-full max-w-[720px] bg-white border border-[#d7e2e7] rounded-3xl p-8 md:p-12 flex flex-col items-center text-center gap-6 shadow-sm">
          <h1 className="text-[2rem] md:text-[2.333rem] font-bold text-[#17324d] leading-tight">
            No hay un resultado disponible
          </h1>
          <p className="text-[1.111rem] text-[#526575] max-w-[520px]">
            Completa primero la actividad práctica de esta guía para conocer tus
            aciertos y tu retroalimentación.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              to={rutaPractica}
              className="inline-flex items-center justify-center min-h-14 px-8 py-4 font-semibold text-white bg-[#0d6258] rounded-xl hover:bg-[#09473f] no-underline cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#0d6258]/30"
            >
              Volver a la práctica
            </Link>
            <Link
              to={rutaGuia}
              className="inline-flex items-center justify-center min-h-14 px-8 py-4 font-semibold text-[#17324d] bg-white border border-[#d7e2e7] rounded-xl hover:bg-[#f1f5f5] no-underline cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#17324d]/20"
            >
              Volver a la guía
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      id="contenido"
      className="max-w-[1440px] mx-auto px-4 md:px-12 lg:px-24 py-12 md:py-16 flex flex-col items-center"
    >
      <div className="w-full max-w-[880px] bg-white border border-[#d7e2e7] rounded-3xl p-8 md:p-12 flex flex-col gap-8 shadow-sm">
        {/* Encabezado del resultado */}
        <div className="flex flex-col gap-3">
          <span className="inline-flex items-center gap-2 text-[1rem] font-bold text-[#0d6258] uppercase tracking-wider">
            <span aria-hidden="true">✓</span> PRÁCTICA COMPLETADA
          </span>
          <h1 className="text-[2.222rem] md:text-[2.666rem] font-bold text-[#17324d] leading-tight">
            {resultado.aprobado
              ? '¡Vas por muy buen camino!'
              : '¡Buen intento! Cada práctica suma.'}
          </h1>
          <p className="text-[1.222rem] text-[#526575]">
            {resultado.aprobado
              ? 'Ya reconoces las principales señales de alerta de los mensajes sospechosos.'
              : 'Identificar engaños digitales requiere práctica. Puedes repasar la guía y volver a intentarlo.'}
          </p>
        </div>

        {/* Cajas de métricas de desempeño */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-[#e7f2ee] rounded-2xl p-6 flex flex-col justify-center border border-[#c2ded3]">
            <p className="text-[2.444rem] md:text-[2.888rem] font-bold text-[#0d6258] leading-none">
              {resultado.respuestasCorrectas} de {resultado.totalPreguntas}
            </p>
            <p className="text-[1.111rem] font-medium text-[#253b38] mt-2">
              respuestas correctas
            </p>
          </div>

          <div
            className={`rounded-2xl p-6 flex flex-col justify-center border ${
              resultado.aprobado
                ? 'bg-[#e7f2ee] border-[#c2ded3]'
                : 'bg-[#fff3d8] border-[#fde6b3]'
            }`}
          >
            <p
              className={`text-[2.444rem] md:text-[2.888rem] font-bold leading-none ${
                resultado.aprobado ? 'text-[#0d6258]' : 'text-[#b45309]'
              }`}
            >
              {resultado.porcentaje} %
            </p>
            <p className="text-[1.111rem] font-medium text-[#17324d] mt-2">
              {resultado.aprobado ? 'Actividad aprobada' : 'Por reforzar'}
            </p>
          </div>
        </div>

        {/* Regla y consejo pedagógico */}
        <div className="flex flex-col gap-4 text-[#526575] text-[1.111rem] border-t border-b border-[#e2e8f0] py-6">
          <p>
            Se aprueba con al menos el {resultado.porcentajeAprobacion} %. Con{' '}
            {resultado.totalPreguntas} preguntas, necesitas al menos{' '}
            {Math.ceil(
              (resultado.totalPreguntas * resultado.porcentajeAprobacion) / 100,
            )}{' '}
            aciertos.
          </p>
          <p className="text-[#17324d] font-semibold">
            Recuerda siempre: detente, no abras enlaces apresurados y verifica
            cualquier duda por los canales oficiales que conoces.
          </p>
        </div>

        {/* Invitación opcional a crear cuenta (AC-HU03-02), solo para invitados */}
        {esInvitado && (
          <div className="bg-[#f8fafc] border border-[#d7e2e7] rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-[#17324d] text-[1.111rem]">
                ¿Quieres guardar este logro?
              </p>
              <p className="text-[#526575] text-[0.95rem]">
                Crea tu cuenta gratuita para registrar tu avance y retomar
                cuando vuelvas a la sala.
              </p>
            </div>
            <Link
              to="/registro"
              className="inline-flex items-center justify-center min-h-12 px-6 py-2.5 font-semibold text-[#0d6258] bg-white border border-[#0d6258] rounded-xl hover:bg-[#e7f2ee] no-underline shrink-0"
            >
              Crear cuenta
            </Link>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-4 pt-2">
          <Link
            to={rutaPractica}
            className="inline-flex items-center justify-center min-h-14 px-8 py-4 font-semibold text-white bg-[#0d6258] rounded-xl hover:bg-[#09473f] no-underline cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#0d6258]/30"
          >
            Repetir práctica
          </Link>

          <Link
            to={rutaGuia}
            className="inline-flex items-center justify-center min-h-14 px-8 py-4 font-semibold text-[#17324d] bg-white border border-[#d7e2e7] rounded-xl hover:bg-[#f1f5f5] no-underline cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#17324d]/20"
          >
            Volver a la guía
          </Link>

          <Link
            to="/mi-progreso"
            className="inline-flex items-center justify-center min-h-14 px-6 py-4 font-semibold text-[#526575] hover:text-[#17324d] hover:underline no-underline"
          >
            Ver mi progreso
          </Link>
        </div>
      </div>

      {/* Cierre institucional */}
      <footer className="w-full max-w-[880px] flex flex-col sm:flex-row items-center justify-between gap-4 py-8 mt-6 border-t border-[#d7e2e7] text-[#526575]">
        <p className="text-[1rem]">
          Kamá · Aprende a tu ritmo. Estamos para acompañarte.
        </p>
        <Link
          to={rutaAyuda(slug)}
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
