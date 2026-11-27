import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import type { EventoCola } from '@/application/cola/SeguimientoCola';
import { type ColaAyuda, nombreEquipoEnFrase } from '@/domain/cola/types';
import { SesionPersonalExpiradaError } from '@/domain/personal/errors';
import { container } from '@/main/container';
import { TarjetaSolicitudCola } from '@/presentation/cola/TarjetaSolicitudCola';
import { NavegacionPersonal } from '@/presentation/personal/NavegacionPersonal';
import { useSesionPersonal } from '@/presentation/personal/useSesionPersonal';

/**
 * HU-30 (FE-06): la cola del monitor. Se actualiza sola cada 15 s mientras la pantalla está
 * abierta (y deja de hacerlo al salir). Si dos monitores toman la misma solicitud, el
 * segundo ve el aviso y la cola se recarga.
 */
/** «al equipo 12» / «del equipo 12», sin repetir «equipo» si ya viene en el nombre. */
const aEquipo = (equipo: string) => `al ${nombreEquipoEnFrase(equipo)}`;
const deEquipo = (equipo: string) => `del ${nombreEquipoEnFrase(equipo)}`;

export function ColaAyudaPage() {
  const navigate = useNavigate();
  const sesion = useSesionPersonal();
  const [cola, setCola] = useState<ColaAyuda | null>(null);
  const [ahora, setAhora] = useState(() => new Date());
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [resolviendo, setResolviendo] = useState<string | null>(null);
  const [comentario, setComentario] = useState('');
  const manejarError = useCallback(
    (err: unknown, porDefecto: string) => {
      if (err instanceof SesionPersonalExpiradaError) {
        navigate('/personal/acceso');
        return;
      }
      setError(err instanceof Error ? err.message : porDefecto);
    },
    [navigate],
  );

  const alCambiar = useCallback(
    (evento: EventoCola) => {
      if (evento.tipo === 'actualizada') {
        setCola(evento.cola);
        setAhora(evento.en);
        setError(null);
      } else {
        manejarError(evento.error, 'No se pudo cargar la cola de ayuda.');
      }
    },
    [manejarError],
  );

  // Se pide al abrir y cada 15 s; al salir de la pantalla se detiene.
  useEffect(() => {
    if (!sesion) return;
    return container.cola.seguimiento.iniciar(alCambiar);
  }, [sesion, alCambiar]);

  const cargar = () => container.cola.seguimiento.actualizarAhora(alCambiar);

  const tomar = async (id: string, equipo: string) => {
    setOcupado(true);
    setAviso(null);
    try {
      await container.cola.tomar.ejecutar(id);
      setAviso(
        `Atiendes ${aEquipo(equipo)}. Cuando termines, márcala como resuelta.`,
      );
    } catch (err) {
      if (
        err instanceof Error &&
        'statusCode' in err &&
        err.statusCode === 409
      ) {
        setAviso(
          `Otro monitor ya está atendiendo ${aEquipo(equipo)}, o la persona canceló. La cola se actualizó.`,
        );
      } else {
        manejarError(err, 'No se pudo tomar la solicitud.');
      }
    } finally {
      setOcupado(false);
      await cargar();
    }
  };

  const resolver = async (id: string, equipo: string) => {
    setOcupado(true);
    setAviso(null);
    try {
      await container.cola.resolver.ejecutar(id, comentario);
      setResolviendo(null);
      setComentario('');
      setAviso(`Listo: la ayuda ${deEquipo(equipo)} quedó resuelta.`);
    } catch (err) {
      manejarError(err, 'No se pudo marcar como resuelta.');
    } finally {
      setOcupado(false);
      await cargar();
    }
  };

  if (!sesion) {
    return (
      <main id="contenido" className="max-w-300 mx-auto px-4 md:px-8 py-12">
        <p role="status" className="text-[1.111rem] text-muted">
          Comprobando tu sesión…
        </p>
      </main>
    );
  }

  const mias =
    cola?.enAtencion.filter((s) => s.atendidaPor === sesion.usuario.nombre) ??
    [];
  const deOtros =
    cola?.enAtencion.filter((s) => s.atendidaPor !== sesion.usuario.nombre) ??
    [];

  return (
    <main
      id="contenido"
      className="max-w-300 mx-auto px-4 md:px-8 py-10 flex flex-col gap-8"
    >
      <NavegacionPersonal sesion={sesion} />
      <div className="flex flex-col gap-2">
        <h1 className="text-[2rem] md:text-[2.444rem] font-bold text-navy leading-tight m-0">
          Cola de ayuda
        </h1>
        <p className="text-[1.111rem] text-muted m-0">
          Se actualiza sola cada 15 segundos. Atiende primero a quien lleva más
          tiempo esperando.
        </p>
      </div>

      <div aria-live="polite" className="flex flex-col gap-3">
        {aviso && (
          <p className="p-4 bg-notice border-2 border-border-input rounded-xl text-ink m-0">
            {aviso}
          </p>
        )}
      </div>
      {error && (
        <div
          role="alert"
          className="p-5 bg-notice border-2 border-border-input rounded-xl text-ink"
        >
          <p className="font-bold text-[1.111rem] m-0">Atención</p>
          <p className="text-[1rem] mt-1 mb-0">{error}</p>
          <button
            type="button"
            onClick={() => void cargar()}
            className="mt-3 inline-flex items-center min-h-11 px-4 rounded-xl font-semibold border-2 bg-btn-secondary-bg text-btn-secondary-fg border-btn-secondary-border cursor-pointer"
          >
            Intentar de nuevo
          </button>
        </div>
      )}

      {!cola && !error && (
        <p role="status" className="text-[1.111rem] text-muted">
          Cargando la cola…
        </p>
      )}

      {cola && (
        <>
          {mias.length > 0 && (
            <section
              aria-labelledby="titulo-mias"
              className="flex flex-col gap-4"
            >
              <h2
                id="titulo-mias"
                className="text-[1.5rem] font-bold text-navy m-0"
              >
                Estás atendiendo ({mias.length})
              </h2>
              {mias.map((s) => (
                <TarjetaSolicitudCola
                  key={s.id}
                  solicitud={s}
                  ahora={ahora}
                  esMia
                  ocupado={ocupado}
                  resolviendo={resolviendo === s.id}
                  comentario={resolviendo === s.id ? comentario : ''}
                  onEmpezarResolver={() => {
                    setResolviendo(s.id);
                    setComentario('');
                  }}
                  onComentario={setComentario}
                  onConfirmarResolver={() => void resolver(s.id, s.equipo)}
                  onCancelarResolver={() => setResolviendo(null)}
                />
              ))}
            </section>
          )}

          <section
            aria-labelledby="titulo-pendientes"
            className="flex flex-col gap-4"
          >
            <h2
              id="titulo-pendientes"
              className="text-[1.5rem] font-bold text-navy m-0"
            >
              Esperando ayuda ({cola.totalPendientes})
            </h2>
            {cola.pendientes.length === 0 ? (
              <p className="text-[1.111rem] text-ink">
                Nadie está esperando ayuda en este momento.
              </p>
            ) : (
              <ol className="list-none p-0 m-0 flex flex-col gap-4">
                {cola.pendientes.map((s, i) => (
                  <li key={s.id}>
                    <TarjetaSolicitudCola
                      solicitud={s}
                      ahora={ahora}
                      puesto={i + 1}
                      ocupado={ocupado}
                      onTomar={() => void tomar(s.id, s.equipo)}
                    />
                  </li>
                ))}
              </ol>
            )}
          </section>

          {deOtros.length > 0 && (
            <section
              aria-labelledby="titulo-otros"
              className="flex flex-col gap-4"
            >
              <h2
                id="titulo-otros"
                className="text-[1.5rem] font-bold text-navy m-0"
              >
                Atendiendo otros monitores ({deOtros.length})
              </h2>
              {deOtros.map((s) => (
                <TarjetaSolicitudCola key={s.id} solicitud={s} ahora={ahora} />
              ))}
            </section>
          )}
        </>
      )}
    </main>
  );
}
