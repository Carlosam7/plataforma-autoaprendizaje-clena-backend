import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { CredencialesIncorrectasError } from '@/domain/personal/errors';
import { container } from '@/main/container';

export function AccesoPersonalPage() {
  const navigate = useNavigate();

  // Paso 1: credenciales (correo + password). Paso 2: código de 6 dígitos
  const [paso, setPaso] = useState<'CREDENCIALES' | 'CODIGO'>('CREDENCIALES');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [codigo, setCodigo] = useState('');
  const [destino, setDestino] = useState('');
  const [mensajeInfo, setMensajeInfo] = useState('');

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const manejarEnvioCredenciales = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!correo.trim() || !password) {
      setError('Por favor, ingresa tu correo institucional y tu contraseña.');
      return;
    }

    setCargando(true);
    try {
      const res = await container.personal.solicitarInicioSesion.ejecutar({
        correo: correo.trim(),
        password,
      });
      setDestino(res.destino);
      setMensajeInfo(res.mensaje);
      setPaso('CODIGO');
    } catch (err) {
      if (err instanceof CredencialesIncorrectasError) {
        setError('Credenciales incorrectas');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado al intentar ingresar.');
      }
    } finally {
      setCargando(false);
    }
  };

  const manejarEnvioCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cod = codigo.trim();
    if (!cod || cod.length !== 6) {
      setError(
        'Por favor, ingresa el código de 6 dígitos enviado a tu correo.',
      );
      return;
    }

    setCargando(true);
    try {
      const sesion = await container.personal.verificarInicioSesion.ejecutar({
        destino,
        codigo: cod,
      });

      if (sesion.usuario.debeCambiarPassword) {
        navigate('/personal/primer-acceso');
      } else if (sesion.usuario.rol === 'ADMINISTRADOR') {
        navigate('/admin/personal');
      } else {
        navigate('/guias');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Código inválido o expirado.');
      }
    } finally {
      setCargando(false);
    }
  };

  const reenviarCodigo = async () => {
    setError(null);
    setCargando(true);
    try {
      const res = await container.personal.solicitarInicioSesion.ejecutar({
        correo: correo.trim(),
        password,
      });
      setMensajeInfo(res.mensaje);
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
      <div className="flex flex-col gap-3 text-center md:text-left">
        <span className="text-[1rem] font-bold text-primary uppercase tracking-wider">
          SALA DE INTERNET DEL CLENA · EQUIPO
        </span>
        <h1 className="text-[2rem] md:text-[2.444rem] font-bold text-navy leading-tight">
          Acceso para personal del CLENA
        </h1>
        <p className="text-[1.111rem] text-muted">
          Ingreso exclusivo para monitores de sala y administradores de la
          plataforma educativa.
        </p>
      </div>

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

      {paso === 'CREDENCIALES' ? (
        <form
          onSubmit={manejarEnvioCredenciales}
          noValidate
          className="bg-surface border-2 border-border rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-sm"
        >
          <div className="flex flex-col gap-2">
            <label
              htmlFor="correo-personal"
              className="text-[1.111rem] font-bold text-navy"
            >
              Correo institucional <span className="text-primary">*</span>
            </label>
            <input
              id="correo-personal"
              type="email"
              autoComplete="username"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="nombre@clena.org"
              className="min-h-14 px-4 text-[1.111rem] bg-white border-2 border-border rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 text-ink"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password-personal"
                className="text-[1.111rem] font-bold text-navy"
              >
                Contraseña <span className="text-primary">*</span>
              </label>
            </div>
            <input
              id="password-personal"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="min-h-14 px-4 text-[1.111rem] bg-white border-2 border-border rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 text-ink"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="inline-flex items-center justify-center min-h-14 px-8 py-4 font-bold text-[1.111rem] text-btn-primary-fg bg-btn-primary-bg rounded-xl hover:bg-btn-primary-hover transition-colors cursor-pointer border-2 border-btn-primary-border disabled:opacity-50"
          >
            {cargando ? 'Verificando credenciales...' : 'Continuar →'}
          </button>
        </form>
      ) : (
        <form
          onSubmit={manejarEnvioCodigo}
          noValidate
          className="bg-surface border-2 border-border rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-sm"
        >
          <div className="p-4 bg-tint/30 border border-primary/20 rounded-xl text-ink">
            <p className="font-semibold text-primary">
              Verificación de dos pasos
            </p>
            <p className="text-[1rem] text-muted mt-1">{mensajeInfo}</p>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="codigo-personal"
              className="text-[1.111rem] font-bold text-navy"
            >
              Código de verificación (6 dígitos){' '}
              <span className="text-primary">*</span>
            </label>
            <input
              id="codigo-personal"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              required
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="min-h-14 px-4 text-center tracking-widest text-[1.5rem] font-mono bg-white border-2 border-border rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 text-ink"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              type="button"
              onClick={() => {
                setPaso('CREDENCIALES');
                setCodigo('');
                setError(null);
              }}
              className="inline-flex items-center justify-center min-h-14 px-6 py-4 font-semibold text-[1rem] text-btn-secondary-fg bg-btn-secondary-bg border-2 border-btn-secondary-border rounded-xl hover:bg-btn-secondary-hover-bg cursor-pointer"
            >
              ← Volver
            </button>
            <button
              type="submit"
              disabled={cargando || codigo.length !== 6}
              className="flex-1 inline-flex items-center justify-center min-h-14 px-8 py-4 font-bold text-[1.111rem] text-btn-primary-fg bg-btn-primary-bg rounded-xl hover:bg-btn-primary-hover transition-colors cursor-pointer border-2 border-btn-primary-border disabled:opacity-50"
            >
              {cargando ? 'Comprobando código...' : 'Entrar a la plataforma →'}
            </button>
          </div>

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
      )}

      <footer className="text-center text-muted text-[0.95rem] flex flex-col gap-2">
        <p>
          ¿Eres usuario o visitante de la sala?{' '}
          <Link
            to="/iniciar-sesion"
            className="text-primary font-bold hover:underline"
          >
            Inicia sesión aquí
          </Link>
        </p>
      </footer>
    </main>
  );
}
