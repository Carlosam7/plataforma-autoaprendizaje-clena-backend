import { Link } from 'react-router';

export function IniciarSesionPage() {
  return (
    <main
      id="contenido"
      className="max-w-360 mx-auto px-gutter py-12 md:py-16 flex flex-col gap-6"
    >
      <p className="text-[1.111rem] font-semibold text-eyebrow">ACCESO</p>
      <h1 className="text-[2rem] md:text-[2.444rem] font-bold leading-[1.13] text-hero-title">
        Iniciar sesión
      </h1>
      <p className="text-[1.111rem] text-hero-text max-w-176">
        Ingresa con tu correo o número de celular registrado para continuar tu
        proceso de aprendizaje.
      </p>
      <div className="p-8 bg-card-bg border-2 border-card-border rounded-[20px] max-w-176 mt-2">
        <p className="text-card-text">
          ¿Aún no tienes cuenta en Kamá? Es gratis y solo toma un par de
          minutos.
        </p>
        <div className="flex gap-4 mt-6">
          <Link
            to="/registro"
            className="inline-flex items-center justify-center min-h-14 px-6 py-4 font-semibold text-btn-primary-fg bg-btn-primary-bg rounded-xl hover:bg-btn-primary-hover no-underline cursor-pointer border-2 border-btn-primary-border"
          >
            Crear una cuenta nueva →
          </Link>
        </div>
      </div>
    </main>
  );
}
