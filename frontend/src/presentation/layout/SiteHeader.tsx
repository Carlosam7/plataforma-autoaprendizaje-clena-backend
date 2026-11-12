import { AccessibilityBar } from '@/presentation/accessibility/AccessibilityBar';

export function SiteHeader() {
  return (
    <header className="flex flex-col bg-white">
      <AccessibilityBar />
      <nav
        className="-order-1 md:order-0 flex items-center gap-3 md:gap-8 px-gutter py-4 md:py-5.5"
        aria-label="Principal"
      >
        <a
          className="text-[1.778rem] md:text-[2.111rem] font-bold text-primary no-underline leading-[1.45]"
          href="/"
          aria-label="Kamá, inicio"
        >
          kamá
        </a>
        <p className="hidden md:block flex-1 text-muted">
          Aprender para cuidarte
        </p>
        <a
          className="hidden md:inline-flex items-center min-h-11 font-medium text-navy no-underline hover:underline hover:underline-offset-[0.2em]"
          href="/"
        >
          Inicio
        </a>
        <a
          className="hidden md:inline-flex items-center min-h-11 font-medium text-navy no-underline hover:underline hover:underline-offset-[0.2em]"
          href="/guias"
        >
          Guías
        </a>
        <a
          className="hidden md:inline-flex items-center min-h-11 font-medium text-navy no-underline hover:underline hover:underline-offset-[0.2em]"
          href="/mi-progreso"
        >
          Mi progreso
        </a>
        <a
          className="hidden md:inline-flex items-center min-h-11 font-medium text-navy no-underline hover:underline hover:underline-offset-[0.2em]"
          href="/ayuda"
        >
          Ayuda
        </a>
        <a
          className="hidden md:inline-flex items-center justify-center min-h-14 px-6 py-4 font-semibold text-primary bg-white border border-border-subtle rounded-xl hover:border-primary no-underline cursor-pointer"
          href="/iniciar-sesion"
        >
          Iniciar sesión
        </a>
        <a
          className="inline-flex md:hidden ml-auto font-semibold text-primary no-underline"
          href="/ayuda"
        >
          ? Ayuda
        </a>
      </nav>
    </header>
  );
}
