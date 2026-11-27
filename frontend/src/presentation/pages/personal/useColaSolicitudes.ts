import { useEffect, useState } from 'react';
import { ColaSolicitudError } from '@/domain/ayuda/erroresCola';
import type {
  EstadoSolicitud,
  SolicitudesPaginadas,
  TemaAyuda,
} from '@/domain/ayuda/solicitudCola';
import { container } from '@/main/container';

export const INTERVALO_POLLING_MS = 15_000;
export const LIMITE_POR_PAGINA = 20;

interface Resultado {
  /** Identifica la vista (sesión + filtros + página) a la que pertenece. */
  clave: string;
  datos: SolicitudesPaginadas | null;
  /** Total de la otra pestaña, solo para mostrar su contador. */
  totalOtraPestana: number | null;
  /** Instante (ms) de la última respuesta válida, para calcular esperas. */
  actualizadoEn: number;
  error: string | null;
  sesionExpirada: boolean;
}

export interface ColaSolicitudes {
  datos: SolicitudesPaginadas | null;
  totalOtraPestana: number | null;
  actualizadoEn: number;
  /** Primera carga de esta consulta (filtro/página nuevos); el polling no la activa. */
  cargando: boolean;
  error: string | null;
  sesionExpirada: boolean;
}

interface Opciones {
  token: string | null;
  estado: Extract<EstadoSolicitud, 'PENDIENTE' | 'EN_ATENCION'>;
  tema: TemaAyuda | null;
  pagina: number;
  /** Cambiarlo fuerza una consulta inmediata sin ocultar lo ya mostrado. */
  recarga: number;
}

/**
 * Consulta la cola real y la repite cada 15 s mientras la pantalla está montada.
 * Una respuesta de una consulta anterior nunca pisa a una más nueva: cada efecto
 * se desactiva al limpiarse, y solo hay una petición en vuelo por consulta.
 */
export function useColaSolicitudes({
  token,
  estado,
  tema,
  pagina,
  recarga,
}: Opciones): ColaSolicitudes {
  const clave = `${token ?? ''}|${estado}|${tema ?? ''}|${pagina}`;
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    if (!token) return;
    let activo = true;
    let enVuelo = false;
    const otra = estado === 'PENDIENTE' ? 'EN_ATENCION' : 'PENDIENTE';

    const consultar = async () => {
      if (enVuelo) return;
      enVuelo = true;
      try {
        const [principal, secundaria] = await Promise.all([
          container.ayuda.listarSolicitudes.ejecutar(token, {
            estado,
            tema: tema ?? undefined,
            pagina,
            limite: LIMITE_POR_PAGINA,
          }),
          container.ayuda.listarSolicitudes.ejecutar(token, {
            estado: otra,
            tema: tema ?? undefined,
            pagina: 1,
            limite: 1,
          }),
        ]);
        if (!activo) return;
        setResultado({
          clave,
          datos: principal,
          totalOtraPestana: secundaria.total,
          actualizadoEn: Date.now(),
          error: null,
          sesionExpirada: false,
        });
      } catch (err) {
        if (!activo) return;
        const expirada =
          err instanceof ColaSolicitudError && err.tipo === 'SESION';
        if (expirada) clearInterval(temporizador);
        setResultado((previo) => ({
          // Un fallo de polling conserva lo ya mostrado; uno inicial no inventa datos.
          clave,
          datos: previo?.clave === clave ? previo.datos : null,
          totalOtraPestana:
            previo?.clave === clave ? previo.totalOtraPestana : null,
          actualizadoEn: previo?.actualizadoEn ?? 0,
          error:
            err instanceof ColaSolicitudError
              ? err.message
              : 'No pudimos cargar las solicitudes.',
          sesionExpirada: expirada,
        }));
      } finally {
        enVuelo = false;
      }
    };

    const temporizador = setInterval(
      () => void consultar(),
      INTERVALO_POLLING_MS,
    );
    void consultar();
    return () => {
      activo = false;
      clearInterval(temporizador);
    };
  }, [clave, token, estado, tema, pagina, recarga]);

  const vigente = resultado?.clave === clave ? resultado : null;
  return {
    datos: vigente?.datos ?? null,
    totalOtraPestana: vigente?.totalOtraPestana ?? null,
    actualizadoEn: vigente?.actualizadoEn ?? 0,
    cargando: Boolean(token) && vigente === null,
    error: vigente?.error ?? null,
    sesionExpirada: vigente?.sesionExpirada ?? false,
  };
}
