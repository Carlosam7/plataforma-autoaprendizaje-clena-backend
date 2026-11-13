import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { AuthError, AuthValidationError } from '@/domain/auth/errors';
import { container } from '@/main/container';

export function IniciarSesionPage() {
  const navigate = useNavigate();

  const [numeroIdentificacion, setNumeroIdentificacion] = useState('');
  const [contacto, setContacto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorIdentificacion, setErrorIdentificacion] = useState<string | null>(
    null,
  );
  const [errorContacto, setErrorContacto] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorIdentificacion(null);
    setErrorContacto(null);
    setErrorGeneral(null);

    const docLimpio = numeroIdentificacion.trim();
    const contactoLimpio = contacto.trim();

    let hayErrores = false;

    if (!docLimpio) {
      setErrorIdentificacion('Escribe tu número de identificación.');
      hayErrores = true;
    }

    if (!contactoLimpio) {
      setErrorContacto('Escribe tu correo o tu número de celular.');
      hayErrores = true;
    }

    if (hayErrores) return;

    setEnviando(true);
    try {
      const resultado = await container.auth.solicitarInicioSesion.ejecutar({
        numeroIdentificacion: docLimpio,
        contacto: contactoLimpio,
      });

      // Redirigir a verificar código pasando los datos
      navigate('/registro/verificar', {
        state: {
          solicitudId: resultado.solicitudId || resultado.registroId,
          registroId: resultado.registroId,
          canal: resultado.canal,
          destino: resultado.destino,
          mensaje: resultado.mensaje,
          puedeReenviarEn: resultado.puedeReenviarEn.toISOString(),
          expiraEn: resultado.expiraEn.toISOString(),
          tipo: 'LOGIN',
          numeroIdentificacion: docLimpio,
          contacto: contactoLimpio,
        },
      });
    } catch (err) {
      setEnviando(false);
      if (err instanceof AuthValidationError) {
        if (err.campo === 'numeroIdentificacion') {
          setErrorIdentificacion(err.message);
        } else if (err.campo === 'contacto') {
          setErrorContacto(err.message);
        } else {
          setErrorGeneral(err.message);
        }
      } else if (err instanceof AuthError) {
        if (err.statusCode === 401 || err.statusCode === 404) {
          setErrorGeneral(
            'Los datos no coinciden con ninguna cuenta registrada. Revisa tu número de documento y correo o celular.',
          );
        } else {
          setErrorGeneral(err.message);
        }
      } else if (err instanceof Error) {
        setErrorGeneral(err.message);
      } else {
        setErrorGeneral(
          'No pudimos procesar tu solicitud. Intenta nuevamente.',
        );
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
        className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 md:px-24 py-8 md:py-12 w-full max-w-[1440px] mx-auto"
      >
        <div
          className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center justify-center w-full"
          data-node-id="4:4571"
          data-name="Acceso seguro"
        >
          {/* Columna Izquierda: 552px en escritorio */}
          <section
            aria-labelledby="titulo-aprender-cuenta"
            className="bg-[#e7f2ee] flex flex-col gap-6 items-start p-6 sm:p-8 md:p-10 rounded-3xl w-full lg:w-[552px] shrink-0"
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
              className="font-medium text-[#0d6258] text-[18px] md:text-[20px] flex flex-col gap-2"
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
              className="inline-flex items-center justify-center min-h-14 px-6 py-4 rounded-xl bg-white border border-[#d7e2e7] text-[#0d6258] font-semibold text-[18px] leading-[1.45] hover:border-[#0d6258] hover:bg-[#f1f5f9] transition-colors no-underline cursor-pointer"
            >
              Continuar sin cuenta
            </Link>
          </section>

          {/* Columna Derecha: Tarjeta de Iniciar sesión de 632px */}
          <section
            aria-labelledby="titulo-iniciar-sesion"
            className="bg-white border border-[#d7e2e7] flex flex-col gap-6 items-start p-6 sm:p-8 md:p-10 rounded-3xl w-full lg:w-[632px] shrink-0 shadow-sm"
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
                Te enviaremos un código a tu correo o celular. No necesitas
                recordar una contraseña.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col gap-6 w-full"
            >
              {/* Campo: Documento de identificación */}
              <div className="flex flex-col gap-2 w-full">
                <label
                  htmlFor="numeroIdentificacion"
                  className="font-semibold text-[#17324d] text-[18px] leading-[1.45]"
                >
                  Número de documento de identidad
                </label>
                <input
                  id="numeroIdentificacion"
                  name="numeroIdentificacion"
                  type="text"
                  inputMode="numeric"
                  required
                  aria-required="true"
                  aria-invalid={Boolean(errorIdentificacion)}
                  aria-describedby={
                    errorIdentificacion ? 'error-doc ayuda-doc' : 'ayuda-doc'
                  }
                  value={numeroIdentificacion}
                  onChange={(e) => {
                    setNumeroIdentificacion(e.target.value);
                    if (errorIdentificacion) setErrorIdentificacion(null);
                    if (errorGeneral) setErrorGeneral(null);
                  }}
                  placeholder="Por ejemplo: 41234567"
                  className="w-full min-h-15 p-4 bg-white text-[#17324d] text-[18px] border border-[#869ba9] rounded-xl placeholder:text-[#526575] focus:outline-none focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]"
                />
                <p
                  id="ayuda-doc"
                  className="font-normal text-[#526575] text-[16px] leading-[1.45] m-0"
                >
                  El número de cédula o documento con el que te registraste.
                </p>
                {errorIdentificacion && (
                  <div
                    id="error-doc"
                    role="alert"
                    className="w-full bg-[#fff3d8] flex flex-col gap-1 p-4 rounded-xl text-[#17324d]"
                  >
                    <p className="font-semibold text-[18px] m-0">
                      Revisa tu número de documento
                    </p>
                    <p className="font-normal text-[16px] m-0">
                      {errorIdentificacion}
                    </p>
                  </div>
                )}
              </div>

              {/* Campo: Correo o celular */}
              <div className="flex flex-col gap-2 w-full" data-node-id="4:4102">
                <label
                  htmlFor="contacto"
                  className="font-semibold text-[#17324d] text-[18px] leading-[1.45]"
                >
                  Correo electrónico o número de celular
                </label>
                <input
                  id="contacto"
                  name="contacto"
                  type="text"
                  autoComplete="username"
                  required
                  aria-required="true"
                  aria-invalid={Boolean(errorContacto)}
                  aria-describedby={
                    errorContacto
                      ? 'error-contacto ayuda-contacto'
                      : 'ayuda-contacto'
                  }
                  value={contacto}
                  onChange={(e) => {
                    setContacto(e.target.value);
                    if (errorContacto) setErrorContacto(null);
                    if (errorGeneral) setErrorGeneral(null);
                  }}
                  placeholder="Por ejemplo: ana@correo.com o 3001234567"
                  className="w-full min-h-15 p-4 bg-white text-[#17324d] text-[18px] border border-[#869ba9] rounded-xl placeholder:text-[#526575] focus:outline-none focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]"
                  data-node-id="4:4104"
                />
                <p
                  id="ayuda-contacto"
                  className="font-normal text-[#526575] text-[16px] leading-[1.45] m-0"
                  data-node-id="4:4586"
                >
                  Escribe tu correo o celular para recibir el código de acceso.
                </p>
                {errorContacto && (
                  <div
                    id="error-contacto"
                    role="alert"
                    className="w-full bg-[#fff3d8] flex flex-col gap-1 p-4 rounded-xl text-[#17324d]"
                    data-node-id="4:6312"
                    data-name="Validación del contacto"
                  >
                    <p
                      className="font-semibold text-[18px] m-0"
                      data-node-id="4:6318"
                    >
                      Revisa tu correo o celular
                    </p>
                    <p
                      className="font-normal text-[16px] m-0"
                      data-node-id="4:6319"
                    >
                      {errorContacto}
                    </p>
                  </div>
                )}
              </div>

              {/* Error General */}
              {errorGeneral && (
                <div
                  role="alert"
                  className="w-full bg-[#fff3d8] border border-[#d97706] flex flex-col gap-1 p-4 rounded-xl text-[#17324d]"
                >
                  <p className="font-semibold text-[18px] m-0">Atención</p>
                  <p className="font-normal text-[16px] m-0">{errorGeneral}</p>
                </div>
              )}

              {/* Botón principal */}
              <button
                type="submit"
                disabled={enviando}
                className="w-full sm:w-auto inline-flex items-center justify-center min-h-14 px-6 py-4 rounded-xl bg-[#0d6258] text-white font-semibold text-[18px] leading-[1.45] hover:bg-[#09493f] transition-colors cursor-pointer border-none disabled:opacity-50"
                data-node-id="4:4587"
              >
                {enviando ? 'Enviando código...' : 'Enviar código de acceso'}
              </button>

              {/* Botón secundario */}
              <Link
                to="/registro"
                className="w-full sm:w-auto inline-flex items-center justify-center min-h-14 px-6 py-4 rounded-xl bg-white border border-[#d7e2e7] text-[#0d6258] font-semibold text-[18px] leading-[1.45] hover:border-[#0d6258] hover:bg-[#f1f5f9] transition-colors no-underline cursor-pointer"
                data-node-id="4:4588"
              >
                Crear una cuenta
              </Link>

              {/* Enlace para personal institucional */}
              <div className="pt-2 border-t border-[#e2e8f0] w-full text-center">
                <Link
                  to="/personal/acceso"
                  className="text-[#0d6258] hover:underline font-semibold text-[1rem]"
                >
                  ¿Eres personal o monitor del CLENA? Ingreso de equipo →
                </Link>
              </div>
            </form>
          </section>
        </div>
      </main>

      {/* Cierre / Pie institucional según Figma */}
      <footer
        className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 md:px-24 py-6 flex flex-wrap gap-6 items-center justify-between"
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
          className="inline-flex items-center gap-2.5 min-h-12.5 px-5 py-3.5 rounded-full bg-white border border-[#0d6258] text-[#0d6258] font-semibold text-[18px] hover:bg-[#e7f2ee] transition-colors no-underline"
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
