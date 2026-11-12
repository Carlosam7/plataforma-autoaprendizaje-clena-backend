import { Link } from 'react-router';

// Textos del frame «01 · Inicio». Falta la ilustración del hero y los íconos de las guías:
// son recursos del Figma que se descargan al repo en el siguiente paso.
const GUIDES = [
  {
    n: '01',
    slug: 'smishing',
    title: 'Smishing',
    desc: 'Mensajes falsos por SMS o WhatsApp.',
    time: '8 minutos',
  },
  {
    n: '02',
    slug: 'vishing',
    title: 'Vishing',
    desc: 'Llamadas telefónicas que buscan engañarte.',
    time: '7 minutos',
  },
  {
    n: '03',
    slug: 'quishing',
    title: 'Quishing',
    desc: 'Engaños que se esconden en códigos QR.',
    time: '6 minutos',
  },
  {
    n: '04',
    slug: 'falso-soporte-tecnico',
    title: 'Falso soporte técnico',
    desc: 'Alertas falsas y solicitudes de acceso al computador.',
    time: '10 minutos',
  },
];

export function HomePage() {
  return (
    <main id="contenido" className="max-w-360 mx-auto">
      <section
        className="px-gutter pt-10 md:pt-24 pb-8 md:pb-12 flex flex-col gap-4 max-w-176"
        aria-labelledby="hero-title"
      >
        <p className="text-[1.111rem] font-semibold text-eyebrow">
          BIENVENIDO A KAMÁ
        </p>
        <h1
          id="hero-title"
          className="text-[2rem] md:text-[2.444rem] font-bold leading-[1.13] text-hero-title"
        >
          Aprende a protegerte de los engaños digitales
        </h1>
        <p className="text-[1.111rem] text-hero-text">
          Conoce las señales de un fraude y aprende a navegar con más seguridad,
          paso a paso.
        </p>
        <Link
          className="self-start inline-flex items-center justify-center min-h-14 px-6 py-4 font-semibold text-btn-primary-fg bg-btn-primary-bg rounded-xl hover:bg-btn-primary-hover no-underline cursor-pointer border-2 border-btn-primary-border"
          to="/guias"
        >
          Comenzar a aprender →
        </Link>
        <p className="text-[1.111rem] font-medium text-eyebrow">
          Sin costo. Sin experiencia previa. Sin registro obligatorio.
        </p>
      </section>

      <section
        className="px-gutter py-8 md:py-12"
        aria-labelledby="que-aprenderas"
      >
        <h2
          id="que-aprenderas"
          className="text-[1.556rem] font-bold text-hero-title"
        >
          ¿Qué aprenderás?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-[minmax(10rem,1fr)_4fr] gap-6 mt-6 p-6 md:p-8 bg-card-bg border-2 border-card-border rounded-[20px]">
          <div>
            <p className="font-medium text-muted">01 / CATEGORÍA</p>
            <p className="text-[1.556rem] font-bold text-card-title">
              Phishing
            </p>
          </div>
          <div>
            <h3 className="text-[1.333rem] font-bold text-card-title">
              Reconoce los engaños antes de actuar.
            </h3>
            <p className="mt-2 text-card-text">
              Algunas personas se hacen pasar por alguien de confianza para
              pedirte datos o dinero. Aprende a reconocer sus señales en
              mensajes, llamadas, códigos QR y alertas falsas.
            </p>
          </div>
        </div>
      </section>

      <section
        className="px-gutter py-8 md:py-12"
        aria-labelledby="guias-titulo"
      >
        <h2
          id="guias-titulo"
          className="text-[1.556rem] font-bold text-hero-title"
        >
          Cuatro guías para sentirte más seguro
        </h2>
        <p className="mt-2 text-hero-text">
          Elige por dónde empezar. Puedes repetir cada guía las veces que
          quieras.
        </p>
        <ul className="list-none m-0 p-0 mt-6 grid gap-5 grid-cols-[repeat(auto-fit,minmax(15rem,1fr))]">
          {GUIDES.map((g) => (
            <li key={g.n}>
              <article className="flex flex-col gap-4 h-full p-6 bg-card-bg border-2 border-card-border rounded-[20px]">
                <div className="flex justify-between items-start">
                  <div
                    className="w-14 h-14 bg-icon-bg border border-card-border/50 rounded-xl"
                    aria-hidden="true"
                  />
                  <span className="font-medium text-muted">{g.n}</span>
                </div>
                <h3 className="text-[1.333rem] font-bold leading-[1.45] text-card-title min-h-[2.9em]">
                  {g.title}
                </h3>
                <p className="text-muted">{g.desc}</p>
                <p className="font-medium text-muted">{g.time} · A tu ritmo</p>
                <Link
                  className="mt-auto w-full inline-flex items-center justify-center min-h-14 px-6 py-4 font-semibold text-btn-secondary-fg bg-btn-secondary-bg border-2 border-btn-secondary-border rounded-xl hover:border-btn-secondary-hover-border hover:bg-btn-secondary-hover-bg no-underline cursor-pointer"
                  to={`/guias/${g.slug}`}
                >
                  Comenzar guía
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
