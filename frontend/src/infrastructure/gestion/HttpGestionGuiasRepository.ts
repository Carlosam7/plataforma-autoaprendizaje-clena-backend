import type {
  CriterioGuiasGestion,
  GestionGuiasRepository,
} from '@/application/gestion/ports';
import type {
  GuardarGuiaComando,
  GuiaGestionDetalle,
  GuiaGestionResumen,
  GuiasGestionPaginadas,
} from '@/domain/gestion/types';
import { ClienteHttpPersonal } from '@/infrastructure/personal/ClienteHttpPersonal';

const RUTA = '/gestion/guias';

type ConFechas<T> = Omit<T, 'publicadaEn' | 'creadoEn' | 'actualizadoEn'> & {
  publicadaEn: string | null;
  creadoEn: string;
  actualizadoEn: string;
};

function fechas<T extends ConFechas<GuiaGestionResumen>>(g: T) {
  return {
    ...g,
    publicadaEn: g.publicadaEn ? new Date(g.publicadaEn) : null,
    creadoEn: new Date(g.creadoEn),
    actualizadoEn: new Date(g.actualizadoEn),
  };
}

/**
 * Gestión de guías del personal (C-07), con la sesión del personal guardada en este
 * navegador. Crear, editar, publicar y ocultar son escrituras: ante un 401 no se repiten.
 */
export class HttpGestionGuiasRepository implements GestionGuiasRepository {
  constructor(private readonly cliente = new ClienteHttpPersonal()) {}

  async listar(criterio: CriterioGuiasGestion): Promise<GuiasGestionPaginadas> {
    const params = new URLSearchParams();
    for (const [clave, valor] of Object.entries(criterio)) {
      if (valor !== undefined && valor !== '') params.set(clave, String(valor));
    }
    const qs = params.toString() ? `?${params}` : '';
    const res = await this.cliente.autenticada(`${RUTA}${qs}`);
    if (!res.ok) throw await this.cliente.errorDe(res);
    const data = await this.cliente.leerJson<
      Omit<GuiasGestionPaginadas, 'datos'> & {
        datos: ConFechas<GuiaGestionResumen>[];
      }
    >(res);
    return { ...data, datos: data.datos.map(fechas) };
  }

  obtener(slug: string): Promise<GuiaGestionDetalle> {
    return this.detalle(this.cliente.autenticada(this.ruta(slug)));
  }

  crear(comando: GuardarGuiaComando): Promise<GuiaGestionDetalle> {
    return this.detalle(
      this.cliente.autenticada(RUTA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comando),
      }),
    );
  }

  editar(
    slug: string,
    comando: GuardarGuiaComando,
  ): Promise<GuiaGestionDetalle> {
    return this.detalle(
      this.cliente.autenticada(this.ruta(slug), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comando),
      }),
    );
  }

  publicar(slug: string): Promise<GuiaGestionDetalle> {
    return this.detalle(
      this.cliente.autenticada(`${this.ruta(slug)}/publicar`, {
        method: 'POST',
      }),
    );
  }

  ocultar(slug: string): Promise<GuiaGestionDetalle> {
    return this.detalle(
      this.cliente.autenticada(`${this.ruta(slug)}/ocultar`, {
        method: 'POST',
      }),
    );
  }

  private ruta(slug: string): string {
    return `${RUTA}/${encodeURIComponent(slug)}`;
  }

  private async detalle(
    respuesta: Promise<Response>,
  ): Promise<GuiaGestionDetalle> {
    const res = await respuesta;
    if (!res.ok) throw await this.cliente.errorDe(res);
    return fechas(
      await this.cliente.leerJson<ConFechas<GuiaGestionDetalle>>(res),
    );
  }
}
