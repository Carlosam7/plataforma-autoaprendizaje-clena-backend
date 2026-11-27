import { useId } from 'react';
import type { SolicitudEnCola } from '@/domain/cola/types';
import {
  MAX_COMENTARIO_RESOLUCION,
  minutosEsperando,
  nombreEquipo,
  nombreEquipoEnFrase,
  textoEspera,
} from '@/domain/cola/types';
import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from '@/presentation/ayuda/estilos';
import { ETIQUETAS_TEMA } from '@/presentation/ayuda/temas';

export interface TarjetaSolicitudColaProps {
  solicitud: SolicitudEnCola;
  ahora: Date;
  /** Puesto en la cola (1 = la siguiente); solo para las pendientes. */
  puesto?: number;
  /** El monitor de la sesión la tomó: puede resolverla. */
  esMia?: boolean;
  ocupado?: boolean;
  /** Mostrar el formulario de «resuelta» con su comentario. */
  resolviendo?: boolean;
  comentario?: string;
  onTomar?: () => void;
  onEmpezarResolver?: () => void;
  onComentario?: (valor: string) => void;
  onConfirmarResolver?: () => void;
  onCancelarResolver?: () => void;
}

/** HU-30: una solicitud en la cola del monitor, sin datos personales de quien pidió ayuda. */
export function TarjetaSolicitudCola({
  solicitud,
  ahora,
  puesto,
  esMia = false,
  ocupado = false,
  resolviendo = false,
  comentario = '',
  onTomar,
  onEmpezarResolver,
  onComentario,
  onConfirmarResolver,
  onCancelarResolver,
}: TarjetaSolicitudColaProps) {
  const id = useId();
  const pendiente = solicitud.estado === 'PENDIENTE';
  return (
    <article
      aria-labelledby={`${id}-equipo`}
      className="bg-surface border-2 border-border-subtle rounded-2xl p-5 flex flex-col gap-3"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3
          id={`${id}-equipo`}
          className="text-[1.333rem] font-bold text-navy m-0"
        >
          {puesto ? `${puesto}. ` : ''}
          {nombreEquipo(solicitud.equipo)}
        </h3>
        <p className="text-[1rem] font-semibold text-ink m-0">
          {pendiente
            ? textoEspera(minutosEsperando(solicitud, ahora))
            : `La atiende ${solicitud.atendidaPor ?? 'un monitor'}`}
        </p>
      </div>
      <p className="text-[1.111rem] text-ink m-0">
        Tema: <strong>{ETIQUETAS_TEMA[solicitud.tema]}</strong>
      </p>
      {solicitud.guia && (
        <p className="text-[1rem] text-muted m-0">
          Estaba en «{solicitud.guia.titulo}»
          {solicitud.paso ? `, paso ${solicitud.paso}` : ''}.
        </p>
      )}

      {pendiente && onTomar && (
        <div>
          <button
            type="button"
            onClick={onTomar}
            disabled={ocupado}
            className={BOTON_PRIMARIO}
          >
            Atender {nombreEquipoEnFrase(solicitud.equipo)}
          </button>
        </div>
      )}

      {!pendiente && esMia && !resolviendo && onEmpezarResolver && (
        <div>
          <button
            type="button"
            onClick={onEmpezarResolver}
            disabled={ocupado}
            className={BOTON_PRIMARIO}
          >
            Marcar como resuelta
          </button>
        </div>
      )}

      {!pendiente && esMia && resolviendo && (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            onConfirmarResolver?.();
          }}
        >
          <label
            htmlFor={`${id}-comentario`}
            className="font-semibold text-navy"
          >
            ¿Cómo se resolvió? (opcional)
          </label>
          <textarea
            id={`${id}-comentario`}
            value={comentario}
            maxLength={MAX_COMENTARIO_RESOLUCION}
            rows={3}
            aria-describedby={`${id}-ayuda-comentario`}
            onChange={(e) => onComentario?.(e.target.value)}
            className="p-3 text-[1.111rem] bg-white border-2 border-border-input rounded-xl text-ink focus:outline-none focus:ring-4 focus:ring-primary/20"
          />
          <p id={`${id}-ayuda-comentario`} className="text-muted m-0">
            Máximo {MAX_COMENTARIO_RESOLUCION} letras. No escribas datos
            personales.
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={ocupado} className={BOTON_PRIMARIO}>
              Confirmar que está resuelta
            </button>
            <button
              type="button"
              onClick={onCancelarResolver}
              disabled={ocupado}
              className={BOTON_SECUNDARIO}
            >
              Volver
            </button>
          </div>
        </form>
      )}
    </article>
  );
}
