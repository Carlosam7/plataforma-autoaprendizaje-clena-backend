import type { Ref } from 'react';
import type { SolicitudAyuda } from '@/domain/ayuda/types';
import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from './estilos';
import { ETIQUETAS_TEMA } from './temas';

const HORA = new Intl.DateTimeFormat('es-CO', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/Bogota',
});

const TITULOS: Record<SolicitudAyuda['estado'], string> = {
  PENDIENTE: 'Un monitor vendrá pronto',
  EN_ATENCION: 'Un monitor ya viene a tu puesto',
  RESUELTA: 'Tu solicitud fue atendida',
  CANCELADA: 'Cancelaste tu solicitud',
};

export interface EstadoSolicitudAyudaProps {
  solicitud: SolicitudAyuda;
  /** Este navegador ya la había pedido (respuesta 200 de C-05). */
  yaExistia: boolean;
  /** Aviso no bloqueante: no se pudo actualizar, o la cancelación cambió de estado. */
  aviso: string | null;
  confirmandoCancelacion: boolean;
  cancelando: boolean;
  onPedirCancelacion: () => void;
  onConfirmarCancelacion: () => void;
  onSeguirEsperando: () => void;
  onPedirOtraVez: () => void;
  /** El foco va al título al aparecer, para que el lector de pantalla lo anuncie. */
  tituloRef?: Ref<HTMLHeadingElement>;
}

/** HU-29 · Lo que ve quien pidió ayuda mientras espera, y al terminar. */
export function EstadoSolicitudAyuda({
  solicitud,
  yaExistia,
  aviso,
  confirmandoCancelacion,
  cancelando,
  onPedirCancelacion,
  onConfirmarCancelacion,
  onSeguirEsperando,
  onPedirOtraVez,
  tituloRef,
}: EstadoSolicitudAyudaProps) {
  const { estado, posicion } = solicitud;
  const cerrada = estado === 'RESUELTA' || estado === 'CANCELADA';

  return (
    <section
      aria-labelledby="titulo-estado-ayuda"
      className="p-6 md:p-8 bg-card-bg border-2 border-card-border rounded-2xl max-w-176 flex flex-col gap-4"
    >
      {/* Región viva: cada cambio de estado se anuncia sin mover el foco. */}
      <div role="status" aria-live="polite" className="flex flex-col gap-3">
        <h2
          id="titulo-estado-ayuda"
          ref={tituloRef}
          tabIndex={-1}
          className="text-[1.556rem] font-bold text-card-title"
        >
          {TITULOS[estado]}
        </h2>
        {estado === 'PENDIENTE' && posicion !== null && (
          <p className="text-[1.333rem] font-semibold text-card-title">
            Tu lugar en la fila: {posicion}
          </p>
        )}
        {estado === 'PENDIENTE' && (
          <p className="text-card-text">
            Quédate en tu puesto. Esta página se actualiza sola.
          </p>
        )}
        {estado === 'EN_ATENCION' && (
          <p className="text-card-text">
            Quédate en tu puesto: el monitor ya sabe dónde estás.
          </p>
        )}
        {yaExistia && !cerrada && (
          <p className="p-4 bg-notice text-ink rounded-xl">
            Ya habías pedido ayuda desde este computador. Seguimos con esa misma
            solicitud.
          </p>
        )}
        {aviso && <p className="p-4 bg-notice text-ink rounded-xl">{aviso}</p>}
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-card-text">
        <dt className="font-semibold">Equipo:</dt>
        <dd>{solicitud.equipo}</dd>
        <dt className="font-semibold">Tema:</dt>
        <dd>{ETIQUETAS_TEMA[solicitud.tema]}</dd>
        <dt className="font-semibold">Pediste ayuda a las:</dt>
        <dd>{HORA.format(new Date(solicitud.creadaEn))}</dd>
      </dl>

      {estado === 'PENDIENTE' && !confirmandoCancelacion && (
        <div>
          <button
            type="button"
            className={BOTON_SECUNDARIO}
            onClick={onPedirCancelacion}
          >
            Ya no necesito ayuda
          </button>
        </div>
      )}

      {estado === 'PENDIENTE' && confirmandoCancelacion && (
        <div
          role="group"
          aria-labelledby="pregunta-cancelar"
          className="flex flex-col gap-3 p-4 border-2 border-card-border rounded-xl"
        >
          <p id="pregunta-cancelar" className="font-semibold text-card-title">
            ¿Ya resolviste tu duda? Si cancelas, el monitor no vendrá.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={BOTON_PRIMARIO}
              onClick={onConfirmarCancelacion}
              disabled={cancelando}
              aria-busy={cancelando}
            >
              {cancelando ? 'Cancelando…' : 'Sí, cancelar mi solicitud'}
            </button>
            <button
              type="button"
              className={BOTON_SECUNDARIO}
              onClick={onSeguirEsperando}
              disabled={cancelando}
            >
              No, seguir esperando
            </button>
          </div>
        </div>
      )}

      {cerrada && (
        <div>
          <button
            type="button"
            className={BOTON_PRIMARIO}
            onClick={onPedirOtraVez}
          >
            Pedir ayuda otra vez
          </button>
        </div>
      )}
    </section>
  );
}
