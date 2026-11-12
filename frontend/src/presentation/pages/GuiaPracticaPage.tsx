import { Link, useParams } from 'react-router';

export function GuiaPracticaPage() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <main
      id="contenido"
      className="max-w-360 mx-auto px-gutter py-12 md:py-16 flex flex-col gap-6"
    >
      <p className="text-[1.111rem] font-semibold text-eyebrow">
        PRÁCTICA INTERACTIVA
      </p>
      <h1 className="text-[2rem] md:text-[2.444rem] font-bold leading-[1.13] text-hero-title capitalize">
        Practicar: {slug?.replace(/-/g, ' ')}
      </h1>
      <p className="text-[1.111rem] text-hero-text max-w-176">
        Pon a prueba lo aprendido identificando si el caso presentado es un
        intento de engaño real o una comunicación legítima.
      </p>
      <div className="flex gap-4 mt-4">
        <Link
          to={`/guias/${slug}/resultados`}
          className="inline-flex items-center justify-center min-h-14 px-6 py-4 font-semibold text-btn-primary-fg bg-btn-primary-bg rounded-xl hover:bg-btn-primary-hover no-underline cursor-pointer border-2 border-btn-primary-border"
        >
          Finalizar y ver resultados →
        </Link>
      </div>
    </main>
  );
}
