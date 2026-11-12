import { useAccessibility } from './context';

/** Franja de accesibilidad del encabezado, tal como está en el Figma: A−, A+ y Alto contraste. */
export function AccessibilityBar() {
  const {
    preferences: p,
    announcement,
    increaseFont,
    decreaseFont,
    toggleContrast,
  } = useAccessibility();

  return (
    <div
      className="flex items-center gap-2 md:gap-3 px-gutter py-1 bg-tint"
      role="region"
      aria-label="Ajustes de lectura"
    >
      <p className="hidden md:block flex-1 font-medium text-primary">
        Un espacio para aprender con tranquilidad
      </p>
      {/* aria-disabled en vez de disabled: el foco no se pierde al llegar al límite. */}
      <button
        type="button"
        className="min-h-[44px] px-2.5 py-2 font-semibold text-navy bg-transparent border-2 border-transparent rounded-lg cursor-pointer hover:bg-white aria-pressed:bg-white aria-pressed:border-navy aria-disabled:opacity-45 aria-disabled:cursor-not-allowed"
        aria-label="Reducir letra"
        aria-disabled={!p.canDecreaseFont}
        onClick={p.canDecreaseFont ? decreaseFont : undefined}
      >
        A−
      </button>
      <button
        type="button"
        className="min-h-[44px] px-2.5 py-2 font-semibold text-navy bg-transparent border-2 border-transparent rounded-lg cursor-pointer hover:bg-white aria-pressed:bg-white aria-pressed:border-navy aria-disabled:opacity-45 aria-disabled:cursor-not-allowed"
        aria-label="Aumentar letra"
        aria-disabled={!p.canIncreaseFont}
        onClick={p.canIncreaseFont ? increaseFont : undefined}
      >
        A+
      </button>
      <button
        type="button"
        className="min-h-[44px] px-2.5 py-2 font-semibold text-navy bg-transparent border-2 border-transparent rounded-lg cursor-pointer hover:bg-white aria-pressed:bg-white aria-pressed:border-navy aria-disabled:opacity-45 aria-disabled:cursor-not-allowed"
        aria-pressed={p.highContrast}
        onClick={toggleContrast}
      >
        Alto contraste
      </button>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
