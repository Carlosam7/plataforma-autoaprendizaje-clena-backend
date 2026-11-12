/** Hash lento para contraseñas (bcrypt o argon2). */
export abstract class HasherPassword {
  abstract hash(password: string): Promise<string>;
  abstract coincide(password: string, hash: string): Promise<boolean>;
}
