import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { container } from '@/main/container';

export function IniciarSesionPage() {
  const navigate = useNavigate();

  const [correo, setCorreo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorCorreo, setErrorCorreo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCorreo(null);

    const correoLimpio = correo.trim().toLowerCase();

    if (!correoLimpio || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) {
      setErrorCorreo(
        'Escribe una dirección completa, por ejemplo: ana@correo.com.',
      );
      return;
    }

    setEnviando(true);
    try {
      const resultado =
        await container.auth.solicitarInicioSesion.ejecutar(correoLimpio);

      // Redirigir a verificar código pasando los datos
      navigate('/registro/verificar', {
        state: {
          registroId: resultado.registroId,
          canal: resultado.canal,
          destino: resultado.destino,
          mensaje: resultado.mensaje,
          puedeReenviarEn: resultado.puedeReenviarEn.toISOString(),
          expiraEn: resultado.expiraEn.toISOString(),
        },
      });
    } catch (err) {
      setEnviando(false);
      if (err instanceof Error) {
        setErrorCorreo(err.message);
      } else {
        setErrorCorreo('No pudimos procesar tu solicitud. Intenta nuevamente.');
      }
    }
  };

  return (
    <div
      className="bg-[#f8fafc] flex-1 flex flex-col justify-between"
      data-node-id="4:3970"
      data-name="05 · Iniciar sesión"
    >
      {/* Sección principal de Acceso */}
      <main
        id="contenido"
        className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 md:px-[96px] py-[32px] md:py-[48px] w-full max-w-[1440px] mx-auto"
      >
        <div
          className="flex flex-col lg:flex-row gap-8 lg:gap-[64px] items-center justify-center w-full"
          data-node-id="4:4571"
          data-name="Acceso seguro"
        >
          {/* Columna Izquierda: 552px en escritorio */}
          <section
            aria-labelledby="titulo-aprender-cuenta"
            className="bg-[#e7f2ee] flex flex-col gap-[24px] items-start p-6 sm:p-8 md:p-[40px] rounded-[24px] w-full lg:w-[552px] shrink-0"
            data-node-id="4:4572"
            data-name="Aprender con cuenta"
          >
            <p
              className="font-semibold text-[#0d6258] text-[18px] leading-[1.45] tracking-wide m-0"
              data-node-id="4:4573"
            >
              APRENDE A TU RITMO
            </p>
            <h1
              id="titulo-aprender-cuenta"
              className="font-bold text-[#17324d] text-[32px] sm:text-[36px] md:text-[40px] leading-[1.15] m-0"
              data-node-id="4:4574"
            >
              Vuelve a aprender con tranquilidad.
            </h1>
            <p
              className="font-normal text-[#526575] text-[20px] md:text-[22px] leading-[1.45] m-0"
              data-node-id="4:4575"
            >
              En Kamá encontrarás explicaciones sencillas, prácticas seguras y
              ayuda cuando la necesites.
            </p>
            <div
              className="font-medium text-[#0d6258] text-[18px] md:text-[20px] flex flex-col gap-[8px]"
              data-node-id="4:4576"
            >
              <p className="leading-[1.45] m-0">✓ Guarda tus avances</p>
              <p className="leading-[1.45] m-0">✓ Retoma donde te quedaste</p>
              <p className="leading-[1.45] m-0">
                ✓ Repite las guías cuando quieras
              </p>
            </div>
            <Link
              to="/guias"
              className="inline-flex items-center justify-center min-h-[56px] px-[24px] py-[16px] rounded-[12px] bg-white border border-[#d7e2e7] text-[#0d6258] font-semibold text-[18px] leading-[1.45] hover:border-[#0d6258] hover:bg-[#f1f5f9] transition-colors no-underline cursor-pointer"
            >
              Continuar sin cuenta
            </Link>
          </section>

          {/* Columna Derecha: Tarjeta de Iniciar sesión de 632px */}
          <section
            aria-labelledby="titulo-iniciar-sesion"
            className="bg-white border border-[#d7e2e7] flex flex-col gap-[24px] items-start p-6 sm:p-8 md:p-[40px] rounded-[24px] w-full lg:w-[632px] shrink-0 shadow-sm"
            data-node-id="4:4579"
            data-name="Iniciar sesión"
          >
            <div>
              <h2
                id="titulo-iniciar-sesion"
                className="font-bold text-[#17324d] text-[30px] md:text-[36px] leading-[1.2] m-0"
                data-node-id="4:4580"
              >
                Iniciar sesión
              </h2>
              <p
                className="font-normal text-[#526575] text-[18px] md:text-[20px] leading-[1.45] mt-2 mb-0"
                data-node-id="4:4581"
              >
                Te enviaremos un código a tu correo. No necesitas recordar una
                contraseña.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col gap-[24px] w-full"
            >
              {/* Campo: Correo electrónico */}
              <div
                className="flex flex-col gap-[8px] w-full"
                data-node-id="4:4102"
              >
                <label
                  htmlFor="correo"
                  className="font-semibold text-[#17324d] text-[18px] leading-[1.45]"
                >
                  Correo electrónico
                </label>
                <input
                  id="correo"
                  name="correo"
                  type="email"
                  autoComplete="email"
                  required
                  aria-required="true"
                  aria-invalid={Boolean(errorCorreo)}
                  value={correo}
                  onChange={(e) => {
                    setCorreo(e.target.value);
                    if (errorCorreo) setErrorCorreo(null);
                  }}
                  placeholder="nombre@correo.com"
                  className="w-full min-h-[60px] p-[16px] bg-white text-[#17324d] text-[18px] border border-[#869ba9] rounded-[12px] placeholder:text-[#526575] focus:outline-none focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]"
                  data-node-id="4:4104"
                />
              </div>

              {/* Texto de ayuda debajo del campo */}
              <p
                className="font-normal text-[#526575] text-[18px] leading-[1.45] m-0"
                data-node-id="4:4586"
              >
                Por ejemplo: ana@correo.com
              </p>

              {/* Caja de validación de error de correo (Figma nodo 4:6312) */}
              {errorCorreo && (
                <div
                  role="alert"
                  className="w-full bg-[#fff3d8] flex flex-col gap-[10px] items-start p-[20px] rounded-[12px] text-[#17324d]"
                  data-node-id="4:6312"
                  data-name="Validación del correo"
                >
                  <p
                    className="font-semibold text-[20px] w-full m-0"
                    data-node-id="4:6318"
                  >
                    Revisa tu correo electrónico.
                  </p>
                  <p
                    className="font-normal text-[18px] w-full m-0"
                    data-node-id="4:6319"
                  >
                    {errorCorreo}
                  </p>
                </div>
              )}

              {/* Botón principal */}
              <button
                type="submit"
                disabled={enviando}
                className="w-full sm:w-auto inline-flex items-center justify-center min-h-[56px] px-[24px] py-[16px] rounded-[12px] bg-[#0d6258] text-white font-semibold text-[18px] leading-[1.45] hover:bg-[#09493f] transition-colors cursor-pointer border-none disabled:opacity-50"
                data-node-id="4:4587"
              >
                {enviando ? 'Enviando código...' : 'Enviar código de acceso'}
              </button>

              {/* Botón secundario */}
              <Link
                to="/registro"
                className="w-full sm:w-auto inline-flex items-center justify-center min-h-[56px] px-[24px] py-[16px] rounded-[12px] bg-white border border-[#d7e2e7] text-[#0d6258] font-semibold text-[18px] leading-[1.45] hover:border-[#0d6258] hover:bg-[#f1f5f9] transition-colors no-underline cursor-pointer"
                data-node-id="4:4588"
              >
                Crear una cuenta
              </Link>
            </form>
          </section>
        </div>
      </main>

      {/* Cierre / Pie institucional según Figma */}
      <footer
        className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 md:px-[96px] py-[24px] flex flex-wrap gap-[24px] items-center justify-between"
        data-node-id="4:3973"
        data-name="Cierre"
      >
        <p
          className="font-normal text-[#526575] text-[18px] leading-[1.45] m-0"
          data-node-id="4:4640"
        >
          Kamá · Centro de Lectura y Escritura del Norte
        </p>
        <Link
          to="/ayuda"
          className="inline-flex items-center gap-[10px] min-h-[50px] px-[20px] py-[14px] rounded-[28px] bg-white border border-[#0d6258] text-[#0d6258] font-semibold text-[18px] hover:bg-[#e7f2ee] transition-colors no-underline"
          data-node-id="4:4108"
          data-name="Ayuda"
        >
          <span
            className="font-bold text-[20px]"
            aria-hidden="true"
            data-node-id="4:4109"
          >
            ?
          </span>
          <span data-node-id="4:4110">Necesito ayuda</span>
        </Link>
      </footer>
    </div>
  );
}
