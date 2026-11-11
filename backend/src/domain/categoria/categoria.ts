export class Categoria {
  constructor(
    readonly id: number,
    readonly slug: string,
    readonly nombre: string,
    readonly icono: string,
    readonly orden: number,
  ) {}
}
