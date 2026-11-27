import { Link, Outlet, useLocation } from 'react-router';
import { modoDemo } from '../../main/container';
import { SiteHeader } from './SiteHeader';

export function RootLayout() {
  const location = useLocation();
  const esRutaAuth =
    location.pathname.startsWith('/registro') ||
    location.pathname === '/iniciar-sesion';

  return (
    <>
      <a
        className="absolute left-2 -top-20 focus:top-2 z-50 px-4 py-3 bg-surface text-ink font-semibold border-2 border-border rounded-xl no-underline"
        href="#contenido"
      >
        Saltar al contenido
      </a>
      {modoDemo && (
        <p
          role="status"
          className="m-0 px-4 py-2 text-center font-semibold bg-[#fff4cc] text-[#17324d] border-b-2 border-[#e0b400]"
        >
          Modo demostración: los datos que ves son simulados y no vienen del
          servidor.
        </p>
      )}
      <SiteHeader />
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>
      {!esRutaAuth && (
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
      )}
    </>
  );
}
