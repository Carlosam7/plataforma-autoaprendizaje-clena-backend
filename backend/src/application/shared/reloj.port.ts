/** La hora actual como dependencia, para poder fijarla en las pruebas. */
export abstract class Reloj {
  abstract ahora(): Date;
}
