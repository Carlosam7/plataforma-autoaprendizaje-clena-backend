import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { container } from '@/main/container';
import type { CanalVerificacion } from '@/domain/auth/types';
import { AvisoPrivacidadModal } from '@/presentation/auth/AvisoPrivacidadModal';

export function CrearCuentaPage() {
  const navigate = useNavigate();

  // Estados de los campos del formulario (AC-HU01-01)
  const [nombre, setNombre] = useState('');
  const [numeroIdentificacion, setNumeroIdentificacion] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [canalVerificacion, setCanalVerificacion] =
    useState<CanalVerificacion>('CORREO');
  const [aceptaAvisoPrivacidad, setAceptaAvisoPrivacidad] = useState(false);

  // Estados auxiliares
  const [modalAvisoAbierto, setModalAvisoAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const tieneCorreo = Boolean(correo.trim());
  const tieneTelefono = Boolean(telefono.trim());
  const mostrarSelectorCanal = tieneCorreo && tieneTelefono;

  // Fecha máxima para el input date (hoy)
  const hoyStr = new Date().toISOString().slice(0, 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGeneral(null);

    const nombreLimpio = nombre.trim();
    const docLimpio = numeroIdentificacion.trim().replace(/[\s.-]/g, '');
    const fechaLimpia = fechaNacimiento.trim();
    const correoLimpio = correo.trim().toLowerCase();
    const telLimpio = telefono.trim();

    if (!nombreLimpio || nombreLimpio.length < 2) {
      setErrorGeneral('Escribe tu nombre completo para comenzar.');
      return;
    }

    if (!docLimpio || docLimpio.length < 4 || docLimpio.length > 15) {
      setErrorGeneral(
        'Escribe tu número de identificación sin puntos ni espacios (entre 4 y 15 caracteres).',
      );
      return;
    }

    if (!fechaLimpia || !/^\d{4}-\d{2}-\d{2}$/.test(fechaLimpia)) {
      setErrorGeneral(
        'Escribe tu fecha de nacimiento con el formato año-mes-día, por ejemplo 1955-08-21.',
      );
      return;
    }

    if (!correoLimpio && !telLimpio) {
      setErrorGeneral(
        'Escribe al menos un medio de contacto (correo electrónico o número de celular).',
      );
      return;
    }

    if (correoLimpio && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) {
      setErrorGeneral(
        'Escribe un correo electrónico válido, por ejemplo nombre@correo.com.',
      );
      return;
    }

    if (telLimpio) {
      const digitos = telLimpio.replace(/[\s\-().]/g, '');
      const digitosSinPrefijo = digitos.startsWith('+57')
        ? digitos.slice(3)
        : digitos.startsWith('57') && digitos.length === 12
          ? digitos.slice(2)
          : digitos;

      if (!/^3\d{9}$/.test(digitosSinPrefijo)) {
        setErrorGeneral(
          'Escribe un número de celular de 10 dígitos que empiece por 3, por ejemplo 300 123 4567.',
        );
        return;
      }
    }

    if (!aceptaAvisoPrivacidad) {
      setErrorGeneral(
        'Para crear tu cuenta debes leer y aceptar el aviso de privacidad.',
      );
      return;
    }

    setEnviando(true);
    try {
      const canalSeleccionado: CanalVerificacion = mostrarSelectorCanal
        ? canalVerificacion
        : tieneCorreo
          ? 'CORREO'
          : 'TELEFONO';

      const resultado = await container.auth.solicitarRegistro.ejecutar({
        nombre: nombreLimpio,
        numeroIdentificacion: docLimpio,
        fechaNacimiento: fechaLimpia,
        correo: correoLimpio || undefined,
        telefono: telLimpio || undefined,
        canalVerificacion: canalSeleccionado,
        aceptaAvisoPrivacidad: true,
      });

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
        setErrorGeneral(err.message);
      } else {
        setErrorGeneral(
          'Ocurrió un error inesperado. Por favor intenta nuevamente.',
        );
      }
    }
  };

  return (
    <div
      className="bg-[#f8fafc] flex-1 flex flex-col justify-between"
      data-node-id="4:3974"
      data-name="06 · Crear cuenta"
    >
      {/* Sección principal de Registro */}
      <main
        id="contenido"
        className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 md:px-24 py-8 md:py-12 w-full max-w-[1440px] mx-auto"
      >
        <div
          className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start justify-center w-full"
          data-node-id="4:4591"
          data-name="Acceso seguro"
        >
          {/* Columna Izquierda: Información de acompañamiento */}
          <section
            aria-labelledby="titulo-aprender-cuenta"
            className="bg-[#e7f2ee] flex flex-col gap-6 items-start p-6 sm:p-8 md:p-10 rounded-3xl w-full lg:w-[480px] shrink-0 lg:sticky lg:top-8"
            data-node-id="4:4592"
            data-name="Aprender con cuenta"
          >
            <p
              className="font-semibold text-[#0d6258] text-[18px] leading-[1.45] tracking-wide m-0"
              data-node-id="4:4593"
            >
              APRENDE A TU RITMO
            </p>
            <h1
              id="titulo-aprender-cuenta"
              className="font-bold text-[#17324d] text-[32px] sm:text-[36px] md:text-[40px] leading-[1.15] m-0"
              data-node-id="4:4594"
            >
              Tu aprendizaje, siempre contigo.
            </h1>
            <p
              className="font-normal text-[#526575] text-[20px] md:text-[22px] leading-[1.45] m-0"
              data-node-id="4:4595"
            >
              En Kamá encontrarás explicaciones sencillas, prácticas seguras y
              ayuda cuando la necesites.
            </p>
            <div
              className="font-medium text-[#0d6258] text-[18px] md:text-[20px] flex flex-col gap-2"
              data-node-id="4:4596"
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
              data-node-id="4:4597"
            >
              Continuar sin cuenta
            </Link>
          </section>

          {/* Columna Derecha: Tarjeta de formulario */}
          <section
            aria-labelledby="titulo-crea-cuenta"
            className="bg-white border border-[#d7e2e7] flex flex-col gap-6 items-start p-6 sm:p-8 md:p-10 rounded-3xl w-full lg:w-[680px] shrink-0 shadow-sm"
            data-node-id="4:4599"
            data-name="Crea tu cuenta"
          >
            <div>
              <h2
                id="titulo-crea-cuenta"
                className="font-bold text-[#17324d] text-[30px] md:text-[36px] leading-[1.2] m-0"
                data-node-id="4:4600"
              >
                Crea tu cuenta
              </h2>
              <p
                className="font-normal text-[#526575] text-[18px] md:text-[20px] leading-[1.45] mt-2 mb-0"
                data-node-id="4:4601"
              >
                Ingresa tus datos para registrarte y recibir tu código de
                acceso.
              </p>
            </div>

            {errorGeneral && (
              <div
                role="alert"
                className="w-full p-4 bg-[#fff3d8] border-2 border-[#f2c66d] rounded-xl text-[#17324d] text-[17px] leading-normal font-medium"
              >
                <p className="m-0">{errorGeneral}</p>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col gap-6 w-full"
            >
              {/* Campo 1: Nombre completo */}
              <div className="flex flex-col gap-2 w-full" data-node-id="4:4602">
                <label
                  htmlFor="nombre"
                  className="font-semibold text-[#17324d] text-[18px] leading-[1.45]"
                >
                  ¿Cómo te llamas? <span className="text-[#0d6258]">*</span>
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  autoComplete="name"
                  required
                  aria-required="true"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Carmen Rodríguez"
                  className="w-full min-h-14 p-4 bg-white text-[#17324d] text-[18px] border border-[#869ba9] rounded-xl placeholder:text-[#526575] focus:outline-none focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]"
                  data-node-id="4:4604"
                />
                <span className="text-[15px] text-[#526575]">
                  Escribe tu nombre y apellido como aparecen en tu documento.
                </span>
              </div>

              {/* Campo 2: Documento de identificación */}
              <div className="flex flex-col gap-2 w-full">
                <label
                  htmlFor="numeroIdentificacion"
                  className="font-semibold text-[#17324d] text-[18px] leading-[1.45]"
                >
                  Número de identificación{' '}
                  <span className="text-[#0d6258]">*</span>
                </label>
                <input
                  id="numeroIdentificacion"
                  name="numeroIdentificacion"
                  type="text"
                  autoComplete="off"
                  required
                  aria-required="true"
                  value={numeroIdentificacion}
                  onChange={(e) => setNumeroIdentificacion(e.target.value)}
                  placeholder="Ej. 41234567"
                  className="w-full min-h-14 p-4 bg-white text-[#17324d] text-[18px] border border-[#869ba9] rounded-xl placeholder:text-[#526575] focus:outline-none focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]"
                />
                <span className="text-[15px] text-[#526575]">
                  Cédula de ciudadanía, extranjería o pasaporte (sin puntos ni
                  espacios).
                </span>
              </div>

              {/* Campo 3: Fecha de nacimiento */}
              <div className="flex flex-col gap-2 w-full">
                <label
                  htmlFor="fechaNacimiento"
                  className="font-semibold text-[#17324d] text-[18px] leading-[1.45]"
                >
                  Fecha de nacimiento <span className="text-[#0d6258]">*</span>
                </label>
                <input
                  id="fechaNacimiento"
                  name="fechaNacimiento"
                  type="date"
                  max={hoyStr}
                  required
                  aria-required="true"
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                  className="w-full min-h-14 p-4 bg-white text-[#17324d] text-[18px] border border-[#869ba9] rounded-xl placeholder:text-[#526575] focus:outline-none focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]"
                />
                <span className="text-[15px] text-[#526575]">
                  Día, mes y año en que naciste.
                </span>
              </div>

              {/* Sección de Contacto */}
              <div className="pt-2 border-t border-[#e2e8f0] flex flex-col gap-4 w-full">
                <div>
                  <p className="font-semibold text-[#17324d] text-[18px] leading-[1.45] m-0">
                    Medio de contacto (para enviarte tu código)
                  </p>
                  <span className="text-[15px] text-[#526575]">
                    Ingresa tu correo o tu celular. Puedes ingresar ambos si lo
                    deseas.
                  </span>
                </div>

                {/* Campo 4: Correo electrónico */}
                <div
                  className="flex flex-col gap-2 w-full"
                  data-node-id="4:4606"
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
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="nombre@correo.com"
                    className="w-full min-h-14 p-4 bg-white text-[#17324d] text-[18px] border border-[#869ba9] rounded-xl placeholder:text-[#526575] focus:outline-none focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]"
                    data-node-id="4:4608"
                  />
                </div>

                {/* Campo 5: Celular */}
                <div className="flex flex-col gap-2 w-full">
                  <label
                    htmlFor="telefono"
                    className="font-semibold text-[#17324d] text-[18px] leading-[1.45]"
                  >
                    Número de celular
                  </label>
                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    autoComplete="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej. 300 123 4567"
                    className="w-full min-h-14 p-4 bg-white text-[#17324d] text-[18px] border border-[#869ba9] rounded-xl placeholder:text-[#526575] focus:outline-none focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]"
                  />
                  <span className="text-[15px] text-[#526575]">
                    Celular colombiano de 10 dígitos para recibir código por
                    mensaje SMS.
                  </span>
                </div>

                {/* Si ingresó ambos: selector de canal */}
                {mostrarSelectorCanal && (
                  <fieldset className="flex flex-col gap-2 p-4 bg-[#f8fafc] border border-[#d7e2e7] rounded-xl w-full">
                    <legend className="font-semibold text-[#17324d] text-[16px] px-1">
                      ¿Dónde prefieres recibir el código de acceso?
                    </legend>
                    <div className="flex flex-col sm:flex-row gap-4 mt-1">
                      <label className="flex items-center gap-3 cursor-pointer text-[#17324d] text-[16px] font-medium min-h-11">
                        <input
                          type="radio"
                          name="canalVerificacion"
                          value="CORREO"
                          checked={canalVerificacion === 'CORREO'}
                          onChange={() => setCanalVerificacion('CORREO')}
                          className="w-5 h-5 accent-[#0d6258]"
                        />
                        Por correo electrónico
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer text-[#17324d] text-[16px] font-medium min-h-11">
                        <input
                          type="radio"
                          name="canalVerificacion"
                          value="TELEFONO"
                          checked={canalVerificacion === 'TELEFONO'}
                          onChange={() => setCanalVerificacion('TELEFONO')}
                          className="w-5 h-5 accent-[#0d6258]"
                        />
                        Por mensaje de texto (SMS)
                      </label>
                    </div>
                  </fieldset>
                )}
              </div>

              {/* Consentimiento y Aviso de Privacidad (Ley 1581 de 2012) */}
              <div className="pt-2 border-t border-[#e2e8f0] flex flex-col gap-2 w-full">
                <label className="flex items-start gap-3 cursor-pointer text-[#17324d] text-[16px] leading-[1.45]">
                  <input
                    type="checkbox"
                    id="aceptaAvisoPrivacidad"
                    name="aceptaAvisoPrivacidad"
                    checked={aceptaAvisoPrivacidad}
                    onChange={(e) => setAceptaAvisoPrivacidad(e.target.checked)}
                    className="w-6 h-6 mt-0.5 accent-[#0d6258] shrink-0 rounded cursor-pointer"
                  />
                  <span>
                    He leído y acepto el{' '}
                    <button
                      type="button"
                      onClick={() => setModalAvisoAbierto(true)}
                      className="text-[#0d6258] underline font-semibold hover:text-[#09493f] cursor-pointer inline bg-transparent border-none p-0 text-left"
                    >
                      aviso de privacidad
                    </button>{' '}
                    y autorizo el tratamiento de mis datos personales según la
                    Ley 1581 de 2012. <span className="text-[#0d6258]">*</span>
                  </span>
                </label>
              </div>

              {/* Botón principal */}
              <button
                type="submit"
                disabled={enviando}
                className="w-full sm:w-auto inline-flex items-center justify-center min-h-14 px-6 py-4 rounded-xl bg-[#0d6258] text-white font-semibold text-[18px] leading-[1.45] hover:bg-[#09493f] transition-colors cursor-pointer border-none disabled:opacity-50 mt-2"
                data-node-id="4:4611"
              >
                {enviando
                  ? 'Enviando código...'
                  : 'Crear cuenta y recibir código'}
              </button>

              {/* Botón secundario */}
              <Link
                to="/iniciar-sesion"
                className="w-full sm:w-auto inline-flex items-center justify-center min-h-14 px-6 py-4 rounded-xl bg-white border border-[#d7e2e7] text-[#0d6258] font-semibold text-[18px] leading-[1.45] hover:border-[#0d6258] hover:bg-[#f1f5f9] transition-colors no-underline cursor-pointer"
                data-node-id="4:4613"
              >
                Ya tengo una cuenta
              </Link>
            </form>
          </section>
        </div>
      </main>

      {/* Modal de Aviso de Privacidad */}
      <AvisoPrivacidadModal
        isOpen={modalAvisoAbierto}
        onClose={() => setModalAvisoAbierto(false)}
        onAccept={() => {
          setAceptaAvisoPrivacidad(true);
          setModalAvisoAbierto(false);
        }}
      />

      {/* Cierre / Pie institucional según Figma */}
      <footer
        className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 md:px-24 py-6 flex flex-wrap gap-6 items-center justify-between"
        data-node-id="4:3977"
        data-name="Cierre"
      >
        <p
          className="font-normal text-[#526575] text-[18px] leading-[1.45] m-0"
          data-node-id="4:4644"
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
