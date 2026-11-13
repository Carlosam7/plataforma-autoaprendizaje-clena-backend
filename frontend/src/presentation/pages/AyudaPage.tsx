import { Link } from 'react-router';

export function AyudaPage() {
  return (
    <main
      id="contenido"
      className="max-w-360 mx-auto px-gutter py-12 md:py-16 flex flex-col gap-6"
    >
      <p className="text-[1.111rem] font-semibold text-eyebrow">
        ACOMPAÑAMIENTO CLENA
      </p>
      <h1 className="text-[2rem] md:text-[2.444rem] font-bold leading-[1.13] text-hero-title">
        Solicitar ayuda
      </h1>
      <p className="text-[1.111rem] text-hero-text max-w-176">
        No tienes que aprender a solas. Si algún paso o término no queda claro,
        un monitor de la Sala de Internet del CLENA puede acercarse y
        acompañarte.
      </p>
      <div className="p-8 bg-card-bg border-2 border-card-border rounded-2xl max-w-176 mt-2">
        <h2 className="text-[1.333rem] font-bold text-card-title">
          ¿En qué necesitas orientación hoy?
        </h2>
        <p className="mt-2 text-card-text">
          Puedes seleccionar el tema en el que deseas apoyo y levantar tu
          solicitud de forma sencilla.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center min-h-14 px-6 py-4 font-semibold text-btn-primary-fg bg-btn-primary-bg rounded-xl hover:bg-btn-primary-hover no-underline cursor-pointer border-2 border-btn-primary-border"
        >
          Regresar al inicio
        </Link>
      </div>
    </main>
  );
}
