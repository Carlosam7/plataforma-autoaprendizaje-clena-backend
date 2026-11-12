import { SiteHeader } from './layout/SiteHeader';
import { HomePage } from './pages/HomePage';

// Provisional hasta tener el router: renderiza el Inicio del diseño.
export function App() {
  return (
    <>
      <a
        className="absolute left-2 -top-20 focus:top-2 z-50 px-4 py-3 bg-white text-navy font-semibold border-2 border-navy rounded-xl no-underline"
        href="#contenido"
      >
        Saltar al contenido
      </a>
      <SiteHeader />
      <HomePage />
      <footer className="flex items-center justify-between gap-6 flex-wrap px-gutter py-8 bg-footer-bg text-white">
        <div>
          <p className="text-[1.333rem] font-bold">
            No tienes que aprender a solas.
          </p>
          <p className="mt-2">
            Si algo no está claro, un monitor del CLENA puede acompañarte.
          </p>
          <p className="mt-4 font-medium">
            Kamá · Centro de Lectura y Escritura del Norte
          </p>
        </div>
        <a
          className="inline-flex items-center justify-center min-h-14 px-6 py-4 font-semibold text-primary bg-white border border-border-subtle rounded-xl hover:border-primary no-underline cursor-pointer"
          href="/ayuda"
        >
          Solicitar ayuda
        </a>
      </footer>
    </>
  );
}
