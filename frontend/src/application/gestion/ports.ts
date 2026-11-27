import type {
  EstadoGuiaGestion,
  GuardarGuiaComando,
  GuiaGestionDetalle,
  GuiasGestionPaginadas,
} from '@/domain/gestion/types';

export interface CriterioGuiasGestion {
  estado?: EstadoGuiaGestion;
  /** Slug de la categoría. */
  categoria?: string;
  ordenarPor?: 'titulo' | 'actualizadoEn';
  direccion?: 'asc' | 'desc';
  pagina?: number;
  limite?: number;
}

/** Rutas `/gestion/guias` del personal (C-07). La sesión la pone el adaptador. */
export interface GestionGuiasRepository {
  listar(criterio: CriterioGuiasGestion): Promise<GuiasGestionPaginadas>;
  obtener(slug: string): Promise<GuiaGestionDetalle>;
  crear(comando: GuardarGuiaComando): Promise<GuiaGestionDetalle>;
  editar(
    slug: string,
    comando: GuardarGuiaComando,
  ): Promise<GuiaGestionDetalle>;
  publicar(slug: string): Promise<GuiaGestionDetalle>;
  ocultar(slug: string): Promise<GuiaGestionDetalle>;
}
