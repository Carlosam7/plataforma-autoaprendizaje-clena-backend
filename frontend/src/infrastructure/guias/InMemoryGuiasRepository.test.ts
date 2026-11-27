import { describe, expect, it } from 'vitest';
import { InMemoryGuiasRepository } from './InMemoryGuiasRepository';

describe('InMemoryGuiasRepository', () => {
  const repo = new InMemoryGuiasRepository();

  it('obtiene la categoría de seguridad digital / phishing (AC-HU09-01)', async () => {
    const cat = await repo.obtenerCategoria('seguridad-digital');
    expect(cat).not.toBeNull();
    expect(cat?.nombre).toBe('Seguridad digital');
    expect(cat?.numero).toBe('01 / CATEGORÍA');
  });

  it('lista las 5 categorías disponibles', async () => {
    const categorias = await repo.listarCategorias();
    expect(categorias).toHaveLength(5);
    const slugs = categorias.map((c) => c.slug);
    expect(slugs).toEqual([
      'seguridad-digital',
      'correo-electronico',
      'busqueda-internet',
      'documentos',
      'redes-sociales',
    ]);
  });

  it('lista las cuatro guías publicadas (AC-HU09-02)', async () => {
    const guias = await repo.listarGuiasPublicadas('phishing');
    expect(guias).toHaveLength(4);
    const slugs = guias.map((g) => g.slug);
    expect(slugs).toContain('smishing');
    expect(slugs).toContain('vishing');
    expect(slugs).toContain('quishing');
    expect(slugs).toContain('falso-soporte-tecnico');

    for (const g of guias) {
      expect(g.duracionEstimadaMinutos).toBeGreaterThan(0);
      expect(g.titulo).toBeTruthy();
      expect(g.descripcion).toBeTruthy();
      expect(g.estado).toBe('PUBLICADA');
    }
  });

  it('la guía de smishing tiene 5 pasos y al menos 5 preguntas de práctica (AC-HU10-01, AC-HU25-02)', async () => {
    const detalle = await repo.obtenerDetalleGuia('smishing');
    expect(detalle).not.toBeNull();
    expect(detalle?.pasos).toHaveLength(5);
    expect(detalle?.preguntas.length).toBeGreaterThanOrEqual(5);

    // AC-HU10-02: instrucción de máximo tres oraciones
    for (const paso of detalle!.pasos) {
      const oraciones = paso.contenido
        .split(/[.!?]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      expect(oraciones.length).toBeLessThanOrEqual(3);
    }
  });

  it('los mensajes simulados utilizan enlaces ficticios .invalid y textos alternativos (AC-HU25-04)', async () => {
    const detalle = await repo.obtenerDetalleGuia('smishing');
    expect(detalle).not.toBeNull();

    for (const paso of detalle!.pasos) {
      if (paso.ejemplo?.enlaceODetalle) {
        expect(paso.ejemplo.enlaceODetalle).not.toMatch(
          /https?:\/\/(?!.*invalid)/,
        );
      }
      if (paso.ejemplo) {
        expect(paso.ejemplo.textoAlternativo).toBeTruthy();
      }
    }

    for (const p of detalle!.preguntas) {
      expect(p.opciones.map((o) => o.id)).toEqual(['A', 'B', 'C']);
      expect(['A', 'B', 'C']).toContain(p.opcionCorrecta);
      expect(p.explicacion).toBeTruthy();
      expect(p.mensajeSimulado.textoAlternativo).toBeTruthy();
    }
  });
});
