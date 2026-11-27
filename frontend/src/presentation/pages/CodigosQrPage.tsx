import { useEffect, useState } from 'react';
import type { EnlacePublico, EnlacesPublicos } from '@/domain/qr/types';
import { container } from '@/main/container';

/** URL de los QR: VITE_URL_PUBLICA al construir la app o, si no, la dirección actual. */
function urlPublica(): string {
  return import.meta.env.VITE_URL_PUBLICA?.trim() || window.location.origin;
}

const ETIQUETA: Record<EnlacePublico['tipo'], string> = {
  INICIO: 'Inicio',
  CATEGORIA: 'Categoría',
  GUIA: 'Guía',
};

interface Tarjeta extends EnlacePublico {
  /** El SVG como data URL, para <img> y para descargarlo. */
  imagen: string;
}

function nombreArchivo(enlace: EnlacePublico): string {
  const base = enlace.ruta === '/' ? 'inicio' : enlace.ruta;
  return `qr-kama-${base.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}.svg`;
}

const boton =
  'inline-flex items-center justify-center min-h-11 px-5 py-2 font-semibold text-[1rem] text-btn-secondary-fg bg-btn-secondary-bg border-2 border-btn-secondary-border rounded-xl hover:border-btn-secondary-hover-border hover:bg-btn-secondary-hover-bg cursor-pointer no-underline';

/**
 * HU-45 (FE-11): códigos QR para imprimir y pegar en la sala. Cada uno abre, sin iniciar
 * sesión, el inicio, una categoría o una guía. Las tarjetas se imprimen con el botón
 * «Imprimir» (sin el encabezado de la app) o se descargan como SVG.
 */
export function CodigosQrPage() {
  const [datos, setDatos] = useState<EnlacesPublicos | null>(null);
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      try {
        const resultado =
          await container.qr.listarEnlaces.ejecutar(urlPublica());
        const conImagen = await Promise.all(
          resultado.enlaces.map(async (enlace) => ({
            ...enlace,
            imagen: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
              await container.qr.generador.svg(enlace.url),
            )}`,
          })),
        );
        if (!vigente) return;
        setDatos(resultado);
        setTarjetas(conImagen);
      } catch (err) {
        if (vigente) {
          setError(
            err instanceof Error
              ? err.message
              : 'No se pudieron preparar los códigos QR.',
          );
        }
      }
    })();
    return () => {
      vigente = false;
    };
  }, []);

  return (
    <main
      id="contenido"
      className="max-w-300 mx-auto px-4 md:px-8 py-12 md:py-16 flex flex-col gap-8"
    >
      <div className="flex flex-col gap-3 print:hidden">
        <h1 className="text-[2rem] md:text-[2.444rem] font-bold text-navy leading-tight">
          Códigos QR para la sala
        </h1>
        <p className="text-[1.111rem] text-muted">
          Imprime estos códigos y pégalos en la sala. Con la cámara del teléfono
          se abre la guía, sin iniciar sesión.
        </p>
        {datos && (
          <p className="text-[1rem] text-ink">
            Los códigos llevan a <strong>{datos.urlBase}</strong>.
          </p>
        )}
        <div>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={tarjetas.length === 0}
            className="inline-flex items-center justify-center min-h-14 px-6 py-4 font-bold text-[1.111rem] text-btn-primary-fg bg-btn-primary-bg rounded-xl hover:bg-btn-primary-hover transition-colors cursor-pointer border-2 border-btn-primary-border disabled:opacity-50"
          >
            Imprimir todos
          </button>
        </div>
      </div>

      {datos?.esLocal && (
        <div
          role="alert"
          className="p-5 bg-notice border-2 border-border-input rounded-xl text-ink print:hidden"
        >
          <p className="font-bold text-[1.111rem] m-0">
            No los imprimas todavía
          </p>
          <p className="text-[1rem] mt-1 mb-0">
            Estos códigos apuntan a <strong>{datos.urlBase}</strong>, que solo
            funciona en este equipo. Pide que configuren la dirección pública
            (VITE_URL_PUBLICA) y vuelve a abrir esta página.
          </p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="p-5 bg-notice border-2 border-border-input rounded-xl text-ink"
        >
          <p className="font-bold text-[1.111rem] m-0">Atención</p>
          <p className="text-[1rem] mt-1 mb-0">{error}</p>
        </div>
      )}

      {!error && tarjetas.length === 0 && (
        <p className="text-[1.111rem] text-muted" role="status">
          Preparando los códigos…
        </p>
      )}

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-2 list-none p-0 m-0">
        {tarjetas.map((tarjeta) => (
          <li
            key={tarjeta.url}
            className="bg-surface border-2 border-border-subtle rounded-2xl p-5 flex flex-col items-center gap-3 text-center break-inside-avoid"
          >
            <span className="text-[0.889rem] font-bold uppercase tracking-wider text-primary">
              {ETIQUETA[tarjeta.tipo]}
            </span>
            <h2 className="text-[1.333rem] font-bold text-navy m-0">
              {tarjeta.titulo}
            </h2>
            <img
              src={tarjeta.imagen}
              alt={`Código QR que abre ${tarjeta.titulo}`}
              width={220}
              height={220}
              className="w-55 h-55 bg-white"
            />
            <p className="text-[0.889rem] text-ink break-all m-0">
              {tarjeta.url}
            </p>
            <a
              href={tarjeta.imagen}
              download={nombreArchivo(tarjeta)}
              className={`${boton} print:hidden`}
            >
              Descargar código de «{tarjeta.titulo}»
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
