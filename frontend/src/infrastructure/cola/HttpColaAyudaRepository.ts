import type { ColaAyudaRepository, PaginaCola } from '@/application/cola/ports';
import type { EstadoSolicitud, TemaAyuda } from '@/domain/ayuda/types';
import type { SolicitudEnCola } from '@/domain/cola/types';
import { ClienteHttpPersonal } from '@/infrastructure/personal/ClienteHttpPersonal';

const RUTA = '/solicitudes-ayuda';

interface SolicitudBackend {
  id: string;
  equipo: string;
  tema: TemaAyuda;
  estado: EstadoSolicitud;
  guia: { slug: string; titulo: string } | null;
  paso: number | null;
  creadaEn: string;
  atendidaPor: string | null;
  tomadaEn: string | null;
  resueltaEn: string | null;
  comentarioResolucion: string | null;
}

const fecha = (valor: string | null) => (valor ? new Date(valor) : null);

function mapear(s: SolicitudBackend): SolicitudEnCola {
  return {
    id: s.id,
    equipo: s.equipo,
    tema: s.tema,
    estado: s.estado,
    guia: s.guia,
    paso: s.paso,
    creadaEn: new Date(s.creadaEn),
    atendidaPor: s.atendidaPor,
    tomadaEn: fecha(s.tomadaEn),
    resueltaEn: fecha(s.resueltaEn),
    comentarioResolucion: s.comentarioResolucion,
  };
}

/**
 * Cola de solicitudes de ayuda del personal (C-06), con la sesión del personal guardada
 * en este navegador. Tomar y resolver son escrituras: ante un 401 no se repiten.
 */
export class HttpColaAyudaRepository implements ColaAyudaRepository {
  constructor(private readonly cliente = new ClienteHttpPersonal()) {}

  async listar({
    estado,
    pagina = 1,
    limite = 20,
  }: {
    estado: EstadoSolicitud;
    pagina?: number;
    limite?: number;
  }): Promise<PaginaCola> {
    const params = new URLSearchParams({
      estado,
      pagina: String(pagina),
      limite: String(limite),
      ordenarPor: 'creadaEn',
      direccion: 'asc',
    });
    const res = await this.cliente.autenticada(`${RUTA}?${params}`);
    if (!res.ok) throw await this.cliente.errorDe(res);
    const data = await this.cliente.leerJson<{
      datos: SolicitudBackend[];
      total: number;
    }>(res);
    return { datos: data.datos.map(mapear), total: data.total };
  }

  async tomar(id: string): Promise<SolicitudEnCola> {
    const res = await this.cliente.autenticada(
      `${RUTA}/${encodeURIComponent(id)}/tomar`,
      { method: 'POST' },
    );
    if (!res.ok) throw await this.cliente.errorDe(res);
    return mapear(await this.cliente.leerJson<SolicitudBackend>(res));
  }

  async resolver(
    id: string,
    comentario: string | null,
  ): Promise<SolicitudEnCola> {
    const res = await this.cliente.autenticada(
      `${RUTA}/${encodeURIComponent(id)}/resolver`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comentario }),
      },
    );
    if (!res.ok) throw await this.cliente.errorDe(res);
    return mapear(await this.cliente.leerJson<SolicitudBackend>(res));
  }
}
