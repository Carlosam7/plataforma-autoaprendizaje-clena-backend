import { Link } from 'react-router';

export function VerificarAccesoPage() {
  return (
    <main
      id="contenido"
      className="max-w-360 mx-auto px-gutter py-12 md:py-16 flex flex-col gap-6"
    >
      <p className="text-[1.111rem] font-semibold text-eyebrow">VERIFICACIÓN</p>
      <h1 className="text-[2rem] md:text-[2.444rem] font-bold leading-[1.13] text-hero-title">
        Ingresa tu código de verificación
      </h1>
      <p className="text-[1.111rem] text-hero-text max-w-176">
        Escribe los 6 números que enviamos a tu correo o celular para terminar
        de crear tu cuenta y comenzar.
      </p>
      <div className="p-8 bg-card-bg border-2 border-card-border rounded-[20px] max-w-176 mt-2">
        <p className="text-card-text">
          El campo para ingresar el código OTP de 6 dígitos estará disponible en
          esta vista.
        </p>
        <div className="flex gap-4 mt-6">
          <Link
            to="/registro"
            className="inline-flex items-center justify-center min-h-14 px-6 py-4 font-semibold text-btn-secondary-fg bg-btn-secondary-bg border-2 border-btn-secondary-border rounded-xl hover:border-btn-secondary-hover-border hover:bg-btn-secondary-hover-bg no-underline cursor-pointer"
          >
            ← Volver a crear cuenta
          </Link>
        </div>
      </div>
    </main>
  );
}
