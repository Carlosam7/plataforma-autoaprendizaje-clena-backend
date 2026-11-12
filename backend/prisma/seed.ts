// Datos semilla para desarrollo y la demo. Todo es ficticio: nunca datos reales del CLENA.
// Se puede ejecutar varias veces sin duplicar nada (upsert por clave natural).
//   pnpm prisma:seed
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/infrastructure/database/prisma/generated/client.js';

const AVISO_PRIVACIDAD = {
  version: '1.0',
  vigenteDesde: new Date('2026-11-01T00:00:00.000Z'),
  contenido: [
    'Aviso de privacidad de la plataforma Kamá — Sala de Internet del CLENA',
    '',
    'Responsable: Corporación Luis Eduardo Nieto Arteta (CLENA), Barranquilla.',
    '',
    '¿Qué datos guardamos? Tu nombre, tu número de identificación, tu fecha de nacimiento y el celular o el correo que nos des. También guardamos tu avance en las guías y actividades.',
    '',
    '¿Para qué? Para crear tu cuenta, enviarte el código que confirma que el celular o el correo son tuyos, guardar tu progreso entre visitas y ayudarte cuando pidas ayuda a un monitor. No vendemos ni compartimos tus datos.',
    '',
    '¿Cómo los elimino? Desde tu perfil puedes eliminar tu cuenta cuando quieras; también puedes pedirlo a un monitor de la sala. Al eliminarla borramos tus datos personales.',
    '',
    'Tus derechos (Ley 1581 de 2012): conocer, actualizar y rectificar tus datos, pedir que se borren y revocar esta autorización.',
  ].join('\n'),
};

// En esta primera etapa el catálogo arranca solo con las guías de phishing.
const CATEGORIAS = [
  {
    id: 1,
    slug: 'phishing',
    nombre: 'Phishing: mensajes y correos falsos',
    icono: 'shield-alert',
    orden: 1,
  },
];

/**
 * HU-04: administrador inicial, con datos tomados de variables de entorno (nunca del código).
 * Queda con debe_cambiar_password = true: la contraseña del .env es temporal.
 * Si ya existe una cuenta con ese correo no se toca, así volver a sembrar no pisa su contraseña.
 */
async function sembrarAdministradorInicial(
  prisma: PrismaClient,
): Promise<string> {
  const nombre = process.env.ADMIN_INICIAL_NOMBRE?.trim();
  const correo = process.env.ADMIN_INICIAL_CORREO?.trim().toLowerCase();
  const password = process.env.ADMIN_INICIAL_PASSWORD;
  if (!nombre || !correo || !password) {
    return 'sin administrador inicial (define ADMIN_INICIAL_NOMBRE, ADMIN_INICIAL_CORREO y ADMIN_INICIAL_PASSWORD)';
  }
  if (password.length < 8 || !/\p{L}/u.test(password) || !/\d/.test(password)) {
    throw new Error(
      'ADMIN_INICIAL_PASSWORD debe tener al menos 8 caracteres, con una letra y un número',
    );
  }

  await prisma.personal.upsert({
    where: { correo },
    create: {
      nombre,
      correo,
      passwordHash: await bcrypt.hash(password, 12),
      rol: 'ADMINISTRADOR',
      debeCambiarPassword: true,
    },
    update: {},
  });
  return `administrador inicial ${correo}`;
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Define DATABASE_URL para cargar las semillas');
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });

  try {
    await prisma.avisoPrivacidad.upsert({
      where: { version: AVISO_PRIVACIDAD.version },
      create: AVISO_PRIVACIDAD,
      update: {
        contenido: AVISO_PRIVACIDAD.contenido,
        vigenteDesde: AVISO_PRIVACIDAD.vigenteDesde,
      },
    });

    for (const { id, ...datos } of CATEGORIAS) {
      await prisma.categoria.upsert({
        where: { id },
        create: { id, ...datos },
        update: datos,
      });
    }

    const admin = await sembrarAdministradorInicial(prisma);

    console.log(
      `Semillas cargadas: aviso de privacidad ${AVISO_PRIVACIDAD.version}, ${CATEGORIAS.length} categoría(s) y ${admin}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

await main();
