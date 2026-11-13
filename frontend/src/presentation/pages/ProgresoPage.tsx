import { Link } from 'react-router';

export function ProgresoPage() {
  return (
    <main
      id="contenido"
      className="max-w-360 mx-auto px-gutter py-12 md:py-16 flex flex-col gap-6"
    >
      <p className="text-[1.111rem] font-semibold text-eyebrow">
        MI APRENDIZAJE
      </p>
      <h1 className="text-[2rem] md:text-[2.444rem] font-bold leading-[1.13] text-hero-title">
        Mi progreso
      </h1>
      <p className="text-[1.111rem] text-hero-text max-w-176">
        Aquí puedes ver las guías que has completado y las recomendaciones
        personalizadas para seguir avanzando.
      </p>
      <div className="p-8 bg-card-bg border-2 border-card-border rounded-2xl max-w-176 mt-2">
        <h2 className="text-[1.333rem] font-bold text-card-title">
          ¿Aún no has iniciado sesión?
        </h2>
        <p className="mt-2 text-card-text">
          Para guardar tu progreso de manera permanente y acceder desde
          cualquier equipo del CLENA, crea tu cuenta o inicia sesión.
        </p>
        <div className="flex flex-wrap gap-4 mt-6">
          <Link
            to="/registro"
            className="inline-flex items-center justify-center min-h-14 px-6 py-4 font-semibold text-btn-primary-fg bg-btn-primary-bg rounded-xl hover:bg-btn-primary-hover no-underline cursor-pointer border-2 border-btn-primary-border"
          >
            Crear cuenta gratuita
          </Link>
          <Link
            to="/iniciar-sesion"
            className="inline-flex items-center justify-center min-h-14 px-6 py-4 font-semibold text-btn-secondary-fg bg-btn-secondary-bg border-2 border-btn-secondary-border rounded-xl hover:border-btn-secondary-hover-border hover:bg-btn-secondary-hover-bg no-underline cursor-pointer"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </main>
  );
}
