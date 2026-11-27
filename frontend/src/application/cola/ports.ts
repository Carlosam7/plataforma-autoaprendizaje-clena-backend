import type { EstadoSolicitud } from '@/domain/ayuda/types';
import type { SolicitudEnCola } from '@/domain/cola/types';

export interface PaginaCola {
  datos: SolicitudEnCola[];
  total: number;
}

/** Rutas de la cola del personal (C-06). La sesión la pone el adaptador. */
export interface ColaAyudaRepository {
  listar(criterio: {
    estado: EstadoSolicitud;
    pagina?: number;
    limite?: number;
  }): Promise<PaginaCola>;
  tomar(id: string): Promise<SolicitudEnCola>;
  resolver(id: string, comentario: string | null): Promise<SolicitudEnCola>;
}
