import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import type {
  Personal,
  RolPersonal,
  SesionPersonal,
} from '@/domain/personal/types';
import { container } from '@/main/container';

export function GestionPersonalPage() {
  const navigate = useNavigate();

  const [sesion, setSesion] = useState<SesionPersonal | null>(null);
  const [esAdmin, setEsAdmin] = useState<boolean | null>(null);

  // Lista y filtros
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState<string>('TODOS');
  const [filtroActivo, setFiltroActivo] = useState<string>('TODOS');

  // Modales
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [cuentaADesactivar, setCuentaADesactivar] = useState<Personal | null>(
    null,
  );

  // Formulario nuevo personal
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [nuevoRol, setNuevoRol] = useState<RolPersonal>('PERSONAL');
  const [nuevaPasswordTemporal, setNuevaPasswordTemporal] =
    useState('Temporal2026');
  const [guardandoNuevo, setGuardandoNuevo] = useState(false);

  // Notificaciones
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargarCuentas = useCallback(
    async (token: string) => {
      setCargando(true);
      setError(null);
      try {
        const res = await container.personal.listar.ejecutar(token, {
          q: busqueda.trim() || undefined,
          rol: filtroRol !== 'TODOS' ? (filtroRol as RolPersonal) : undefined,
          activo:
            filtroActivo === 'TODOS'
              ? undefined
              : filtroActivo === 'ACTIVAS'
                ? true
                : false,
        });
        setPersonal(res.datos);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudo cargar el listado del personal.',
        );
      } finally {
        setCargando(false);
      }
    },
    [busqueda, filtroRol, filtroActivo],
  );

  // Verificar rol de administrador (AC-HU04-04)
  useEffect(() => {
    let activo = true;

    void (async () => {
      const s = await container.personal.obtenerSesion.ejecutar();
      if (!activo) return;

      if (!s) {
        setEsAdmin(false);
        setCargando(false);
        return;
      }

      setSesion(s);
      const autorizado = s.usuario.rol === 'ADMINISTRADOR';
      setEsAdmin(autorizado);

      if (autorizado) {
        await cargarCuentas(s.accessToken);
      } else {
        setCargando(false);
      }
    })();

    return () => {
      activo = false;
    };
  }, [cargarCuentas]);

  // Si no es administrador (AC-HU04-04)
  if (esAdmin === false) {
    return (
      <main
        id="contenido"
        className="max-w-160 mx-auto px-4 md:px-8 py-16 flex flex-col items-center gap-6 text-center"
      >
        <span className="text-4xl" aria-hidden="true">
          🔒
        </span>
        <h1 className="text-[2rem] font-bold text-navy">
          Acceso no autorizado (403)
        </h1>
        <p className="text-[1.111rem] text-muted max-w-120">
          Esta sección está restringida exclusivamente a administradores de la
          plataforma del CLENA.
        </p>
        <Link
          to="/personal/acceso"
          className="inline-flex items-center justify-center min-h-14 px-8 font-semibold text-btn-primary-fg bg-btn-primary-bg rounded-xl hover:bg-btn-primary-hover no-underline"
        >
          Ir al acceso del personal
        </Link>
      </main>
    );
  }

  const manejarCrearPersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sesion) return;
    setError(null);

    if (!nuevoNombre.trim() || !nuevoCorreo.trim()) {
      setError('Por favor, completa todos los campos del nuevo usuario.');
      return;
    }

    setGuardandoNuevo(true);
    try {
      await container.personal.crear.ejecutar(sesion.accessToken, {
        nombre: nuevoNombre.trim(),
        correo: nuevoCorreo.trim(),
        passwordTemporal: nuevaPasswordTemporal.trim(),
        rol: nuevoRol,
      });

      setMensajeExito(`Cuenta creada exitosamente para ${nuevoNombre}.`);
      setModalCrearAbierto(false);
      setNuevoNombre('');
      setNuevoCorreo('');
      setNuevaPasswordTemporal('Temporal2026');
      await cargarCuentas(sesion.accessToken);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo crear la cuenta.',
      );
    } finally {
      setGuardandoNuevo(false);
    }
  };

  const manejarDesactivar = async () => {
    if (!sesion || !cuentaADesactivar) return;
    try {
      await container.personal.desactivar.ejecutar(
        sesion.accessToken,
        cuentaADesactivar.id,
      );
      setMensajeExito(
        `La cuenta de ${cuentaADesactivar.nombre} ha sido desactivada. Sus registros históricos se conservan.`,
      );
      setCuentaADesactivar(null);
      await cargarCuentas(sesion.accessToken);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo desactivar la cuenta.',
      );
    }
  };

  const manejarReactivar = async (id: string, nombre: string) => {
    if (!sesion) return;
    try {
      await container.personal.reactivar.ejecutar(sesion.accessToken, id);
      setMensajeExito(`La cuenta de ${nombre} ha sido reactivada.`);
      await cargarCuentas(sesion.accessToken);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo reactivar la cuenta.',
      );
    }
  };

  const cerrarSesion = async () => {
    await container.personal.cerrarSesion.ejecutar();
    navigate('/personal/acceso');
  };

  return (
    <main
      id="contenido"
      className="max-w-360 mx-auto px-4 md:px-12 lg:px-24 py-10 flex flex-col gap-8"
    >
      {/* Encabezado y barra superior */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
        <div className="flex flex-col gap-2">
          <span className="text-[1rem] font-bold text-primary uppercase tracking-wider">
            PANEL DE ADMINISTRACIÓN · CLENA
          </span>
          <h1 className="text-[2rem] md:text-[2.333rem] font-bold text-navy">
            Gestión de cuentas del personal
          </h1>
          <p className="text-[1.111rem] text-muted">
            Administra los accesos de monitores de sala y supervisores de la
            plataforma Kamá.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => setModalCrearAbierto(true)}
            className="inline-flex items-center justify-center min-h-14 px-6 py-3 font-bold text-[1.05rem] text-btn-primary-fg bg-btn-primary-bg rounded-xl hover:bg-btn-primary-hover transition-colors cursor-pointer border-2 border-btn-primary-border shadow-sm"
          >
            + Nueva cuenta de personal
          </button>
          <button
            type="button"
            onClick={cerrarSesion}
            className="inline-flex items-center justify-center min-h-14 px-5 py-3 font-semibold text-[1rem] text-btn-secondary-fg bg-btn-secondary-bg border-2 border-btn-secondary-border rounded-xl hover:bg-btn-secondary-hover-bg cursor-pointer"
          >
            Cerrar sesión
          </button>
        </div>
      </section>

      {/* Notificaciones y alertas */}
      {mensajeExito && (
        <div
          role="status"
          className="p-5 bg-green-50 border-2 border-green-500 rounded-xl text-green-900 font-semibold text-[1.05rem] flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl" aria-hidden="true">
              ✓
            </span>
            <p>{mensajeExito}</p>
          </div>
          <button
            type="button"
            onClick={() => setMensajeExito(null)}
            className="text-green-900 font-bold hover:underline cursor-pointer"
          >
            Cerrar
          </button>
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

      {/* Filtros y buscador */}
      <section
        className="bg-surface border-2 border-border rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-center justify-between"
        aria-label="Filtros de búsqueda de personal"
      >
        <div className="w-full md:w-96 flex flex-col gap-1">
          <label
            htmlFor="buscar-personal"
            className="text-sm font-bold text-navy"
          >
            Buscar por nombre o correo
          </label>
          <input
            id="buscar-personal"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar..."
            className="min-h-12 px-4 bg-white border-2 border-border rounded-xl text-[1rem] focus:outline-none focus:ring-4 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex flex-col gap-1 flex-1 md:flex-initial">
            <label htmlFor="filtro-rol" className="text-sm font-bold text-navy">
              Rol
            </label>
            <select
              id="filtro-rol"
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="min-h-12 px-3 bg-white border-2 border-border rounded-xl text-[1rem] focus:outline-none focus:ring-4 focus:ring-primary/20"
            >
              <option value="TODOS">Todos los roles</option>
              <option value="PERSONAL">Monitores (Personal)</option>
              <option value="ADMINISTRADOR">Administradores</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 flex-1 md:flex-initial">
            <label
              htmlFor="filtro-estado"
              className="text-sm font-bold text-navy"
            >
              Estado
            </label>
            <select
              id="filtro-estado"
              value={filtroActivo}
              onChange={(e) => setFiltroActivo(e.target.value)}
              className="min-h-12 px-3 bg-white border-2 border-border rounded-xl text-[1rem] focus:outline-none focus:ring-4 focus:ring-primary/20"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="ACTIVAS">Solo activas</option>
              <option value="DESACTIVADAS">Solo desactivadas</option>
            </select>
          </div>
        </div>
      </section>

      {/* Tabla de personal */}
      <section className="bg-surface border-2 border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <caption className="sr-only">
              Listado de cuentas de personal y administradores del CLENA
            </caption>
            <thead>
              <tr className="bg-tint/40 border-b-2 border-border text-navy text-[1rem] font-bold">
                <th scope="col" className="p-4 md:px-6">
                  Nombre
                </th>
                <th scope="col" className="p-4 md:px-6">
                  Correo institucional
                </th>
                <th scope="col" className="p-4 md:px-6">
                  Rol
                </th>
                <th scope="col" className="p-4 md:px-6">
                  Estado
                </th>
                <th scope="col" className="p-4 md:px-6">
                  Contraseña
                </th>
                <th scope="col" className="p-4 md:px-6 text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-[1rem] text-ink">
              {cargando ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted">
                    Cargando cuentas del personal...
                  </td>
                </tr>
              ) : personal.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted">
                    No se encontraron cuentas de personal con los filtros
                    seleccionados.
                  </td>
                </tr>
              ) : (
                personal.map((cuenta) => (
                  <tr
                    key={cuenta.id}
                    className={`hover:bg-tint/20 transition-colors ${
                      !cuenta.activo ? 'opacity-60 bg-gray-50' : ''
                    }`}
                  >
                    <td className="p-4 md:px-6 font-bold text-navy">
                      {cuenta.nombre}
                    </td>
                    <td className="p-4 md:px-6 font-mono text-[0.95rem]">
                      {cuenta.correo}
                    </td>
                    <td className="p-4 md:px-6">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          cuenta.rol === 'ADMINISTRADOR'
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : 'bg-blue-100 text-blue-900 border border-blue-300'
                        }`}
                      >
                        {cuenta.rol === 'ADMINISTRADOR'
                          ? 'Administrador'
                          : 'Monitor'}
                      </span>
                    </td>
                    <td className="p-4 md:px-6">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          cuenta.activo
                            ? 'bg-green-100 text-green-900 border border-green-400'
                            : 'bg-red-100 text-red-900 border border-red-300'
                        }`}
                      >
                        {cuenta.activo ? 'Activa' : 'Desactivada'}
                      </span>
                    </td>
                    <td className="p-4 md:px-6 text-sm">
                      {cuenta.debeCambiarPassword ? (
                        <span className="text-amber-800 font-semibold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-300">
                          Temporal
                        </span>
                      ) : (
                        <span className="text-muted">Permanente</span>
                      )}
                    </td>
                    <td className="p-4 md:px-6 text-right">
                      {cuenta.activo ? (
                        <button
                          type="button"
                          onClick={() => setCuentaADesactivar(cuenta)}
                          className="min-h-11 px-4 py-2 font-semibold text-sm text-red-700 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 cursor-pointer"
                        >
                          Desactivar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            manejarReactivar(cuenta.id, cuenta.nombre)
                          }
                          className="min-h-11 px-4 py-2 font-semibold text-sm text-green-800 bg-green-50 border border-green-400 rounded-lg hover:bg-green-100 cursor-pointer"
                        >
                          Reactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal accesible para crear cuenta (AC-HU04-01) */}
      {modalCrearAbierto && (
        <dialog
          open
          aria-labelledby="titulo-crear-personal"
          className="backdrop:bg-black/60 fixed inset-0 m-auto max-w-xl w-[calc(100%-2rem)] p-0 rounded-2xl bg-surface border-2 border-border shadow-2xl z-50 text-ink"
        >
          <form
            onSubmit={manejarCrearPersonal}
            className="p-6 md:p-8 flex flex-col gap-6"
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2
                id="titulo-crear-personal"
                className="text-[1.333rem] md:text-[1.556rem] font-bold text-navy"
              >
                Crear cuenta de personal
              </h2>
              <button
                type="button"
                onClick={() => setModalCrearAbierto(false)}
                className="min-w-11 min-h-11 flex items-center justify-center rounded-xl border border-border text-navy hover:bg-tint font-bold text-xl cursor-pointer"
                aria-label="Cerrar ventana"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="nombre-nuevo" className="font-bold text-navy">
                Nombre completo <span className="text-primary">*</span>
              </label>
              <input
                id="nombre-nuevo"
                type="text"
                required
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Ej. Andrés Ramírez"
                className="min-h-12 px-4 bg-white border-2 border-border rounded-xl text-[1rem] focus:outline-none focus:ring-4 focus:ring-primary/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="correo-nuevo" className="font-bold text-navy">
                Correo institucional <span className="text-primary">*</span>
              </label>
              <input
                id="correo-nuevo"
                type="email"
                required
                value={nuevoCorreo}
                onChange={(e) => setNuevoCorreo(e.target.value)}
                placeholder="andres@clena.org"
                className="min-h-12 px-4 bg-white border-2 border-border rounded-xl text-[1rem] focus:outline-none focus:ring-4 focus:ring-primary/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="rol-nuevo" className="font-bold text-navy">
                Rol en la plataforma <span className="text-primary">*</span>
              </label>
              <select
                id="rol-nuevo"
                value={nuevoRol}
                onChange={(e) => setNuevoRol(e.target.value as RolPersonal)}
                className="min-h-12 px-3 bg-white border-2 border-border rounded-xl text-[1rem] focus:outline-none focus:ring-4 focus:ring-primary/20"
              >
                <option value="PERSONAL">Monitor de sala (Personal)</option>
                <option value="ADMINISTRADOR">Administrador</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="password-temporal"
                className="font-bold text-navy"
              >
                Contraseña temporal <span className="text-primary">*</span>
              </label>
              <p className="text-xs text-muted">
                El usuario deberá cambiarla obligatoriamente en su primer
                ingreso (HU-04).
              </p>
              <input
                id="password-temporal"
                type="text"
                required
                value={nuevaPasswordTemporal}
                onChange={(e) => setNuevaPasswordTemporal(e.target.value)}
                className="min-h-12 px-4 bg-white border-2 border-border rounded-xl text-[1rem] font-mono focus:outline-none focus:ring-4 focus:ring-primary/20"
              />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setModalCrearAbierto(false)}
                className="min-h-12 px-5 font-semibold text-btn-secondary-fg bg-btn-secondary-bg border-2 border-btn-secondary-border rounded-xl hover:bg-btn-secondary-hover-bg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardandoNuevo}
                className="min-h-12 px-6 font-bold text-btn-primary-fg bg-btn-primary-bg rounded-xl hover:bg-btn-primary-hover border-2 border-btn-primary-border cursor-pointer disabled:opacity-50"
              >
                {guardandoNuevo ? 'Guardando...' : 'Crear cuenta'}
              </button>
            </div>
          </form>
        </dialog>
      )}

      {/* Modal accesible de confirmación para desactivar cuenta (AC-HU04-02) */}
      {cuentaADesactivar && (
        <dialog
          open
          aria-labelledby="titulo-desactivar-personal"
          className="backdrop:bg-black/60 fixed inset-0 m-auto max-w-lg w-[calc(100%-2rem)] p-0 rounded-2xl bg-surface border-2 border-red-300 shadow-2xl z-50 text-ink"
        >
          <div className="p-6 md:p-8 flex flex-col gap-5">
            <h2
              id="titulo-desactivar-personal"
              className="text-[1.333rem] font-bold text-red-900"
            >
              ¿Desactivar la cuenta de {cuentaADesactivar.nombre}?
            </h2>
            <p className="text-[1rem] text-ink leading-relaxed">
              Al desactivar esta cuenta, el monitor o administrador{' '}
              <strong>ya no podrá iniciar sesión</strong> en la plataforma.
            </p>
            <p className="text-sm text-muted bg-tint/30 p-3 rounded-lg border border-border">
              💡 <strong>Nota legal e histórica:</strong> De acuerdo con el
              criterio AC-HU04-02, sus registros históricos y actividades
              realizadas se conservarán en el sistema.
            </p>

            <div className="flex justify-end gap-4 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setCuentaADesactivar(null)}
                className="min-h-12 px-5 font-semibold text-btn-secondary-fg bg-btn-secondary-bg border-2 border-btn-secondary-border rounded-xl hover:bg-btn-secondary-hover-bg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={manejarDesactivar}
                className="min-h-12 px-6 font-bold text-white bg-red-700 rounded-xl hover:bg-red-800 cursor-pointer"
              >
                Sí, desactivar cuenta
              </button>
            </div>
          </div>
        </dialog>
      )}
    </main>
  );
}
