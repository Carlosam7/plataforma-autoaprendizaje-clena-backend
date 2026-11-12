import { Correo } from '../auth/value-objects/correo.js';
import { Pagina, Paginacion } from '../shared/pagina.js';
import { Personal, RolPersonal } from './personal.js';

export const CAMPOS_ORDEN_PERSONAL = ['nombre', 'correo', 'creadoEn'] as const;

export interface CriterioPersonal extends Paginacion {
  /** Busca en el nombre o el correo. */
  q?: string;
  rol?: RolPersonal;
  activo?: boolean;
  ordenarPor: (typeof CAMPOS_ORDEN_PERSONAL)[number];
  direccion: 'asc' | 'desc';
}

export abstract class PersonalRepository {
  abstract buscarPorId(id: string): Promise<Personal | null>;
  /** ¿Otra cuenta (distinta de `exceptoId`) ya usa este correo? */
  abstract existeCorreo(correo: Correo, exceptoId?: string): Promise<boolean>;
  abstract crear(personal: Personal): Promise<void>;
  abstract actualizar(personal: Personal): Promise<void>;
  abstract listar(criterio: CriterioPersonal): Promise<Pagina<Personal>>;
}
