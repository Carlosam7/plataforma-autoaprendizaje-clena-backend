import { Link, NavLink } from 'react-router';
import { AccessibilityBar } from '@/presentation/accessibility/AccessibilityBar';

export function SiteHeader() {
  const linkBase =
    'hidden md:inline-flex items-center min-h-11 font-medium text-nav-link no-underline hover:underline hover:underline-offset-[0.2em]';

  return (
    <header className="flex flex-col bg-header-bg border-b border-header-border">
      <AccessibilityBar />
      <nav
        className="-order-1 md:order-0 flex items-center gap-3 md:gap-8 px-gutter py-4 md:py-5.5"
        aria-label="Principal"
      >
        <Link
          className="text-[1.778rem] md:text-[2.111rem] font-bold text-nav-logo no-underline leading-[1.45]"
          to="/"
          aria-label="Kamá, inicio"
        >
          kamá
        </Link>
        <p className="hidden md:block flex-1 text-muted">
          Aprender para cuidarte
        </p>
        <NavLink
          className={({ isActive }) =>
            `${linkBase} ${isActive ? 'underline underline-offset-[0.2em]' : ''}`
          }
          to="/"
          end
        >
          Inicio
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            `${linkBase} ${isActive ? 'underline underline-offset-[0.2em]' : ''}`
          }
          to="/guias"
        >
          Guías
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            `${linkBase} ${isActive ? 'underline underline-offset-[0.2em]' : ''}`
          }
          to="/mi-progreso"
        >
          Mi progreso
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            `${linkBase} ${isActive ? 'underline underline-offset-[0.2em]' : ''}`
          }
          to="/ayuda"
        >
          Ayuda
        </NavLink>
        <Link
          className="hidden md:inline-flex items-center justify-center min-h-14 px-6 py-4 font-semibold text-btn-secondary-fg bg-btn-secondary-bg border-2 border-btn-secondary-border rounded-xl hover:border-btn-secondary-hover-border hover:bg-btn-secondary-hover-bg no-underline cursor-pointer"
          to="/iniciar-sesion"
        >
          Iniciar sesión
        </Link>
        <Link
          className="inline-flex md:hidden ml-auto font-semibold text-nav-logo no-underline"
          to="/ayuda"
        >
          ? Ayuda
        </Link>
      </nav>
    </header>
  );
}
