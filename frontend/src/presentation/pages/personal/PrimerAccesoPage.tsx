import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { PasswordDebilError } from '@/domain/personal/errors';
import { container } from '@/main/container';

export function PrimerAccesoPage() {
  const navigate = useNavigate();

  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [destino, setDestino] = useState('');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');

  const [cargando, setCargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Solicitar código al cargar la pantalla
  useEffect(() => {
    let activo = true;

    void (async () => {
      const sesion = await container.personal.obtenerSesion.ejecutar();
      if (!sesion) {
        navigate('/personal/acceso');
        return;
      }

      if (!sesion.usuario.debeCambiarPassword) {
        if (sesion.usuario.rol === 'ADMINISTRADOR') {
          navigate('/admin/personal');
        } else {
          navigate('/guias');
        }
        return;
      }

      try {
        const info = await container.personal.solicitarCodigoPassword.ejecutar(
          sesion.accessToken,
        );
        if (activo) {
          setDestino(info.destino);
          setCodigoEnviado(true);
        }
      } catch (err) {
        if (activo) {
          setError(
            err instanceof Error
              ? err.message
              : 'No pudimos enviar el código de confirmación a tu correo.',
          );
        }
      }
    })();

    return () => {
      activo = false;
    };
  }, [navigate]);

  const manejarEnvioCambio = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!codigo.trim() || codigo.trim().length !== 6) {
      setError(
        'Por favor, ingresa el código de 6 dígitos enviado a tu correo.',
      );
      return;
    }

    if (
      password.length < 8 ||
      !/\d/.test(password) ||
      !/[a-zA-Z]/.test(password)
    ) {
      setError(
        'La contraseña debe tener al menos 8 caracteres y combinar letras y números.',
      );
      return;
    }

    if (password !== confirmarPassword) {
      setError('Las contraseñas ingresadas no coinciden.');
      return;
    }

    setCargando(true);
    try {
      const sesion = await container.personal.obtenerSesion.ejecutar();
      if (!sesion) {
        navigate('/personal/acceso');
        return;
      }

      await container.personal.cambiarPasswordInicial.ejecutar(
        sesion.accessToken,
        {
          codigo: codigo.trim(),
          nuevoPassword: password,
        },
      );

      setMensajeExito(
        '¡Tu contraseña permanente ha sido configurada con éxito!',
      );

      setTimeout(() => {
        if (sesion.usuario.rol === 'ADMINISTRADOR') {
          navigate('/admin/personal');
        } else {
          navigate('/guias');
        }
      }, 2000);
    } catch (err) {
      if (err instanceof PasswordDebilError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('No se pudo cambiar la contraseña. Verifica el código.');
      }
    } finally {
      setCargando(false);
    }
  };

  const reenviarCodigo = async () => {
    setError(null);
    setCargando(true);
    try {
      const sesion = await container.personal.obtenerSesion.ejecutar();
      if (!sesion) {
        navigate('/personal/acceso');
        return;
      }
      const info = await container.personal.solicitarCodigoPassword.ejecutar(
        sesion.accessToken,
      );
      setDestino(info.destino);
      setCodigoEnviado(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo reenviar el código.',
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <main
      id="contenido"
      className="max-w-160 mx-auto px-4 md:px-8 py-12 md:py-16 flex flex-col gap-8"
    >
      <div className="flex flex-col gap-3">
        <span className="text-[1rem] font-bold text-primary uppercase tracking-wider">
          PRIMER INGRESO · SEGURIDAD INSTITUCIONAL
        </span>
        <h1 className="text-[2rem] md:text-[2.444rem] font-bold text-navy leading-tight">
          Configura tu contraseña permanente
        </h1>
        <p className="text-[1.111rem] text-muted">
          Tu cuenta fue creada con una contraseña temporal. Por seguridad, debes
          crear una clave personal antes de comenzar a operar en la plataforma.
        </p>
      </div>

      {mensajeExito && (
        <div
          role="status"
          className="p-5 bg-green-50 border-2 border-green-500 rounded-xl text-green-900 font-semibold text-[1.111rem] flex items-center gap-3"
        >
          <span className="text-2xl" aria-hidden="true">
            ✓
          </span>
          <p>{mensajeExito} Redirigiendo...</p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-5 bg-red-50 border-2 border-red-300 rounded-xl text-red-900 flex items-start gap-3"
        >
          <span className="text-xl" aria-hidden="true">
            ⚠️
          </span>
          <div>
            <p className="font-bold text-[1.05rem]">Atención</p>
            <p className="text-[1rem] mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <form
        onSubmit={manejarEnvioCambio}
        noValidate
        className="bg-surface border-2 border-border rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-sm"
      >
        <div className="p-4 bg-tint/30 border border-primary/20 rounded-xl text-ink">
          <p className="font-semibold text-primary">
            Verificación de identidad
          </p>
          <p className="text-[1rem] text-muted mt-1">
            {codigoEnviado
              ? `Te enviamos un código de seguridad a ${destino}. Escríbelo para confirmar tu cambio de clave.`
              : 'Solicitando código de seguridad a tu correo...'}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="codigo-cambio"
            className="text-[1.111rem] font-bold text-navy"
          >
            Código de verificación recibido{' '}
            <span className="text-primary">*</span>
          </label>
          <input
            id="codigo-cambio"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            required
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            className="min-h-14 px-4 text-center tracking-widest text-[1.5rem] font-mono bg-white border-2 border-border rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 text-ink"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="nuevo-password"
            className="text-[1.111rem] font-bold text-navy"
          >
            Nueva contraseña permanente <span className="text-primary">*</span>
          </label>
          <p className="text-[0.95rem] text-muted">
            Mínimo 8 caracteres, combinando al menos una letra y un número.
          </p>
          <input
            id="nuevo-password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="min-h-14 px-4 text-[1.111rem] bg-white border-2 border-border rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 text-ink"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="confirmar-password"
            className="text-[1.111rem] font-bold text-navy"
          >
            Confirmar nueva contraseña <span className="text-primary">*</span>
          </label>
          <input
            id="confirmar-password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmarPassword}
            onChange={(e) => setConfirmarPassword(e.target.value)}
            placeholder="Repite la contraseña"
            className="min-h-14 px-4 text-[1.111rem] bg-white border-2 border-border rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 text-ink"
          />
        </div>

        <button
          type="submit"
          disabled={cargando || Boolean(mensajeExito)}
          className="inline-flex items-center justify-center min-h-14 px-8 py-4 font-bold text-[1.111rem] text-btn-primary-fg bg-btn-primary-bg rounded-xl hover:bg-btn-primary-hover transition-colors cursor-pointer border-2 border-btn-primary-border disabled:opacity-50"
        >
          {cargando ? 'Guardando contraseña...' : 'Guardar y entrar →'}
        </button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={reenviarCodigo}
            disabled={cargando}
            className="text-primary hover:underline font-semibold text-[1rem] cursor-pointer"
          >
            ¿No recibiste el código? Reenviar
          </button>
        </div>
      </form>
    </main>
  );
}
