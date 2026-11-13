// Datos semilla para desarrollo y la demo. Todo es ficticio: nunca datos reales del CLENA.
// Se puede ejecutar varias veces sin duplicar nada (upsert por clave natural).
//   pnpm prisma:seed
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
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

// Las cinco categorías fijas del modelo de datos (HU-16 es Won't: no se editan por la API).
const CATEGORIAS = [
  {
    id: 1,
    // Phishing, contraseñas e información confiable (HU-25, HU-26, HU-27).
    slug: 'seguridad-digital',
    nombre: 'Seguridad digital',
    icono: 'shield-alert',
    orden: 1,
  },
  {
    id: 2,
    slug: 'correo-electronico',
    nombre: 'Correo electrónico',
    icono: 'mail',
    orden: 2,
  },
  {
    id: 3,
    slug: 'busqueda-internet',
    nombre: 'Búsqueda en internet',
    icono: 'search',
    orden: 3,
  },
  {
    id: 4,
    slug: 'documentos',
    nombre: 'Documentos de texto',
    icono: 'file-text',
    orden: 4,
  },
  {
    id: 5,
    slug: 'redes-sociales',
    nombre: 'Redes sociales',
    icono: 'users',
    orden: 5,
  },
];

// Bloques de un paso tal como se escriben aquí. Una imagen se nombra por su archivo en
// archivos/semilla/guias/ (sin extensión); la semilla la cambia por el id de su fila en imagen.
type BloqueSemilla =
  | { tipo: 'texto'; texto: string }
  | { tipo: 'aviso'; nivel: 'consejo' | 'alerta'; texto: string }
  | { tipo: 'imagen'; archivo: string; textoAlternativo: string };

interface GuiaSemilla {
  slug: string;
  titulo: string;
  objetivo: string;
  duracionEstimadaMin: number;
  pasos: { titulo: string | null; bloques: BloqueSemilla[] }[];
}

const texto = (t: string): BloqueSemilla => ({ tipo: 'texto', texto: t });
const consejo = (t: string): BloqueSemilla => ({
  tipo: 'aviso',
  nivel: 'consejo',
  texto: t,
});
const alerta = (t: string): BloqueSemilla => ({
  tipo: 'aviso',
  nivel: 'alerta',
  texto: t,
});
const imagen = (archivo: string, textoAlternativo: string): BloqueSemilla => ({
  tipo: 'imagen',
  archivo,
  textoAlternativo,
});

// HU-09 / HU-10: guías publicadas de ejemplo, con textos de máximo tres oraciones por bloque.
// Las otras cuatro categorías quedan sin guías para mostrar «Pronto habrá guías en esta sección».
const GUIAS: GuiaSemilla[] = [
  {
    slug: 'smishing',
    titulo: 'Smishing: mensajes falsos por SMS o WhatsApp',
    objetivo:
      'Al terminar sabrás reconocer las señales de un mensaje de texto engañoso.',
    duracionEstimadaMin: 8,
    pasos: [
      {
        titulo: 'Haz una pausa',
        bloques: [
          texto(
            'Los mensajes falsos te apuran: «tu cuenta será bloqueada hoy». Esa prisa es parte del engaño. Antes de hacer cualquier cosa, respira y lee con calma.',
          ),
          imagen(
            'smishing-1',
            'Mensaje de texto de un número desconocido que dice que tu cuenta será bloqueada hoy',
          ),
          consejo('Ningún banco te obliga a responder en minutos.'),
        ],
      },
      {
        titulo: 'Revisa quién escribe',
        bloques: [
          texto(
            'Mira el número o el nombre que envía el mensaje. Los bancos y las empresas no escriben desde números de celular personales.',
          ),
          alerta(
            'Un logo o un nombre conocido no prueba nada: cualquiera puede copiarlos.',
          ),
        ],
      },
      {
        titulo: 'Desconfía de los enlaces',
        bloques: [
          texto(
            'No toques enlaces de mensajes que no esperabas. Un enlace puede parecer del banco y llevarte a una página falsa.',
          ),
          imagen(
            'smishing-3',
            'Mensaje con un enlace que imita la dirección de un banco',
          ),
          alerta(
            'Si ya tocaste el enlace, no escribas ningún dato en esa página.',
          ),
        ],
      },
      {
        titulo: 'Consulta por un canal seguro',
        bloques: [
          texto(
            'Si tienes dudas, llama tú a la entidad al número que aparece en tu tarjeta o en su página oficial. No uses el número que viene en el mensaje.',
          ),
        ],
      },
      {
        titulo: 'Protege tu información',
        bloques: [
          texto(
            'Nunca compartas claves, códigos ni datos de tu tarjeta por mensaje. Borra el mensaje falso y, si puedes, bloquea el número.',
          ),
          consejo('Si algo no te cuadra, pide ayuda a un monitor de la sala.'),
        ],
      },
    ],
  },
  {
    slug: 'vishing',
    titulo: 'Vishing: llamadas que buscan engañarte',
    objetivo:
      'Al terminar sabrás qué hacer si alguien te llama pidiendo tus datos o códigos.',
    duracionEstimadaMin: 7,
    pasos: [
      {
        titulo: 'Respira y no sientas prisa',
        bloques: [
          texto(
            'Quien llama para engañarte quiere que actúes rápido y con miedo. Tienes derecho a colgar y pensarlo con calma.',
          ),
          consejo('Una entidad seria nunca se molesta porque cuelgues.'),
        ],
      },
      {
        titulo: 'Cuelga y llama tú',
        bloques: [
          texto(
            'Si te dicen que llaman de tu banco, cuelga. Después llama tú al número oficial de la entidad.',
          ),
          imagen(
            'vishing-2',
            'Pantalla de una llamada entrante de un número desconocido que dice ser el banco',
          ),
        ],
      },
      {
        titulo: 'Los códigos son solo tuyos',
        bloques: [
          texto(
            'Los códigos que te llegan por mensaje sirven para entrar a tus cuentas. Nadie del banco te los va a pedir por teléfono.',
          ),
          alerta('Si alguien te pide un código, es un engaño: cuelga.'),
        ],
      },
    ],
  },
  {
    slug: 'quishing',
    titulo: 'Quishing: engaños escondidos en códigos QR',
    objetivo:
      'Al terminar sabrás revisar un código QR antes de abrir el enlace que trae.',
    duracionEstimadaMin: 6,
    pasos: [
      {
        titulo: 'El código QR es un enlace',
        bloques: [
          texto(
            'Un código QR te lleva a una página de internet, igual que un enlace. Por eso también puede llevarte a una página falsa.',
          ),
          imagen(
            'quishing-1',
            'Cartel con un código QR para pagar el parqueadero',
          ),
        ],
      },
      {
        titulo: 'Cuidado con los stickers',
        bloques: [
          texto(
            'Revisa si el código QR está pegado encima de otro. Los estafadores tapan el código real con uno suyo.',
          ),
          alerta(
            'Desconfía de un QR pegado como sticker en un cartel o en un cajero.',
          ),
        ],
      },
      {
        titulo: 'Mira la dirección antes de abrir',
        bloques: [
          texto(
            'Al escanear, el celular muestra la dirección de la página antes de abrirla. Si no la reconoces, no la abras.',
          ),
          consejo('Para pagar, prefiere la aplicación oficial de tu banco.'),
        ],
      },
    ],
  },
  {
    slug: 'falso-soporte-tecnico',
    titulo: 'Falso soporte técnico',
    objetivo:
      'Al terminar sabrás reconocer una ventana o llamada falsa de soporte técnico.',
    duracionEstimadaMin: 10,
    pasos: [
      {
        titulo: 'Una ventana que asusta',
        bloques: [
          texto(
            'Puede aparecer una ventana que dice que tu computador tiene un virus y te pide llamar a un número. Es falsa: los avisos reales no te piden llamar a nadie.',
          ),
          imagen(
            'falso-soporte-1',
            'Ventana roja que dice que el computador está infectado y muestra un número de teléfono',
          ),
        ],
      },
      {
        titulo: 'No llames ni hagas clic',
        bloques: [
          texto(
            'No llames al número ni toques los botones de la ventana. Cierra el navegador; si no se cierra, apaga el computador.',
          ),
          alerta(
            'Nunca dejes que un desconocido controle tu computador a distancia.',
          ),
        ],
      },
      {
        titulo: null,
        bloques: [
          texto(
            'Las empresas de tecnología no llaman para avisar que tu equipo tiene problemas. Si alguien llama con ese cuento, cuelga.',
          ),
        ],
      },
      {
        titulo: 'Pide ayuda en la sala',
        bloques: [
          texto(
            'Si ves una ventana así en la sala, avisa a un monitor. Él revisa el equipo sin que des ningún dato.',
          ),
          consejo('Pedir ayuda no cuesta nada: los monitores están para eso.'),
        ],
      },
    ],
  },
];

const DIRECTORIO_IMAGENES = join(process.cwd(), 'archivos', 'semilla', 'guias');
const TIPOS_IMAGEN: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

/**
 * Crea o actualiza la fila de imagen de un archivo de la semilla y devuelve su id.
 * Si el equipo todavía no puso el archivo, devuelve null y el paso queda sin esa imagen.
 */
async function sembrarImagen(
  prisma: PrismaClient,
  archivo: string,
  textoAlternativo: string,
  autorId: string,
): Promise<string | null> {
  for (const [extension, tipoMime] of Object.entries(TIPOS_IMAGEN)) {
    const ruta = join(DIRECTORIO_IMAGENES, archivo + extension);
    if (!existsSync(ruta)) continue;
    const clave = `semilla/guias/${archivo}${extension}`;
    const datos = {
      url: `/api/v1/archivos/${clave}`,
      tipoMime,
      tamanoBytes: statSync(ruta).size,
      textoAlternativo,
    };
    const fila = await prisma.imagen.upsert({
      where: { claveAlmacenamiento: clave },
      create: { claveAlmacenamiento: clave, ...datos, subidaPorId: autorId },
      update: datos,
    });
    return fila.id;
  }
  return null;
}

/**
 * Crea o actualiza los pasos por (guía, orden) sin borrarlos: así no se pierden el progreso
 * ni las lecturas que apuntan a ellos.
 */
async function sembrarPasos(
  prisma: PrismaClient,
  guiaId: string,
  pasos: GuiaSemilla['pasos'],
  autorId: string,
): Promise<number> {
  let imagenes = 0;
  for (const [i, paso] of pasos.entries()) {
    const bloques = [];
    for (const bloque of paso.bloques) {
      if (bloque.tipo !== 'imagen') {
        bloques.push(bloque);
        continue;
      }
      const imagenId = await sembrarImagen(
        prisma,
        bloque.archivo,
        bloque.textoAlternativo,
        autorId,
      );
      if (imagenId) {
        imagenes += 1;
        bloques.push({
          tipo: 'imagen',
          imagenId,
          textoAlternativo: bloque.textoAlternativo,
        });
      }
    }
    const datos = {
      titulo: paso.titulo,
      contenido: { version: 1, bloques },
    };
    const orden = i + 1;
    const existente = await prisma.paso.findFirst({ where: { guiaId, orden } });
    if (existente) {
      await prisma.paso.update({ where: { id: existente.id }, data: datos });
    } else {
      await prisma.paso.create({ data: { guiaId, orden, ...datos } });
    }
  }
  return imagenes;
}

/**
 * Autor ficticio de las guías semilla (guia.creada_por_id es obligatorio).
 * Inactivo y con una contraseña aleatoria que nadie conoce: no puede iniciar sesión.
 */
async function sembrarAutorContenidos(prisma: PrismaClient): Promise<string> {
  const autor = await prisma.personal.upsert({
    where: { correo: 'contenidos@clena.example' },
    create: {
      nombre: 'Equipo de contenidos (semilla)',
      correo: 'contenidos@clena.example',
      passwordHash: await bcrypt.hash(randomBytes(32).toString('hex'), 12),
      rol: 'PERSONAL',
      activo: false,
      debeCambiarPassword: true,
    },
    update: {},
  });
  return autor.id;
}

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

    const autorId = await sembrarAutorContenidos(prisma);
    let imagenes = 0;
    for (const { slug, pasos, ...datos } of GUIAS) {
      const guia = await prisma.guia.upsert({
        where: { slug },
        create: {
          slug,
          ...datos,
          categoriaId: 1,
          nivel: 'BASICO',
          estado: 'PUBLICADA',
          publicadaEn: new Date('2026-11-01T00:00:00.000Z'),
          creadaPorId: autorId,
          actualizadaPorId: autorId,
        },
        update: datos,
      });
      imagenes += await sembrarPasos(prisma, guia.id, pasos, autorId);
    }

    const admin = await sembrarAdministradorInicial(prisma);

    console.log(
      `Semillas cargadas: aviso de privacidad ${AVISO_PRIVACIDAD.version}, ${CATEGORIAS.length} categorías, ${GUIAS.length} guías (${imagenes} imágenes) y ${admin}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

await main();
