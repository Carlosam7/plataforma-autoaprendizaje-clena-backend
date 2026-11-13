import { useEffect, useRef, useState } from 'react';
import type { AvisoPrivacidad } from '@/domain/auth/types';
import { container } from '@/main/container';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export function AvisoPrivacidadModal({ isOpen, onClose, onAccept }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [aviso, setAviso] = useState<AvisoPrivacidad | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      dialogRef.current?.close();
      return;
    }

    dialogRef.current?.showModal();

    let activo = true;

    // Solo consultar si aún no tenemos el aviso cargado
    if (!aviso) {
      void (async () => {
        try {
          const data = await container.auth.obtenerAvisoPrivacidad.ejecutar();
          if (activo) {
            setAviso(data);
            setCargando(false);
          }
        } catch (err) {
          if (activo) {
            setError(
              err instanceof Error
                ? err.message
                : 'No pudimos cargar el aviso de privacidad en este momento.',
            );
            setCargando(false);
          }
        }
      })();
    }

    return () => {
      activo = false;
    };
  }, [isOpen, aviso]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="titulo-aviso-privacidad"
      className="backdrop:bg-black/60 fixed inset-0 m-auto max-w-2xl w-[calc(100%-2rem)] max-h-[85vh] p-0 rounded-2xl bg-surface border-2 border-border shadow-2xl overflow-hidden z-50 text-ink"
    >
      <div className="flex flex-col h-full max-h-[85vh]">
        {/* Encabezado del modal */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-tint/30">
          <div>
            <h2
              id="titulo-aviso-privacidad"
              className="text-[1.333rem] md:text-[1.556rem] font-bold text-navy"
            >
              Aviso de Privacidad (Ley 1581 de 2012)
            </h2>
            {aviso?.version && (
              <p className="text-sm text-muted mt-1">
                Versión vigente: {aviso.version}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-11 min-h-11 flex items-center justify-center rounded-xl border border-border text-navy hover:bg-tint font-bold text-xl cursor-pointer"
            aria-label="Cerrar ventana de aviso de privacidad"
          >
            ✕
          </button>
        </div>

        {/* Contenido desplazable */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-ink leading-relaxed">
          {cargando && (
            <p className="text-muted py-8 text-center animate-pulse">
              Cargando términos del aviso de privacidad...
            </p>
          )}

          {error && (
            <div
              role="alert"
              className="p-4 bg-notice border-2 border-primary/30 rounded-xl text-ink"
            >
              <p className="font-semibold text-primary">Información:</p>
              <p className="mt-1 text-sm">{error}</p>
              <p className="mt-2 text-sm text-muted">
                De conformidad con la Ley Estatutaria 1581 de 2012 de Protección
                de Datos Personales de Colombia, tus datos se usarán
                exclusivamente para la gestión educativa y registro de tu
                aprendizaje en la plataforma Kamá del CLENA.
              </p>
            </div>
          )}

          {aviso && !cargando && (
            <div className="whitespace-pre-wrap text-[1.05rem] text-ink">
              {aviso.contenido}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="p-6 border-t border-border bg-surface flex flex-wrap gap-4 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-14 px-6 py-3 font-semibold text-btn-secondary-fg bg-btn-secondary-bg border-2 border-btn-secondary-border rounded-xl hover:border-btn-secondary-hover-border hover:bg-btn-secondary-hover-bg cursor-pointer"
          >
            Cerrar
          </button>
          {onAccept && (
            <button
              type="button"
              onClick={() => {
                onAccept();
                onClose();
              }}
              className="min-h-14 px-6 py-3 font-semibold text-btn-primary-fg bg-btn-primary-bg rounded-xl hover:bg-btn-primary-hover cursor-pointer"
            >
              Aceptar y continuar
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}
