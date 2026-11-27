import type { BloqueGuia, PasoGuia } from '@/domain/gestion/types';
import { LIMITES } from '@/domain/gestion/types';

const campo =
  'w-full p-3 text-[1.111rem] bg-white border-2 border-border-input rounded-xl text-ink focus:outline-none focus:ring-4 focus:ring-primary/20';
const botonChico =
  'inline-flex items-center justify-center min-h-11 px-4 rounded-xl font-semibold border-2 bg-btn-secondary-bg text-btn-secondary-fg border-btn-secondary-border hover:border-btn-secondary-hover-border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

export interface EditorPasosProps {
  pasos: PasoGuia[];
  onChange: (pasos: PasoGuia[]) => void;
  /** Mensajes de error por paso: clave `paso-1`, `paso-2`, … */
  errores?: Record<string, string[]>;
}

function mover<T>(lista: T[], desde: number, hasta: number): T[] {
  const copia = [...lista];
  const [elemento] = copia.splice(desde, 1);
  copia.splice(hasta, 0, elemento);
  return copia;
}

const NOMBRE_BLOQUE: Record<BloqueGuia['tipo'], string> = {
  texto: 'Texto',
  aviso: 'Aviso',
  imagen: 'Imagen',
};

/**
 * HU-13, HU-15 (FE-05): los pasos de una guía, en orden. Cada paso tiene un título
 * opcional y sus bloques (texto, aviso o una imagen que ya existe). Se pueden agregar,
 * quitar y reordenar con botones (sin arrastrar, para usarlo con teclado).
 */
export function EditorPasos({
  pasos,
  onChange,
  errores = {},
}: EditorPasosProps) {
  const cambiarPaso = (i: number, paso: PasoGuia) =>
    onChange(pasos.map((p, j) => (j === i ? paso : p)));
  const cambiarBloque = (i: number, b: number, bloque: BloqueGuia) =>
    cambiarPaso(i, {
      ...pasos[i],
      bloques: pasos[i].bloques.map((x, k) => (k === b ? bloque : x)),
    });
  const agregarBloque = (i: number, bloque: BloqueGuia) =>
    cambiarPaso(i, { ...pasos[i], bloques: [...pasos[i].bloques, bloque] });

  return (
    <div className="flex flex-col gap-6">
      <ol className="list-none p-0 m-0 flex flex-col gap-6">
        {pasos.map((paso, i) => {
          const n = i + 1;
          const erroresPaso = errores[`paso-${n}`] ?? [];
          const idError = `errores-paso-${n}`;
          return (
            <li key={paso.id ?? `nuevo-${i}`}>
              <fieldset
                aria-describedby={erroresPaso.length ? idError : undefined}
                className="bg-surface border-2 border-border-subtle rounded-2xl p-5 flex flex-col gap-4"
              >
                <legend className="px-2 text-[1.333rem] font-bold text-navy">
                  Paso {n}
                </legend>
                {erroresPaso.length > 0 && (
                  <ul
                    id={idError}
                    className="p-3 bg-notice border-2 border-border-input rounded-xl text-ink m-0 pl-8"
                  >
                    {erroresPaso.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor={`paso-${n}-titulo`}
                    className="font-semibold text-navy"
                  >
                    Título del paso (opcional)
                  </label>
                  <input
                    id={`paso-${n}-titulo`}
                    value={paso.titulo ?? ''}
                    maxLength={LIMITES.tituloPaso}
                    onChange={(e) =>
                      cambiarPaso(i, { ...paso, titulo: e.target.value })
                    }
                    className={campo}
                  />
                </div>

                {paso.bloques.map((bloque, b) => {
                  const idBloque = `paso-${n}-bloque-${b + 1}`;
                  const etiqueta = `${NOMBRE_BLOQUE[bloque.tipo]} ${b + 1} del paso ${n}`;
                  return (
                    <div
                      key={b}
                      className="flex flex-col gap-2 border-l-4 border-border-input pl-4"
                    >
                      {bloque.tipo === 'imagen' ? (
                        <>
                          <p className="font-semibold text-navy m-0">
                            {etiqueta}
                          </p>
                          {bloque.url ? (
                            <img
                              src={bloque.url}
                              alt={bloque.textoAlternativo}
                              className="max-w-80 border-2 border-border-subtle rounded-xl"
                            />
                          ) : (
                            <p className="text-muted m-0">
                              Esta imagen ya no existe: quítala del paso.
                            </p>
                          )}
                          <label
                            htmlFor={`${idBloque}-alt`}
                            className="font-semibold text-navy"
                          >
                            Descripción de la imagen (para quien no puede verla)
                          </label>
                          <input
                            id={`${idBloque}-alt`}
                            value={bloque.textoAlternativo}
                            maxLength={LIMITES.textoAlternativo}
                            onChange={(e) =>
                              cambiarBloque(i, b, {
                                ...bloque,
                                textoAlternativo: e.target.value,
                              })
                            }
                            className={campo}
                          />
                        </>
                      ) : (
                        <>
                          {bloque.tipo === 'aviso' && (
                            <>
                              <label
                                htmlFor={`${idBloque}-nivel`}
                                className="font-semibold text-navy"
                              >
                                Tipo de aviso del bloque {b + 1} del paso {n}
                              </label>
                              <select
                                id={`${idBloque}-nivel`}
                                value={bloque.nivel}
                                onChange={(e) =>
                                  cambiarBloque(i, b, {
                                    ...bloque,
                                    nivel: e.target.value as
                                      'consejo' | 'alerta',
                                  })
                                }
                                className={campo}
                              >
                                <option value="consejo">Consejo</option>
                                <option value="alerta">Alerta</option>
                              </select>
                            </>
                          )}
                          <label
                            htmlFor={`${idBloque}-texto`}
                            className="font-semibold text-navy"
                          >
                            {etiqueta}
                          </label>
                          <textarea
                            id={`${idBloque}-texto`}
                            value={bloque.texto}
                            rows={3}
                            maxLength={LIMITES.textoBloque}
                            onChange={(e) =>
                              cambiarBloque(i, b, {
                                ...bloque,
                                texto: e.target.value,
                              })
                            }
                            className={campo}
                          />
                        </>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={b === 0}
                          onClick={() =>
                            cambiarPaso(i, {
                              ...paso,
                              bloques: mover(paso.bloques, b, b - 1),
                            })
                          }
                          className={botonChico}
                          aria-label={`Subir ${etiqueta}`}
                        >
                          ↑ Subir
                        </button>
                        <button
                          type="button"
                          disabled={b === paso.bloques.length - 1}
                          onClick={() =>
                            cambiarPaso(i, {
                              ...paso,
                              bloques: mover(paso.bloques, b, b + 1),
                            })
                          }
                          className={botonChico}
                          aria-label={`Bajar ${etiqueta}`}
                        >
                          ↓ Bajar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            cambiarPaso(i, {
                              ...paso,
                              bloques: paso.bloques.filter((_, k) => k !== b),
                            })
                          }
                          className={botonChico}
                          aria-label={`Quitar ${etiqueta}`}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={paso.bloques.length >= LIMITES.bloquesPorPaso}
                    onClick={() =>
                      agregarBloque(i, { tipo: 'texto', texto: '' })
                    }
                    className={botonChico}
                    aria-label={`Agregar un texto al paso ${n}`}
                  >
                    + Texto
                  </button>
                  <button
                    type="button"
                    disabled={paso.bloques.length >= LIMITES.bloquesPorPaso}
                    onClick={() =>
                      agregarBloque(i, {
                        tipo: 'aviso',
                        nivel: 'consejo',
                        texto: '',
                      })
                    }
                    className={botonChico}
                    aria-label={`Agregar un aviso al paso ${n}`}
                  >
                    + Aviso
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 border-t-2 border-border-subtle pt-4">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => onChange(mover(pasos, i, i - 1))}
                    className={botonChico}
                    aria-label={`Mover el paso ${n} antes`}
                  >
                    ↑ Mover antes
                  </button>
                  <button
                    type="button"
                    disabled={i === pasos.length - 1}
                    onClick={() => onChange(mover(pasos, i, i + 1))}
                    className={botonChico}
                    aria-label={`Mover el paso ${n} después`}
                  >
                    ↓ Mover después
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(pasos.filter((_, j) => j !== i))}
                    className={botonChico}
                    aria-label={`Quitar el paso ${n}`}
                  >
                    Quitar paso
                  </button>
                </div>
              </fieldset>
            </li>
          );
        })}
      </ol>
      <div>
        <button
          type="button"
          disabled={pasos.length >= LIMITES.pasos}
          onClick={() =>
            onChange([
              ...pasos,
              { titulo: '', bloques: [{ tipo: 'texto', texto: '' }] },
            ])
          }
          className={botonChico}
        >
          + Agregar paso
        </button>
      </div>
    </div>
  );
}
