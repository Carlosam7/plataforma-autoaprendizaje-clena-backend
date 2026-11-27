import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import {
  GuiaResultadosPage,
  type ResultadosLocationState,
} from './GuiaResultadosPage';

function renderizarResultados(slug: string, state?: ResultadosLocationState) {
  const entry = state
    ? { pathname: `/guias/${slug}/resultados`, state }
    : `/guias/${slug}/resultados`;

  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route
          path="/guias/:slug/resultados"
          element={<GuiaResultadosPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('GuiaResultadosPage (FE-02)', () => {
  it('deep-link sin estado muestra "No hay un resultado disponible" y nunca 4/5', () => {
    const html = renderizarResultados('smishing');

    expect(html).toContain('No hay un resultado disponible');
    expect(html).toContain('Volver a la práctica');
    expect(html).toContain('href="/guias/smishing/practica"');
    expect(html).toContain('href="/guias/smishing"');
    expect(html).not.toContain('4 de 5');
    expect(html).not.toContain('80 %');
  });

  it('estado inválido muestra "No hay un resultado disponible"', () => {
    const html = renderizarResultados('smishing', {
      totalPreguntas: 0,
      respuestasCorrectas: 0,
    });

    expect(html).toContain('No hay un resultado disponible');
    expect(html).not.toContain('4 de 5');
  });

  it('representa el resultado devuelto por C-03 para usuario registrado aprobado (70 %)', () => {
    const html = renderizarResultados('smishing', {
      esInvitado: false,
      resultado: {
        respuestasCorrectas: 7,
        totalPreguntas: 10,
        porcentaje: 70,
        aprobado: true,
        porcentajeAprobacion: 70,
      },
    });

    expect(html).toContain('7 de 10');
    expect(html).toContain('70 %');
    expect(html).toContain('Actividad aprobada');
    expect(html).toContain('Se aprueba con al menos el 70 %');
    expect(html).toContain('Repetir práctica');
    expect(html).toContain('href="/guias/smishing/practica"');
    expect(html).toContain('Volver a la guía');
    expect(html).toContain('href="/guias/smishing"');
    expect(html).not.toContain('¿Quieres guardar este logro?');
  });

  it('representa resultado 0/N y no aprobado (69 % con umbral 70 %) para invitado', () => {
    const htmlCero = renderizarResultados('vishing', {
      esInvitado: true,
      totalPreguntas: 4,
      respuestasCorrectas: 0,
      porcentajeAprobacion: 70,
    });
    expect(htmlCero).toContain('0 de 4');
    expect(htmlCero).toContain('0 %');
    expect(htmlCero).toContain('Por reforzar');
    expect(htmlCero).toContain('¿Quieres guardar este logro?');

    const html69 = renderizarResultados('vishing', {
      esInvitado: true,
      totalPreguntas: 100,
      respuestasCorrectas: 69,
      porcentajeAprobacion: 70,
    });
    expect(html69).toContain('69 de 100');
    expect(html69).toContain('69 %');
    expect(html69).toContain('Por reforzar');
  });

  it('representa 100 % con umbral personalizado del backend', () => {
    const html = renderizarResultados('quishing', {
      esInvitado: false,
      resultado: {
        respuestasCorrectas: 3,
        totalPreguntas: 3,
        porcentaje: 100,
        aprobado: true,
        porcentajeAprobacion: 80,
      },
    });

    expect(html).toContain('3 de 3');
    expect(html).toContain('100 %');
    expect(html).toContain('Actividad aprobada');
    expect(html).toContain('Se aprueba con al menos el 80 %');
  });

  it('acepta el formato plano emitido por GuiaPracticaPage (total, aciertos, porcentaje, aprobado, modo)', () => {
    const htmlRegistrado = renderizarResultados('smishing', {
      total: 5,
      aciertos: 4,
      porcentaje: 80,
      aprobado: true,
      porcentajeAprobacion: 70,
      modo: 'REGISTRADO',
    });
    expect(htmlRegistrado).toContain('4 de 5');
    expect(htmlRegistrado).toContain('80 %');
    expect(htmlRegistrado).toContain('Actividad aprobada');
    expect(htmlRegistrado).not.toContain('¿Quieres guardar este logro?');

    const htmlInvitado = renderizarResultados('smishing', {
      total: 4,
      aciertos: 2,
      porcentaje: 50,
      aprobado: false,
      porcentajeAprobacion: 70,
      modo: 'INVITADO',
    });
    expect(htmlInvitado).toContain('2 de 4');
    expect(htmlInvitado).toContain('50 %');
    expect(htmlInvitado).toContain('Por reforzar');
    expect(htmlInvitado).toContain('¿Quieres guardar este logro?');
  });
});
