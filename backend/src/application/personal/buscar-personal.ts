import { PersonalNoEncontradoError } from '../../domain/personal/errores.js';
import { Personal } from '../../domain/personal/personal.js';
import { PersonalRepository } from '../../domain/personal/personal.repository.js';

export async function buscarPersonalOFallar(
  repositorio: PersonalRepository,
  id: string,
): Promise<Personal> {
  const personal = await repositorio.buscarPorId(id);
  if (!personal) throw new PersonalNoEncontradoError();
  return personal;
}
