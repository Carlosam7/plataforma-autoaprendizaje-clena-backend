import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import type { CanalVerificacion } from '@/domain/auth/types';
import { container } from '@/main/container';

interface NavigationState {
  solicitudId?: string;
  registroId?: string;
  canal?: CanalVerificacion;
  destino?: string;
  mensaje?: string;
  puedeReenviarEn?: string;
  expiraEn?: string;
  tipo?: 'REGISTRO' | 'LOGIN';
  numeroIdentificacion?: string;
  contacto?: string;
}

export function VerificarAccesoPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const state = (location.state as NavigationState) || {};
  const tipo =
    state.tipo ||
    (searchParams.get('tipo') as 'REGISTRO' | 'LOGIN') ||
    'REGISTRO';
  const esLogin = tipo === 'LOGIN';

  const activeId =
    state.solicitudId ||
    state.registroId ||
    searchParams.get('solicitudId') ||
    searchParams.get('registroId') ||
    '';
  const canal = state.canal || 'CORREO';
  const destino =
    state.destino ||
    (canal === 'CORREO' ? 'tu correo electrónico' : 'tu celular');

  const [codigo, setCodigo] = useState('');
  const [verificando, setVerificando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [exitoMensaje, setExitoMensaje] = useState<string | null>(null);

  const [segundosRestantes, setSegundosRestantes] = useState<number>(() => {
    if (state.puedeReenviarEn) {
      const diff = Math.ceil(
        (new Date(state.puedeReenviarEn).getTime() - Date.now()) / 1000,
      );
      return diff > 0 ? diff : 0;
    }
    return 60;
  });

  useEffect(() => {
    if (segundosRestantes <= 0) return;
    const interval = setInterval(() => {
      setSegundosRestantes((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [segundosRestantes]);

  const handleVerificar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGeneral(null);
    setExitoMensaje(null);

    const codigoLimpio = codigo.replace(/\s+/g, '');
    if (!activeId) {
      setErrorGeneral(
        esLogin
          ? 'No encontramos una solicitud de inicio de sesión activa. Por favor vuelve a escribir tus datos.'
          : 'No encontramos una solicitud de registro activa. Por favor vuelve a llenar el formulario.',
      );
      return;
    }
    if (!codigoLimpio || !/^\d{6}$/.test(codigoLimpio)) {
      setErrorGeneral('Escribe los 6 números del código que te enviamos.');
      return;
    }

    setVerificando(true);
    try {
      if (esLogin) {
        const sesion = await container.auth.verificarInicioSesion.ejecutar({
          solicitudId: activeId,
          codigo: codigoLimpio,
        });

        setExitoMensaje(`¡Bienvenida(o) de nuevo, ${sesion.usuario.nombre}!`);
      } else {
        const sesion = await container.auth.verificarCodigo.ejecutar({
          registroId: activeId,
          codigo: codigoLimpio,
        });

        setExitoMensaje(
          `¡Bienvenida, ${sesion.usuario.nombre}! Tu cuenta fue creada con éxito.`,
        );
      }

      setTimeout(() => {
        navigate('/guias');
      }, 1200);
    } catch (err) {
      setVerificando(false);
      if (err instanceof Error) {
        setErrorGeneral(err.message);
      } else {
        setErrorGeneral(
          'Ocurrió un error al verificar tu código. Intenta de nuevo.',
        );
      }
    }
  };

  const handleReenviar = async () => {
    if (segundosRestantes > 0 || reenviando || !activeId) return;

    setErrorGeneral(null);
    setExitoMensaje(null);
    setReenviando(true);

    try {
      if (esLogin && state.numeroIdentificacion && state.contacto) {
        const resultado = await container.auth.solicitarInicioSesion.ejecutar({
          numeroIdentificacion: state.numeroIdentificacion,
          contacto: state.contacto,
        });
        setReenviando(false);
        setExitoMensaje(
          resultado.mensaje || 'Te hemos enviado un nuevo código de acceso.',
        );
        const diff = Math.ceil(
          (resultado.puedeReenviarEn.getTime() - Date.now()) / 1000,
        );
        setSegundosRestantes(diff > 0 ? diff : 60);
      } else {
        const resultado =
          await container.auth.reenviarCodigo.ejecutar(activeId);
        setReenviando(false);
        setExitoMensaje(
          resultado.mensaje ||
            'Te hemos enviado un nuevo código de verificación.',
        );
        const diff = Math.ceil(
          (resultado.puedeReenviarEn.getTime() - Date.now()) / 1000,
        );
        setSegundosRestantes(diff > 0 ? diff : 60);
      }
    } catch (err) {
      setReenviando(false);
      if (err instanceof Error) {
        setErrorGeneral(err.message);
      } else {
        setErrorGeneral('No pudimos reenviar el código en este momento.');
      }
    }
  };

  return (
    <div
      className="bg-[#f8fafc] flex-1 flex flex-col justify-between"
      data-node-id="4:3978"
      data-name="07 · Verificar acceso"
    >
      <main
        id="contenido"
        className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 md:px-24 py-8 md:py-12 w-full max-w-360 mx-auto"
      >
        <div
          className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center justify-center w-full"
          data-node-id="4:4615"
          data-name="Acceso seguro"
        >
          {/* Columna Izquierda: 552px */}
          <section
            aria-labelledby="titulo-aprender-cuenta"
            className="bg-[#e7f2ee] flex flex-col gap-6 items-start p-6 sm:p-8 md:p-10 rounded-3xl w-full lg:w-138 shrink-0"
            data-node-id="4:4616"
            data-name="Aprender con cuenta"
          >
            <p
              className="font-semibold text-[#0d6258] text-[18px] leading-[1.45] tracking-wide m-0"
              data-node-id="4:4617"
            >
              APRENDE A TU RITMO
            </p>
            <h1
              id="titulo-aprender-cuenta"
              className="font-bold text-[#17324d] text-[32px] sm:text-[36px] md:text-[40px] leading-[1.15] m-0"
              data-node-id="4:4618"
            >
              Un paso más y ya estás dentro.
            </h1>
            <p
              className="font-normal text-[#526575] text-[20px] md:text-[22px] leading-[1.45] m-0"
              data-node-id="4:4619"
            >
              En Kamá encontrarás explicaciones sencillas, prácticas seguras y
              ayuda cuando la necesites.
            </p>
            <div
              className="font-medium text-[#0d6258] text-[18px] md:text-[20px] flex flex-col gap-2"
              data-node-id="4:4620"
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

          {/* Columna Derecha: Tarjeta de 632px */}
          <section
            aria-labelledby="titulo-revisa-codigo"
            className="bg-white border border-[#d7e2e7] flex flex-col gap-6 items-start p-6 sm:p-8 md:p-10 rounded-3xl w-full lg:w-158 shrink-0 shadow-sm"
            data-node-id="4:4623"
            data-name="Revisa tu correo o celular"
          >
            <div>
              <h2
                id="titulo-revisa-codigo"
                className="font-bold text-[#17324d] text-[30px] md:text-[36px] leading-[1.2] m-0"
                data-node-id="4:4624"
              >
                {esLogin ? 'Revisa tu correo o celular' : 'Revisa tu correo'}
              </h2>
              <p
                className="font-normal text-[#526575] text-[18px] md:text-[20px] leading-[1.45] mt-2 mb-0"
                data-node-id="4:4625"
              >
                {esLogin
                  ? 'Escribe el código de seis números que enviamos para iniciar tu sesión.'
                  : 'Escribe el código de seis números que enviamos a tu correo.'}
              </p>
            </div>

            {/* Contacto de destino */}
            <div
              className="bg-[#e7f2ee] p-4 rounded-xl w-full"
              data-node-id="4:4626"
              data-name="Contacto de destino"
            >
              <p
                className="font-semibold text-[#0d6258] text-[20px] leading-[1.45] m-0 break-all"
                data-node-id="4:4627"
              >
                {destino}
              </p>
            </div>

            <Link
              to={esLogin ? '/iniciar-sesion' : '/registro'}
              className="inline-flex items-center justify-center min-h-14 px-6 py-4 rounded-xl bg-white border border-[#d7e2e7] text-[#0d6258] font-semibold text-[18px] leading-[1.45] hover:border-[#0d6258] hover:bg-[#f1f5f9] transition-colors no-underline cursor-pointer"
            >
              {esLogin ? 'Cambiar datos de acceso' : 'Cambiar correo'}
            </Link>

            {errorGeneral && (
              <div
                role="alert"
                className="w-full p-4 bg-[#fff3d8] border border-[#f2c66d] rounded-xl text-[#17324d] text-[16px] leading-normal"
              >
                <p className="font-semibold m-0">{errorGeneral}</p>
              </div>
            )}

            {exitoMensaje && (
              <div
                role="status"
                className="w-full p-4 bg-[#e7f2ee] border border-[#0d6258] rounded-xl text-[#0d6258] font-semibold text-[16px]"
              >
                {exitoMensaje}
              </div>
            )}

            <form
              onSubmit={handleVerificar}
              noValidate
              className="flex flex-col gap-6 w-full"
            >
              <div className="flex flex-col gap-2 w-full" data-node-id="4:4102">
                <label
                  htmlFor="codigo"
                  className="font-semibold text-[#17324d] text-[18px] leading-[1.45]"
                >
                  Código de acceso
                </label>
                <input
                  id="codigo"
                  name="codigo"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  aria-required="true"
                  value={codigo}
                  onChange={(e) => {
                    const soloDigitos = e.target.value
                      .replace(/\D/g, '')
                      .slice(0, 6);
                    setCodigo(soloDigitos);
                  }}
                  placeholder="1  2  3  4  5  6"
                  className="w-full min-h-15 p-4 bg-white text-[#17324d] text-center font-mono font-bold tracking-[0.4em] text-[22px] border border-[#869ba9] rounded-xl placeholder:text-[#526575] focus:outline-none focus:border-[#17324d] focus:ring-2 focus:ring-[#17324d]"
                />
              </div>

              <p
                className="font-normal text-[#526575] text-[18px] leading-[1.45] m-0"
                data-node-id="4:4634"
              >
                Ingresa los 6 números que te llegaron.
              </p>

              <button
                type="submit"
                disabled={verificando || codigo.length < 6 || !activeId}
                className="w-full sm:w-auto inline-flex items-center justify-center min-h-14 px-6 py-4 rounded-xl bg-[#0d6258] text-white font-semibold text-[18px] leading-[1.45] hover:bg-[#09493f] transition-colors cursor-pointer border-none disabled:opacity-50"
              >
                {verificando
                  ? 'Verificando y entrando...'
                  : 'Verificar y entrar'}
              </button>

              <button
                type="button"
                disabled={segundosRestantes > 0 || reenviando || !activeId}
                onClick={handleReenviar}
                className="w-full sm:w-auto inline-flex items-center justify-center min-h-14 px-6 py-4 rounded-xl bg-white border border-[#d7e2e7] text-[#0d6258] font-semibold text-[18px] leading-[1.45] hover:border-[#0d6258] hover:bg-[#f1f5f9] transition-colors cursor-pointer disabled:opacity-50"
              >
                {reenviando
                  ? 'Reenviando código...'
                  : segundosRestantes > 0
                    ? `Enviar otro código (${segundosRestantes}s)`
                    : 'Enviar otro código'}
              </button>

              <p
                className="font-normal text-[#526575] text-[18px] leading-[1.45] m-0"
                data-node-id="4:4639"
              >
                Si no llega a tu correo, revisa la carpeta de correo no deseado
                o spam.
              </p>
            </form>
          </section>
        </div>
      </main>

      {/* Cierre / Pie institucional según Figma */}
      <footer
        className="w-full max-w-360 mx-auto px-4 sm:px-8 md:px-24 py-6 flex flex-wrap gap-6 items-center justify-between"
        data-node-id="4:3981"
        data-name="Cierre"
      >
        <p
          className="font-normal text-[#526575] text-[18px] leading-[1.45] m-0"
          data-node-id="4:4648"
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
