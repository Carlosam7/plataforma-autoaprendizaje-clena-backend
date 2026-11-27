import { beforeEach, describe, expect, it } from 'vitest';
import {
  EquipoConSolicitudActivaError,
  SolicitudCerradaError,
  SolicitudDeOtroMonitorError,
  SolicitudModificadaError,
  SolicitudNoEncontradaError,
  SolicitudYaTomadaError,
} from '../../../domain/ayuda/errores.js';
import { SolicitudAyuda } from '../../../domain/ayuda/solicitud-ayuda.js';
import {
  CriterioSolicitudes,
  SolicitudAyudaRepository,
  SolicitudEnCola,
} from '../../../domain/ayuda/solicitud-ayuda.repository.js';
import { Pagina } from '../../../domain/shared/pagina.js';
import {
  GeneradorIdSecuencial,
  RelojFijo,
} from '../../auth/__tests__/fakes.js';
import {
  ResolverSolicitudAyudaUseCase,
  TomarSolicitudAyudaUseCase,
} from '../atender-solicitud-ayuda.use-cases.js';
import { CancelarSolicitudAyudaUseCase } from '../cancelar-solicitud-ayuda.use-case.js';
import {
  LlaveSolicitud,
  LlavesSolicitudAyuda,
} from '../llaves-solicitud-ayuda.port.js';
import { ListarSolicitudesAyudaUseCase } from '../listar-solicitudes-ayuda.use-case.js';
import { ObtenerSolicitudAyudaUseCase } from '../obtener-solicitud-ayuda.use-case.js';
import {
  SolicitarAyudaComando,
  SolicitarAyudaUseCase,
} from '../solicitar-ayuda.use-case.js';

/** Guarda las solicitudes en orden de llegada; conoce una guía publicada, «smishing», con 5 pasos. */
class SolicitudAyudaRepositoryEnMemoria extends SolicitudAyudaRepository {
  solicitudes: SolicitudAyuda[] = [];
  recibido?: CriterioSolicitudes;

  async crear(solicitud: SolicitudAyuda): Promise<boolean> {
    if (await this.buscarActivaDeEquipo(solicitud.equipo)) return false;
    this.solicitudes.push(solicitud);
    return true;
  }
  buscarActivaDeEquipo(equipo: string): Promise<SolicitudAyuda | null> {
    const activa = this.solicitudes.find(
      (s) => s.estaActiva && s.equipo.toLowerCase() === equipo.toLowerCase(),
    );
    return Promise.resolve(activa ?? null);
  }
  buscarPorId(id: string): Promise<SolicitudAyuda | null> {
    return Promise.resolve(this.solicitudes.find((s) => s.id === id) ?? null);
  }
  buscarEnCola(id: string): Promise<SolicitudEnCola | null> {
    const solicitud = this.solicitudes.find((s) => s.id === id);
    return Promise.resolve(solicitud ? this.enCola(solicitud) : null);
  }
  /** true: simula que otra petición cambió la solicitud justo antes de guardar. */
  otraPeticionGano = false;
  guardar(): Promise<boolean> {
    return Promise.resolve(!this.otraPeticionGano);
  }
  private enCola(solicitud: SolicitudAyuda): SolicitudEnCola {
    return {
      solicitud,
      guia: solicitud.guiaId ? { slug: 'smishing', titulo: 'Smishing' } : null,
      pasoOrden: solicitud.pasoId ? 3 : null,
      atendidaPor: solicitud.atendidaPorId
        ? MONITORES[solicitud.atendidaPorId]
        : null,
    };
  }
  posicionEnCola(solicitud: SolicitudAyuda): Promise<number> {
    const pendientes = this.solicitudes.filter((s) => s.estado === 'PENDIENTE');
    return Promise.resolve(pendientes.indexOf(solicitud) + 1);
  }
  buscarContexto(guiaSlug: string, pasoOrden?: number) {
    if (guiaSlug !== 'smishing') return Promise.resolve(null);
    const existe = pasoOrden !== undefined && pasoOrden <= 5;
    return Promise.resolve({
      guiaId: 'guia-smishing',
      pasoId: existe ? `paso-${pasoOrden}` : null,
    });
  }
  listar(criterio: CriterioSolicitudes): Promise<Pagina<SolicitudEnCola>> {
    this.recibido = criterio;
    return Promise.resolve({
      elementos: this.solicitudes.map((s) => this.enCola(s)),
      total: this.solicitudes.length,
    });
  }
}

/** Llaves legibles: las válidas empiezan por «llave-» y su huella es «huella:<llave>». */
class LlavesFalsas extends LlavesSolicitudAyuda {
  private entregadas = 0;
  nueva(): LlaveSolicitud {
    const llave = `llave-nueva-${++this.entregadas}`;
    return { llave, huella: `huella:${llave}` };
  }
  huellaDe(llave: string): string | null {
    return llave.startsWith('llave-') ? `huella:${llave}` : null;
  }
}

/** La llave del navegador desde el que se piden casi todas las solicitudes de las pruebas. */
const NAVEGADOR = 'llave-navegador-a';
const OTRO_NAVEGADOR = 'llave-navegador-b';

const AHORA = new Date('2026-11-13T15:00:00.000Z');
const MONITORES: Record<string, string> = {
  ana: 'Ana Pérez',
  luis: 'Luis Díaz',
};
const USUARIO = { id: '41234567', rol: 'USUARIO_PUBLICO' as const };

describe('HU-29 · Solicitar ayuda presencial', () => {
  let solicitudes: SolicitudAyudaRepositoryEnMemoria;
  let reloj: RelojFijo;
  let solicitar: SolicitarAyudaUseCase;
  let cancelar: CancelarSolicitudAyudaUseCase;
  let obtener: ObtenerSolicitudAyudaUseCase;

  beforeEach(() => {
    solicitudes = new SolicitudAyudaRepositoryEnMemoria();
    reloj = new RelojFijo(AHORA);
    const llaves = new LlavesFalsas();
    solicitar = new SolicitarAyudaUseCase(
      solicitudes,
      new GeneradorIdSecuencial(),
      reloj,
      llaves,
    );
    cancelar = new CancelarSolicitudAyudaUseCase(solicitudes, reloj, llaves);
    obtener = new ObtenerSolicitudAyudaUseCase(solicitudes, llaves);
  });

  /** Pide ayuda sin cuenta desde el navegador con la llave NAVEGADOR. */
  const pedir = async (
    comando: SolicitarAyudaComando,
    usuario: Parameters<SolicitarAyudaUseCase['ejecutar']>[1] = null,
  ) => (await solicitar.ejecutar(comando, usuario, NAVEGADOR)).solicitud;

  describe('SolicitarAyudaUseCase', () => {
    it('sin cuenta: crea la solicitud pendiente y dice el puesto en la cola', async () => {
      const resultado = await pedir({ equipo: '12', tema: 'CORREO' });
      expect(resultado).toEqual({
        id: 'id-1',
        equipo: '12',
        tema: 'CORREO',
        estado: 'PENDIENTE',
        posicion: 1,
        creadaEn: AHORA,
        yaExistia: false,
      });
      expect(solicitudes.solicitudes[0].usuarioId).toBeNull();
    });

    it('el puesto en la cola cuenta las solicitudes que llegaron antes', async () => {
      await pedir({ equipo: '12', tema: 'CORREO' });
      const segunda = await pedir({ equipo: '7', tema: 'IMPRESION' });
      expect(segunda.posicion).toBe(2);
    });

    it('incluye la guía y el paso donde estaba la persona', async () => {
      await pedir({
        equipo: '12',
        tema: 'OTRO',
        guiaSlug: 'smishing',
        pasoOrden: 3,
      });
      expect(solicitudes.solicitudes[0]).toMatchObject({
        guiaId: 'guia-smishing',
        pasoId: 'paso-3',
      });
    });

    it('si la guía no existe, igual se crea la solicitud, sin guía', async () => {
      const { yaExistia } = await pedir({
        equipo: '12',
        tema: 'OTRO',
        guiaSlug: 'no-existe',
        pasoOrden: 3,
      });
      expect(yaExistia).toBe(false);
      expect(solicitudes.solicitudes[0]).toMatchObject({
        guiaId: null,
        pasoId: null,
      });
    });

    it('el mismo equipo no crea una duplicada: recibe la que ya tenía', async () => {
      const primera = await pedir({ equipo: 'Equipo 12', tema: 'CORREO' });
      const repetida = await pedir({
        equipo: '  equipo   12 ',
        tema: 'IMPRESION',
      });
      expect(repetida).toMatchObject({
        id: primera.id,
        tema: 'CORREO',
        yaExistia: true,
      });
      expect(solicitudes.solicitudes).toHaveLength(1);
    });

    it('después de cancelar, el equipo puede volver a pedir ayuda', async () => {
      const primera = await pedir({ equipo: '12', tema: 'CORREO' });
      await cancelar.ejecutar(primera.id, NAVEGADOR);
      const nueva = await pedir({ equipo: '12', tema: 'CORREO' });
      expect(nueva).toMatchObject({ yaExistia: false, posicion: 1 });
      expect(nueva.id).not.toBe(primera.id);
    });

    it('con sesión de usuario público queda asociada a su cuenta; con la del personal, no', async () => {
      await pedir({ equipo: '1', tema: 'OTRO' }, USUARIO);
      await pedir(
        { equipo: '2', tema: 'OTRO' },
        { id: 'uuid-personal', rol: 'PERSONAL' },
      );
      expect(solicitudes.solicitudes.map((s) => s.usuarioId)).toEqual([
        '41234567',
        null,
      ]);
    });
  });

  describe('SolicitarAyudaUseCase · titular (C-05)', () => {
    it('al navegador sin llave le entrega una nueva y guarda solo su huella', async () => {
      const { llave } = await solicitar.ejecutar(
        { equipo: '12', tema: 'CORREO' },
        null,
        null,
      );
      expect(llave).toBe('llave-nueva-1');
      expect(solicitudes.solicitudes[0].titularHash).toBe(
        'huella:llave-nueva-1',
      );
    });

    it('el navegador conserva su llave: sigue siendo titular de lo que pide', async () => {
      const { llave } = await solicitar.ejecutar(
        { equipo: '12', tema: 'CORREO' },
        null,
        NAVEGADOR,
      );
      expect(llave).toBe(NAVEGADOR);
      expect(solicitudes.solicitudes[0].titularHash).toBe(
        `huella:${NAVEGADOR}`,
      );
    });

    it('una llave que no tiene el formato se cambia por una nueva', async () => {
      const { llave } = await solicitar.ejecutar(
        { equipo: '12', tema: 'CORREO' },
        null,
        'inventada',
      );
      expect(llave).toBe('llave-nueva-1');
    });

    it('si otro navegador ya pidió ayuda para ese equipo, no recibe su solicitud', async () => {
      await pedir({ equipo: 'Equipo 12', tema: 'CORREO' });
      await expect(
        solicitar.ejecutar(
          { equipo: 'equipo 12', tema: 'OTRO' },
          null,
          OTRO_NAVEGADOR,
        ),
      ).rejects.toThrow(EquipoConSolicitudActivaError);
      await expect(
        solicitar.ejecutar({ equipo: 'equipo 12', tema: 'OTRO' }, null, null),
      ).rejects.toThrow(EquipoConSolicitudActivaError);
      expect(solicitudes.solicitudes).toHaveLength(1);
    });
  });

  describe('ObtenerSolicitudAyudaUseCase', () => {
    it('devuelve el estado y el puesto actual; ya cancelada no tiene puesto', async () => {
      const { id } = await pedir({ equipo: '12', tema: 'CORREO' });
      expect(await obtener.ejecutar(id, NAVEGADOR)).toMatchObject({
        estado: 'PENDIENTE',
        posicion: 1,
      });
      await cancelar.ejecutar(id, NAVEGADOR);
      expect(await obtener.ejecutar(id, NAVEGADOR)).toMatchObject({
        estado: 'CANCELADA',
        posicion: null,
      });
    });

    it('falla si la solicitud no existe', async () => {
      await expect(obtener.ejecutar('no-existe', NAVEGADOR)).rejects.toThrow(
        SolicitudNoEncontradaError,
      );
    });

    it('sin la llave del navegador que la pidió responde como si no existiera', async () => {
      const { id } = await pedir({ equipo: '12', tema: 'CORREO' });
      for (const llave of [OTRO_NAVEGADOR, 'inventada', null]) {
        await expect(obtener.ejecutar(id, llave)).rejects.toThrow(
          SolicitudNoEncontradaError,
        );
      }
    });
  });

  describe('CancelarSolicitudAyudaUseCase', () => {
    it('al cancelar, las que esperaban detrás avanzan un puesto', async () => {
      const primera = await pedir({ equipo: '12', tema: 'CORREO' });
      const segunda = await pedir({ equipo: '7', tema: 'CORREO' });
      await cancelar.ejecutar(primera.id, NAVEGADOR);
      expect((await obtener.ejecutar(segunda.id, NAVEGADOR)).posicion).toBe(1);
    });

    it('no se cancela dos veces', async () => {
      const { id } = await pedir({ equipo: '12', tema: 'CORREO' });
      await cancelar.ejecutar(id, NAVEGADOR);
      await expect(cancelar.ejecutar(id, NAVEGADOR)).rejects.toThrow(
        SolicitudCerradaError,
      );
    });

    it('falla si la solicitud no existe', async () => {
      await expect(cancelar.ejecutar('no-existe', NAVEGADOR)).rejects.toThrow(
        SolicitudNoEncontradaError,
      );
    });

    it('otro navegador no la cancela aunque conozca el id', async () => {
      const { id } = await pedir({ equipo: '12', tema: 'CORREO' });
      for (const llave of [OTRO_NAVEGADOR, null]) {
        await expect(cancelar.ejecutar(id, llave)).rejects.toThrow(
          SolicitudNoEncontradaError,
        );
      }
      expect(solicitudes.solicitudes[0].estado).toBe('PENDIENTE');
    });
  });

  describe('ListarSolicitudesAyudaUseCase', () => {
    it('pasa el criterio al repositorio y muestra equipo, tema, guía y paso', async () => {
      await pedir({
        equipo: '12',
        tema: 'CORREO',
        guiaSlug: 'smishing',
        pasoOrden: 3,
      });
      const criterio: CriterioSolicitudes = {
        estado: 'PENDIENTE',
        ordenarPor: 'creadaEn',
        direccion: 'asc',
        pagina: 1,
        limite: 20,
      };

      const resultado = await new ListarSolicitudesAyudaUseCase(
        solicitudes,
      ).ejecutar(criterio);

      expect(solicitudes.recibido).toEqual(criterio);
      expect(resultado).toEqual({
        datos: [
          {
            id: 'id-1',
            equipo: '12',
            tema: 'CORREO',
            estado: 'PENDIENTE',
            guia: { slug: 'smishing', titulo: 'Smishing' },
            paso: 3,
            creadaEn: AHORA,
            atendidaPor: null,
            tomadaEn: null,
            resueltaEn: null,
            comentarioResolucion: null,
          },
        ],
        total: 1,
        pagina: 1,
        limite: 20,
      });
    });
  });
  describe('HU-30 · Atender la cola de solicitudes', () => {
    let tomar: TomarSolicitudAyudaUseCase;
    let resolver: ResolverSolicitudAyudaUseCase;
    let id: string;

    beforeEach(async () => {
      tomar = new TomarSolicitudAyudaUseCase(solicitudes, reloj);
      resolver = new ResolverSolicitudAyudaUseCase(solicitudes, reloj);
      ({ id } = await pedir({
        equipo: '12',
        tema: 'CORREO',
        guiaSlug: 'smishing',
        pasoOrden: 3,
      }));
    });

    it('al tomarla pasa a «En atención» con el nombre del monitor', async () => {
      expect(await tomar.ejecutar(id, 'ana')).toEqual({
        id,
        equipo: '12',
        tema: 'CORREO',
        estado: 'EN_ATENCION',
        guia: { slug: 'smishing', titulo: 'Smishing' },
        paso: 3,
        creadaEn: AHORA,
        atendidaPor: 'Ana Pérez',
        tomadaEn: AHORA,
        resueltaEn: null,
        comentarioResolucion: null,
      });
      // Quien la pidió ve que ya la atienden: sale de la cola.
      expect(await obtener.ejecutar(id, NAVEGADOR)).toMatchObject({
        estado: 'EN_ATENCION',
        posicion: null,
      });
    });

    it('otro monitor no puede tomar la misma', async () => {
      await tomar.ejecutar(id, 'ana');
      await expect(tomar.ejecutar(id, 'luis')).rejects.toThrow(
        SolicitudYaTomadaError,
      );
    });

    it('si dos monitores la toman a la vez, el que llega tarde recibe un conflicto', async () => {
      solicitudes.otraPeticionGano = true;
      await expect(tomar.ejecutar(id, 'luis')).rejects.toThrow(
        SolicitudModificadaError,
      );
    });

    it('quien la tomó la resuelve con un comentario; otro monitor no puede', async () => {
      await tomar.ejecutar(id, 'ana');
      await expect(resolver.ejecutar(id, 'luis')).rejects.toThrow(
        SolicitudDeOtroMonitorError,
      );

      const resuelta = await resolver.ejecutar(id, 'ana', 'No veía el botón.');
      expect(resuelta).toMatchObject({
        estado: 'RESUELTA',
        atendidaPor: 'Ana Pérez',
        resueltaEn: AHORA,
        comentarioResolucion: 'No veía el botón.',
      });
    });

    it('una vez resuelta, el equipo puede volver a pedir ayuda', async () => {
      await tomar.ejecutar(id, 'ana');
      await resolver.ejecutar(id, 'ana');
      const nueva = await pedir({ equipo: '12', tema: 'OTRO' });
      expect(nueva.yaExistia).toBe(false);
    });

    it('si la persona cancela justo cuando la van a resolver, no se pisa la cancelación', async () => {
      await tomar.ejecutar(id, 'ana');
      solicitudes.otraPeticionGano = true;
      await expect(resolver.ejecutar(id, 'ana')).rejects.toThrow(
        SolicitudModificadaError,
      );
    });

    it('fallan si la solicitud no existe', async () => {
      await expect(tomar.ejecutar('no-existe', 'ana')).rejects.toThrow(
        SolicitudNoEncontradaError,
      );
      await expect(resolver.ejecutar('no-existe', 'ana')).rejects.toThrow(
        SolicitudNoEncontradaError,
      );
    });
  });
});
