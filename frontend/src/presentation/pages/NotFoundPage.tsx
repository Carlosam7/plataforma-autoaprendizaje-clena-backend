import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <main
      id="contenido"
      className="max-w-360 mx-auto px-gutter py-16 md:py-24 flex flex-col items-start gap-6"
    >
      <p className="text-[1.111rem] font-semibold text-eyebrow">ERROR 404</p>
      <h1 className="text-[2rem] md:text-[2.444rem] font-bold leading-[1.13] text-hero-title">
        Página no encontrada
      </h1>
      <p className="text-[1.111rem] text-hero-text max-w-176">
        La dirección que intentas abrir no existe o cambió de lugar. Puedes
        regresar al inicio para continuar aprendiendo con calma.
      </p>
      <Link
        to="/"
        className="inline-flex items-center justify-center min-h-14 px-6 py-4 font-semibold text-btn-primary-fg bg-btn-primary-bg rounded-xl hover:bg-btn-primary-hover no-underline cursor-pointer border-2 border-btn-primary-border"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
