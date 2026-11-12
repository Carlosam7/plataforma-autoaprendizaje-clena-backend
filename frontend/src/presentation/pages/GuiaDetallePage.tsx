import { Link, useParams } from 'react-router';

export function GuiaDetallePage() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <main
      id="contenido"
      className="max-w-360 mx-auto px-gutter py-12 md:py-16 flex flex-col gap-6"
    >
      <nav
        aria-label="Migas de pan"
        className="text-[0.95rem] font-medium text-muted"
      >
        <Link to="/" className="hover:underline">
          Inicio
        </Link>{' '}
        /{' '}
        <Link to="/guias" className="hover:underline">
          Guías
        </Link>{' '}
        / <span className="text-ink font-semibold capitalize">{slug}</span>
      </nav>
      <h1 className="text-[2rem] md:text-[2.444rem] font-bold leading-[1.13] text-hero-title capitalize">
        Guía: {slug?.replace(/-/g, ' ')}
      </h1>
      <p className="text-[1.111rem] text-hero-text max-w-176">
        Aprende paso a paso a identificar las señales de alerta y cómo actuar de
        manera segura.
      </p>
      <div className="flex gap-4 mt-4">
        <Link
          to={`/guias/${slug}/practica`}
          className="inline-flex items-center justify-center min-h-14 px-6 py-4 font-semibold text-btn-primary-fg bg-btn-primary-bg rounded-xl hover:bg-btn-primary-hover no-underline cursor-pointer border-2 border-btn-primary-border"
        >
          Ir a la práctica interactiva →
        </Link>
      </div>
    </main>
  );
}
