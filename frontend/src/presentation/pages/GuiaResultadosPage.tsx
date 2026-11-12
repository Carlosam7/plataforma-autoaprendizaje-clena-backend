import { Link, useParams } from 'react-router';

export function GuiaResultadosPage() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <main
      id="contenido"
      className="max-w-360 mx-auto px-gutter py-12 md:py-16 flex flex-col gap-6"
    >
      <p className="text-[1.111rem] font-semibold text-eyebrow">
        RESULTADOS DE LA PRÁCTICA
      </p>
      <h1 className="text-[2rem] md:text-[2.444rem] font-bold leading-[1.13] text-hero-title">
        ¡Excelente esfuerzo!
      </h1>
      <p className="text-[1.111rem] text-hero-text max-w-176">
        Has completado la actividad de práctica para la guía de{' '}
        <span className="font-semibold capitalize">
          {slug?.replace(/-/g, ' ')}
        </span>
        . Puedes repasar la guía o continuar explorando más temas.
      </p>
      <div className="flex flex-wrap gap-4 mt-4">
        <Link
          to="/guias"
          className="inline-flex items-center justify-center min-h-14 px-6 py-4 font-semibold text-btn-primary-fg bg-btn-primary-bg rounded-xl hover:bg-btn-primary-hover no-underline cursor-pointer border-2 border-btn-primary-border"
        >
          Explorar otras guías
        </Link>
        <Link
          to="/mi-progreso"
          className="inline-flex items-center justify-center min-h-14 px-6 py-4 font-semibold text-btn-secondary-fg bg-btn-secondary-bg border-2 border-btn-secondary-border rounded-xl hover:border-btn-secondary-hover-border hover:bg-btn-secondary-hover-bg no-underline cursor-pointer"
        >
          Ver mi progreso
        </Link>
      </div>
    </main>
  );
}
