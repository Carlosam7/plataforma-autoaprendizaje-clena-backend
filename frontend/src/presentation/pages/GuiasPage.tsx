import { Link } from 'react-router';

export function GuiasPage() {
  return (
    <main
      id="contenido"
      className="max-w-360 mx-auto px-gutter py-12 md:py-16 flex flex-col gap-6"
    >
      <p className="text-[1.111rem] font-semibold text-eyebrow">
        CATÁLOGO DE GUÍAS
      </p>
      <h1 className="text-[2rem] md:text-[2.444rem] font-bold leading-[1.13] text-hero-title">
        Todas las guías de autoaprendizaje
      </h1>
      <p className="text-[1.111rem] text-hero-text max-w-176">
        Explora las guías disponibles para aprender a protegerte en línea con
        tranquilidad y a tu propio ritmo.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
        {[
          {
            slug: 'smishing',
            title: 'Smishing',
            desc: 'Mensajes falsos por SMS o WhatsApp.',
          },
          {
            slug: 'vishing',
            title: 'Vishing',
            desc: 'Llamadas telefónicas que buscan engañarte.',
          },
          {
            slug: 'quishing',
            title: 'Quishing',
            desc: 'Engaños que se esconden en códigos QR.',
          },
          {
            slug: 'falso-soporte-tecnico',
            title: 'Falso soporte técnico',
            desc: 'Alertas falsas y solicitudes de acceso al computador.',
          },
        ].map((g) => (
          <article
            key={g.slug}
            className="flex flex-col gap-4 p-6 bg-card-bg border-2 border-card-border rounded-[20px]"
          >
            <div className="w-14 h-14 bg-icon-bg border border-card-border/50 rounded-xl" />
            <h2 className="text-[1.333rem] font-bold leading-[1.45] text-card-title min-h-[2.9em]">
              {g.title}
            </h2>
            <p className="text-muted">{g.desc}</p>
            <Link
              to={`/guias/${g.slug}`}
              className="mt-auto w-full inline-flex items-center justify-center min-h-14 px-6 py-4 font-semibold text-btn-secondary-fg bg-btn-secondary-bg border-2 border-btn-secondary-border rounded-xl hover:border-btn-secondary-hover-border hover:bg-btn-secondary-hover-bg no-underline cursor-pointer"
            >
              Ver guía
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}
