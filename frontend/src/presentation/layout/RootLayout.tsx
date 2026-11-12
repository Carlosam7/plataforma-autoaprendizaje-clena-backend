import { Link, Outlet } from 'react-router';
import { SiteHeader } from './SiteHeader';

export function RootLayout() {
  return (
    <>
      <a
        className="absolute left-2 -top-20 focus:top-2 z-50 px-4 py-3 bg-surface text-ink font-semibold border-2 border-border rounded-xl no-underline"
        href="#contenido"
      >
        Saltar al contenido
      </a>
      <SiteHeader />
      <div className="flex-1">
        <Outlet />
      </div>
      <footer className="flex items-center justify-between gap-6 flex-wrap px-gutter py-8 bg-footer-bg text-footer-fg border-t border-footer-border">
        <div>
          <p className="text-[1.333rem] font-bold">
            No tienes que aprender a solas.
          </p>
          <p className="mt-2 text-footer-fg/90">
            Si algo no está claro, un monitor del CLENA puede acompañarte.
          </p>
          <p className="mt-4 font-medium text-footer-fg/80">
            Kamá · Centro de Lectura y Escritura del Norte
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center min-h-14 px-6 py-4 font-semibold text-btn-secondary-fg bg-btn-secondary-bg border-2 border-btn-secondary-border rounded-xl hover:border-btn-secondary-hover-border hover:bg-btn-secondary-hover-bg no-underline cursor-pointer"
          to="/ayuda"
        >
          Solicitar ayuda
        </Link>
      </footer>
    </>
  );
}
