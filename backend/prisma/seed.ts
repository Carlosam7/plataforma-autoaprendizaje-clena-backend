// Datos semilla para desarrollo y la demo. Todo es ficticio: nunca datos reales del CLENA.
// Se puede ejecutar varias veces sin duplicar nada (upsert por clave natural).
//   pnpm prisma:seed
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
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

    console.log(
      `Semillas cargadas: aviso de privacidad ${AVISO_PRIVACIDAD.version} y ${CATEGORIAS.length} categoría(s).`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

await main();
