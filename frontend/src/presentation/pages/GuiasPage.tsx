import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import type { Categoria, Guia } from '../../domain/guias/types';
import { container } from '../../main/container';

function getCategoryIcon(iconName?: string, slug?: string) {
  const identifier = iconName || slug || '';
  if (identifier.includes('mail') || identifier.includes('correo')) {
    return (
      <svg
        className="size-7 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    );
  }
  if (identifier.includes('search') || identifier.includes('busqueda')) {
    return (
      <svg
        className="size-7 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    );
  }
  if (identifier.includes('file') || identifier.includes('documento')) {
    return (
      <svg
        className="size-7 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    );
  }
  if (identifier.includes('user') || identifier.includes('redes')) {
    return (
      <svg
        className="size-7 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    );
  }
  // Default: Shield / Seguridad
  return (
    <svg
      className="size-7 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function getIconForGuide(slug: string, categoriaSlug?: string) {
  switch (slug) {
    case 'smishing':
      return (
        <svg
          className="size-8 text-[#0d6258]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      );
    case 'vishing':
      return (
        <svg
          className="size-8 text-[#0d6258]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
      );
    case 'quishing':
      return (
        <svg
          className="size-8 text-[#0d6258]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
          />
        </svg>
      );
    case 'falso-soporte-tecnico':
      return (
        <svg
          className="size-8 text-[#0d6258]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      );
    default:
      return (
        <div className="text-[#0d6258]">
          {getCategoryIcon(undefined, categoriaSlug)}
        </div>
      );
  }
}

export function GuiasPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [guias, setGuias] = useState<Guia[]>([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [cargandoGuias, setCargandoGuias] = useState(true);

  const categoriaSeleccionada =
    searchParams.get('categoria') || 'seguridad-digital';

  // Cargar categorías disponibles (HU-09)
  useEffect(() => {
    let cancelado = false;
    container.guias.listarCategorias
      .ejecutar()
      .then((data) => {
        if (!cancelado) {
          setCategorias(data);
          setCargandoCategorias(false);
        }
      })
      .catch(() => {
        if (!cancelado) {
          setCargandoCategorias(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, []);

  // Cargar guías de la categoría seleccionada
  useEffect(() => {
    let cancelado = false;
    container.guias.listar
      .ejecutar(categoriaSeleccionada)
      .then((data) => {
        if (!cancelado) {
          setGuias(data);
          setCargandoGuias(false);
        }
      })
      .catch(() => {
        if (!cancelado) {
          setGuias([]);
          setCargandoGuias(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [categoriaSeleccionada]);

  const handleSeleccionarCategoria = (slug: string) => {
    if (slug === categoriaSeleccionada) return;
    setCargandoGuias(true);
    setSearchParams({ categoria: slug });
  };

  const categoriaActual = categorias.find(
    (c) => c.slug === categoriaSeleccionada,
  ) || {
    slug: categoriaSeleccionada,
    nombre: 'Seguridad digital',
    numero: '01 / CATEGORÍA',
    descripcion:
      'Reconoce los engaños antes de actuar. Algunas personas se hacen pasar por alguien de confianza para pedirte datos o dinero. Aprende a reconocer sus señales en mensajes, llamadas, códigos QR y alertas falsas.',
  };

  return (
    <main
      id="contenido"
      className="max-w-360 mx-auto px-4 md:px-12 lg:px-24 py-8 md:py-12 flex flex-col gap-10"
    >
      {/* Encabezado del catálogo de guías */}
      <section className="flex flex-col gap-4">
        <h1 className="text-[2rem] md:text-[2.444rem] font-bold leading-[1.2] text-[#17324d]">
          Guías paso a paso para aprender con tranquilidad
        </h1>
        <p className="text-[1.111rem] md:text-[1.222rem] text-[#526575] max-w-200">
          Elige una categoría y el tema por dónde empezar. Puedes repetir cada
          guía las veces que quieras y avanzar con calma, a tu propio ritmo.
        </p>
      </section>

      {/* Navegación por categorías (HU-09) */}
      <section aria-label="Categorías temáticas de aprendizaje">
        <h2 className="sr-only">Selecciona una categoría</h2>
        {cargandoCategorias ? (
          <div className="p-4 text-[1.111rem] text-[#526575]" role="status">
            Cargando temas de aprendizaje...
          </div>
        ) : (
          <div
            role="tablist"
            aria-label="Categorías disponibles"
            className="flex flex-wrap gap-3 items-center"
          >
            {categorias.map((cat) => {
              const estaActiva = cat.slug === categoriaSeleccionada;
              return (
                <button
                  key={cat.slug}
                  role="tab"
                  aria-selected={estaActiva}
                  onClick={() => handleSeleccionarCategoria(cat.slug)}
                  className={`inline-flex items-center gap-2.5 min-h-14 px-5 py-3 rounded-xl font-semibold text-[1.05rem] transition-colors cursor-pointer border-2 ${
                    estaActiva
                      ? 'bg-[#0d6258] text-white border-[#0d6258] shadow-sm'
                      : 'bg-white text-[#17324d] border-[#d7e2e7] hover:border-[#0d6258] hover:bg-[#f1f5f9]'
                  }`}
                >
                  <span aria-hidden="true">
                    {getCategoryIcon(cat.icono, cat.slug)}
                  </span>
                  <span>{cat.nombre}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Banner explicativo de la categoría activa */}
      <section
        className="bg-[#e7f2ee] border-2 border-[#c2ded3] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-start"
        aria-label={`Información de la categoría ${categoriaActual.nombre}`}
      >
        <div className="bg-white border border-[#d7e2e7] rounded-xl p-4 shrink-0 flex flex-col gap-1">
          <p className="text-[0.95rem] font-bold text-[#0d6258] tracking-wider uppercase m-0">
            {categoriaActual.numero || 'CATEGORÍA'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[#0d6258]">
              {getCategoryIcon(categoriaActual.icono, categoriaActual.slug)}
            </span>
            <p className="text-[1.5rem] font-bold text-[#17324d] m-0">
              {categoriaActual.nombre}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-[1.333rem] md:text-[1.5rem] font-bold text-[#17324d] m-0">
            Aprende sobre {categoriaActual.nombre.toLowerCase()}.
          </h2>
          <p className="text-[1.111rem] text-[#253b38] leading-relaxed m-0">
            {categoriaActual.descripcion}
          </p>
        </div>
      </section>

      {/* Lista de guías publicadas */}
      <section aria-label={`Guías disponibles de ${categoriaActual.nombre}`}>
        {cargandoGuias ? (
          <div
            className="p-12 text-center text-[1.111rem] text-[#526575]"
            role="status"
          >
            Cargando guías educativas...
          </div>
        ) : guias.length === 0 ? (
          /* AC-HU09-03: mensaje literal cuando no hay guías */
          <div
            className="bg-white border-2 border-[#d7e2e7] rounded-2xl p-12 text-center flex flex-col items-center gap-4"
            role="status"
          >
            <p className="text-[1.333rem] font-bold text-[#17324d] m-0">
              Pronto habrá guías en esta sección
            </p>
            <p className="text-[1.111rem] text-[#526575] max-w-125 m-0">
              Estamos preparando nuevos contenidos educativos para ayudarte a
              navegar con seguridad.
            </p>
            <Link
              to="/ayuda"
              className="mt-2 inline-flex items-center justify-center min-h-14 px-8 font-semibold text-[#0d6258] bg-white border-2 border-[#0d6258] rounded-xl hover:bg-[#e7f2ee] no-underline"
            >
              Pedir orientación en la sala
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {guias.map((guia) => (
              <article
                key={guia.slug}
                className="bg-white border border-[#d7e2e7] rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between w-full">
                  <div
                    className="bg-[#e7f2ee] p-3 rounded-xl shrink-0"
                    aria-hidden="true"
                  >
                    {getIconForGuide(guia.slug, guia.categoriaSlug)}
                  </div>
                  <span className="text-[1.111rem] font-medium text-[#526575]">
                    {guia.numero}
                  </span>
                </div>

                <h3 className="text-[1.333rem] font-bold leading-[1.35] text-[#17324d] min-h-[2.8em] m-0">
                  {guia.titulo}
                </h3>

                <p className="text-[1.111rem] text-[#526575] leading-normal flex-1 m-0">
                  {guia.descripcion}
                </p>

                <p className="text-[1rem] font-medium text-[#526575] m-0">
                  {guia.duracionEstimadaMinutos} minutos · A tu ritmo
                </p>

                <Link
                  to={`/guias/${guia.slug}`}
                  className="mt-2 w-full inline-flex items-center justify-center min-h-14 px-6 py-4 font-semibold text-[#0d6258] bg-white border border-[#d7e2e7] rounded-xl hover:bg-[#eef4f4] hover:border-[#0d6258] no-underline cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#0d6258]/30 transition-colors"
                >
                  Comenzar guía
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Cierre institucional de apoyo */}
      <section
        className="bg-[#17324d] text-white rounded-2xl p-8 md:p-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
        aria-label="Acompañamiento y soporte"
      >
        <div className="flex flex-col gap-2 max-w-175">
          <h2 className="text-[1.444rem] md:text-[1.666rem] font-bold m-0">
            No tienes que aprender a solas.
          </h2>
          <p className="text-[1.111rem] text-slate-200 m-0">
            Si algo no está claro, un monitor del CLENA puede acompañarte paso a
            paso.
          </p>
        </div>
        <Link
          to="/ayuda"
          className="inline-flex items-center justify-center min-h-14 px-8 py-4 font-semibold text-[#17324d] bg-white rounded-xl hover:bg-slate-100 no-underline cursor-pointer shrink-0 focus:outline-none focus:ring-4 focus:ring-white/50"
        >
          Solicitar ayuda
        </Link>
      </section>
    </main>
  );
}
