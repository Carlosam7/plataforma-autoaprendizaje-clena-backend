import { beforeEach, describe, expect, it } from 'vitest';
import {
  GuiaNoEncontradaError,
  GuiaNoPublicadaError,
  GuiaSinPasosError,
} from '../../../domain/guia/errores.js';
import { GuiaEditable } from '../../../domain/guia/guia-editable.js';
import {
  CriterioGestionGuias,
  GuiaGestionada,
  GuiaGestionRepository,
} from '../../../domain/guia/guia-gestion.repository.js';
import { ImagenRepository } from '../../../domain/imagen/imagen.repository.js';
import { DatoInvalidoError } from '../../../domain/shared/error-de-negocio.js';
import { Pagina } from '../../../domain/shared/pagina.js';
import {
  GeneradorIdSecuencial,
  RelojFijo,
} from '../../auth/__tests__/fakes.js';
import {
  OcultarGuiaUseCase,
  PublicarGuiaUseCase,
} from '../cambiar-estado-guia.use-cases.js';
import {
  ListarGuiasGestionUseCase,
  ObtenerGuiaGestionUseCase,
} from '../consultar-guias-gestion.use-cases.js';
import {
  CrearGuiaUseCase,
  GuardarGuiaComando,
} from '../crear-guia.use-case.js';
import { EditarGuiaUseCase } from '../editar-guia.use-case.js';

const AHORA = new Date('2026-11-13T15:00:00.000Z');
const NOMBRES: Record<string, string> = { ana: 'Ana Pérez', luis: 'Luis Díaz' };
const IMAGEN = '0b0e4d4e-6f0a-4c1d-9a51-3a2f6f0c1a11';
const IMAGEN_BORRADA = '0b0e4d4e-6f0a-4c1d-9a51-3a2f6f0c1a99';

class GuiaGestionRepositoryEnMemoria extends GuiaGestionRepository {
  guias = new Map<string, GuiaEditable>();
  recibido?: CriterioGestionGuias;

  private gestionada(guia: GuiaEditable): GuiaGestionada {
    return {
      guia,
      creadaPor: NOMBRES[guia.creadaPorId],
      actualizadaPor: NOMBRES[guia.actualizadaPorId],
      creadoEn: AHORA,
      actualizadoEn: AHORA,
    };
  }
  listar(criterio: CriterioGestionGuias): Promise<Pagina<GuiaGestionada>> {
    this.recibido = criterio;
    const elementos = [...this.guias.values()].map((g) => this.gestionada(g));
    return Promise.resolve({ elementos, total: elementos.length });
  }
  buscar(slug: string): Promise<GuiaGestionada | null> {
    const guia = this.guias.get(slug);
    return Promise.resolve(guia ? this.gestionada(guia) : null);
  }
  existeSlug(slug: string): Promise<boolean> {
    return Promise.resolve(this.guias.has(slug));
  }
  existeCategoria(slug: string): Promise<boolean> {
    return Promise.resolve(slug === 'correo-electronico');
  }
  guardar(guia: GuiaEditable): Promise<void> {
    this.guias.set(guia.slug, guia);
    return Promise.resolve();
  }
}

class ImagenRepositoryEnMemoria extends ImagenRepository {
  urlsPorId(ids: readonly string[]): Promise<Map<string, string>> {
    return Promise.resolve(
      new Map(
        ids
          .filter((id) => id === IMAGEN)
          .map((id) => [id, '/archivos/sms.png']),
      ),
    );
  }
}

const DATOS: GuardarGuiaComando = {
  titulo: 'Enviar un correo',
  objetivo: 'Al terminar sabrás enviar un correo.',
  descripcion: null,
  categoriaSlug: 'correo-electronico',
  nivel: 'BASICO',
  duracionEstimadaMin: 10,
  palabrasClave: ['email'],
};
const paso = (texto: string, id?: string) => ({
  id,
  bloques: [{ tipo: 'texto', texto }],
});
const conImagen = (imagenId: string) => ({
  bloques: [{ tipo: 'imagen', imagenId, textoAlternativo: 'Un SMS falso' }],
});

describe('HU-13, HU-15 · Gestión de guías', () => {
  let guias: GuiaGestionRepositoryEnMemoria;
  let crear: CrearGuiaUseCase;
  let editar: EditarGuiaUseCase;
  let publicar: PublicarGuiaUseCase;
  let ocultar: OcultarGuiaUseCase;

  beforeEach(() => {
    guias = new GuiaGestionRepositoryEnMemoria();
    const imagenes = new ImagenRepositoryEnMemoria();
    const ids = new GeneradorIdSecuencial();
    crear = new CrearGuiaUseCase(guias, imagenes, ids);
    editar = new EditarGuiaUseCase(guias, imagenes, ids);
    publicar = new PublicarGuiaUseCase(guias, imagenes, new RelojFijo(AHORA));
    ocultar = new OcultarGuiaUseCase(guias, imagenes);
  });

  describe('CrearGuiaUseCase', () => {
    it('crea la guía en borrador, con el slug de su título y quién la creó', async () => {
      const guia = await crear.ejecutar(DATOS, 'ana');
      expect(guia).toEqual({
        slug: 'enviar-un-correo',
        categoria: 'correo-electronico',
        titulo: 'Enviar un correo',
        objetivo: 'Al terminar sabrás enviar un correo.',
        descripcion: null,
        nivel: 'BASICO',
        duracionEstimadaMin: 10,
        palabrasClave: ['email'],
        estado: 'BORRADOR',
        totalPasos: 0,
        pasos: [],
        publicadaEn: null,
        creadaPor: 'Ana Pérez',
        actualizadaPor: 'Ana Pérez',
        creadoEn: AHORA,
        actualizadoEn: AHORA,
      });
    });

    it('si el slug ya está en uso le agrega un número', async () => {
      await crear.ejecutar(DATOS, 'ana');
      const segunda = await crear.ejecutar(DATOS, 'ana');
      const tercera = await crear.ejecutar(DATOS, 'ana');
      expect([segunda.slug, tercera.slug]).toEqual([
        'enviar-un-correo-2',
        'enviar-un-correo-3',
      ]);
    });

    it('puede crearse ya con pasos, numerados en orden', async () => {
      const guia = await crear.ejecutar(
        { ...DATOS, pasos: [paso('Abre el correo'), paso('Escribe')] },
        'ana',
      );
      expect(guia.totalPasos).toBe(2);
      expect(guia.pasos.map((p) => [p.orden, p.bloques[0]])).toEqual([
        [1, { tipo: 'texto', texto: 'Abre el correo' }],
        [2, { tipo: 'texto', texto: 'Escribe' }],
      ]);
    });

    it('rechaza una categoría que no existe y no guarda nada', async () => {
      await expect(
        crear.ejecutar({ ...DATOS, categoriaSlug: 'cocina' }, 'ana'),
      ).rejects.toMatchObject({ campo: 'categoria' });
      expect(guias.guias.size).toBe(0);
    });

    it('rechaza un paso con una imagen que no existe', async () => {
      await expect(
        crear.ejecutar({ ...DATOS, pasos: [conImagen(IMAGEN_BORRADA)] }, 'ana'),
      ).rejects.toThrow(DatoInvalidoError);
      expect(guias.guias.size).toBe(0);
    });
  });

  describe('EditarGuiaUseCase', () => {
    it('cambia los datos y quién la editó; el slug y quién la creó no cambian', async () => {
      await crear.ejecutar(DATOS, 'ana');
      const guia = await editar.ejecutar(
        'enviar-un-correo',
        { ...DATOS, titulo: 'Mandar un correo', nivel: 'INTERMEDIO' },
        'luis',
      );
      expect(guia).toMatchObject({
        slug: 'enviar-un-correo',
        titulo: 'Mandar un correo',
        nivel: 'INTERMEDIO',
        creadaPor: 'Ana Pérez',
        actualizadaPor: 'Luis Díaz',
      });
    });

    it('sin `pasos` no toca los pasos; con `pasos` los reemplaza conservando los ids', async () => {
      const creada = await crear.ejecutar(
        { ...DATOS, pasos: [paso('Uno'), paso('Dos')] },
        'ana',
      );
      const [uno, dos] = creada.pasos.map((p) => p.id);

      const sinTocar = await editar.ejecutar('enviar-un-correo', DATOS, 'ana');
      expect(sinTocar.pasos.map((p) => p.id)).toEqual([uno, dos]);

      // Reordena, edita «Uno» y agrega uno nuevo en medio.
      const editada = await editar.ejecutar(
        'enviar-un-correo',
        {
          ...DATOS,
          pasos: [paso('Dos', dos), paso('Nuevo'), paso('Uno editado', uno)],
        },
        'ana',
      );
      expect(editada.pasos.map((p) => p.orden)).toEqual([1, 2, 3]);
      expect(editada.pasos[0].id).toBe(dos);
      expect(editada.pasos[2]).toMatchObject({
        id: uno,
        bloques: [{ tipo: 'texto', texto: 'Uno editado' }],
      });
      expect([uno, dos]).not.toContain(editada.pasos[1].id);
    });

    it('falla si la guía no existe', async () => {
      await expect(editar.ejecutar('no-existe', DATOS, 'ana')).rejects.toThrow(
        GuiaNoEncontradaError,
      );
    });
  });

  describe('PublicarGuiaUseCase y OcultarGuiaUseCase', () => {
    it('una guía sin pasos no se publica', async () => {
      await crear.ejecutar(DATOS, 'ana');
      await expect(
        publicar.ejecutar('enviar-un-correo', 'ana'),
      ).rejects.toThrow(GuiaSinPasosError);
      expect(guias.guias.get('enviar-un-correo')?.estado).toBe('BORRADOR');
    });

    it('con un paso se publica, luego se oculta y se vuelve a publicar', async () => {
      await crear.ejecutar({ ...DATOS, pasos: [paso('Uno')] }, 'ana');

      const publicada = await publicar.ejecutar('enviar-un-correo', 'luis');
      expect(publicada).toMatchObject({
        estado: 'PUBLICADA',
        publicadaEn: AHORA,
        actualizadaPor: 'Luis Díaz',
      });

      const oculta = await ocultar.ejecutar('enviar-un-correo', 'ana');
      expect(oculta).toMatchObject({ estado: 'OCULTA', totalPasos: 1 });

      const otraVez = await publicar.ejecutar('enviar-un-correo', 'ana');
      expect(otraVez.estado).toBe('PUBLICADA');
    });

    it('un borrador no se puede ocultar', async () => {
      await crear.ejecutar(DATOS, 'ana');
      await expect(ocultar.ejecutar('enviar-un-correo', 'ana')).rejects.toThrow(
        GuiaNoPublicadaError,
      );
    });

    it('fallan si la guía no existe', async () => {
      await expect(publicar.ejecutar('no-existe', 'ana')).rejects.toThrow(
        GuiaNoEncontradaError,
      );
      await expect(ocultar.ejecutar('no-existe', 'ana')).rejects.toThrow(
        GuiaNoEncontradaError,
      );
    });
  });

  describe('consultas del personal', () => {
    it('el listado pasa el criterio y trae cada guía sin sus pasos', async () => {
      await crear.ejecutar({ ...DATOS, pasos: [paso('Uno')] }, 'ana');
      const criterio: CriterioGestionGuias = {
        estado: 'BORRADOR',
        ordenarPor: 'titulo',
        direccion: 'asc',
        pagina: 1,
        limite: 20,
      };

      const resultado = await new ListarGuiasGestionUseCase(guias).ejecutar(
        criterio,
      );

      expect(guias.recibido).toEqual(criterio);
      expect(resultado).toMatchObject({ total: 1, pagina: 1, limite: 20 });
      expect(resultado.datos[0]).toMatchObject({
        slug: 'enviar-un-correo',
        estado: 'BORRADOR',
        totalPasos: 1,
        creadaPor: 'Ana Pérez',
      });
      expect(resultado.datos[0]).not.toHaveProperty('pasos');
    });

    it('el detalle trae cada imagen con su id y su URL; null si ya no existe', async () => {
      await crear.ejecutar({ ...DATOS, pasos: [conImagen(IMAGEN)] }, 'ana');
      const obtener = new ObtenerGuiaGestionUseCase(
        guias,
        new ImagenRepositoryEnMemoria(),
      );

      expect(
        (await obtener.ejecutar('enviar-un-correo')).pasos[0].bloques,
      ).toEqual([
        {
          tipo: 'imagen',
          imagenId: IMAGEN,
          url: '/archivos/sms.png',
          textoAlternativo: 'Un SMS falso',
        },
      ]);
      await expect(obtener.ejecutar('no-existe')).rejects.toThrow(
        GuiaNoEncontradaError,
      );
    });
  });
});
