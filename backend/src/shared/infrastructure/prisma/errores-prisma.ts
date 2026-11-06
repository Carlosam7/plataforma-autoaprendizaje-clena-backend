import { Prisma } from '../../../generated/prisma/client.js';

interface MetaUnicidad {
  target?: string[] | string;
  driverAdapterError?: {
    cause?: { constraint?: { fields?: string[]; index?: string } };
  };
}

/**
 * Si el error es una violación de unicidad (P2002), devuelve un texto con los campos
 * o el índice involucrados (por ejemplo «usuarios_telefono_key»); si no, `null`.
 * Con el adaptador de pg, Prisma informa el índice dentro de `meta.driverAdapterError`.
 */
export function descripcionConflictoUnicidad(error: unknown): string | null {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== 'P2002'
  ) {
    return null;
  }
  const meta = (error.meta ?? {}) as MetaUnicidad;
  const restriccion = meta.driverAdapterError?.cause?.constraint;
  return [meta.target, restriccion?.fields, restriccion?.index]
    .flat()
    .filter(Boolean)
    .join(',');
}
