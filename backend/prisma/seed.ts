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
  /** Slug de la categoría; sin él, «seguridad-digital». */
  categoria?: string;
  /** Sin él, BASICO. */
  nivel?: 'BASICO' | 'INTERMEDIO' | 'AVANZADO';
  titulo: string;
  objetivo: string;
  duracionEstimadaMin: number;
  /** HU-11: palabras con las que la gente buscaría la guía y que no están en el título. */
  palabrasClave: string[];
  pasos: { titulo: string | null; bloques: BloqueSemilla[] }[];
  actividad?: ActividadSemilla;
}

// `correcta` es la posición (desde 0) de la opción correcta.
interface ActividadSemilla {
  titulo: string;
  preguntas: {
    enunciado: string;
    explicacion: string;
    opciones: string[];
    correcta: number;
  }[];
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

// Guías publicadas de ejemplo de las cinco categorías (HU-09, HU-10, HU-17 a HU-20), con textos
// de máximo tres oraciones por bloque. No usan marcas ni datos de personas reales.
const GUIAS: GuiaSemilla[] = [
  {
    slug: 'smishing',
    titulo: 'Smishing: mensajes falsos por SMS o WhatsApp',
    objetivo:
      'Al terminar sabrás reconocer las señales de un mensaje de texto engañoso.',
    duracionEstimadaMin: 8,
    palabrasClave: [
      'mensaje',
      'texto',
      'estafa',
      'fraude',
      'enlace',
      'banco',
      'celular',
    ],
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
    // HU-21: práctica al terminar la guía.
    actividad: {
      titulo: 'Practica: mensajes falsos por SMS',
      preguntas: [
        {
          enunciado:
            'Te llega un SMS: «Tu cuenta será bloqueada hoy. Entra aquí para evitarlo». ¿Qué haces primero?',
          explicacion:
            'La prisa es parte del engaño. Ningún banco te obliga a responder en minutos.',
          opciones: [
            'Entro rápido al enlace para no perder la cuenta',
            'Hago una pausa y leo el mensaje con calma',
          ],
          correcta: 1,
        },
        {
          enunciado:
            'El mensaje trae el logo y el nombre de tu banco. ¿Eso prueba que es real?',
          explicacion:
            'Cualquiera puede copiar un logo o un nombre. Fíjate en quién envía el mensaje.',
          opciones: ['Sí, tiene el logo del banco', 'No, eso se puede copiar'],
          correcta: 1,
        },
        {
          enunciado:
            'Quieres saber si el mensaje es cierto. ¿A qué número llamas?',
          explicacion:
            'Llama tú al número de tu tarjeta o de la página oficial. El número del mensaje puede ser de quien te quiere engañar.',
          opciones: [
            'Al número que aparece en tu tarjeta',
            'Al número que viene en el mensaje',
          ],
          correcta: 0,
        },
        {
          enunciado:
            'Por SMS te piden el código que te acaba de llegar. ¿Lo envías?',
          explicacion:
            'Nunca compartas claves ni códigos por mensaje. Con ese código pueden entrar a tu cuenta.',
          opciones: ['No, nunca lo comparto', 'Sí, si dicen que son del banco'],
          correcta: 0,
        },
      ],
    },
  },
  {
    slug: 'vishing',
    titulo: 'Vishing: llamadas que buscan engañarte',
    objetivo:
      'Al terminar sabrás qué hacer si alguien te llama pidiendo tus datos o códigos.',
    duracionEstimadaMin: 7,
    palabrasClave: [
      'teléfono',
      'llamada',
      'estafa',
      'fraude',
      'banco',
      'código',
      'clave',
    ],
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
    palabrasClave: [
      'QR',
      'escanear',
      'cámara',
      'estafa',
      'fraude',
      'enlace',
      'pago',
    ],
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
    palabrasClave: [
      'virus',
      'computador',
      'ventana',
      'alerta',
      'estafa',
      'fraude',
      'ayuda',
    ],
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

  // ─── HU-17: correo electrónico ─────────────────────────────────────────────
  {
    slug: 'crear-cuenta-de-correo',
    categoria: 'correo-electronico',
    titulo: 'Crear una cuenta de correo',
    objetivo:
      'Al terminar sabrás crear tu propia cuenta de correo electrónico.',
    duracionEstimadaMin: 12,
    palabrasClave: [
      'email',
      'registrarse',
      'cuenta nueva',
      'usuario',
      'contraseña',
    ],
    pasos: [
      {
        titulo: 'Elige un servicio de correo',
        bloques: [
          texto(
            'Abre el navegador y entra a la página del servicio de correo que quieras usar. Busca el botón «Crear cuenta» o «Registrarse» y tócalo.',
          ),
          consejo('Si no sabes cuál elegir, pregunta a un monitor de la sala.'),
        ],
      },
      {
        titulo: 'Escribe tus datos',
        bloques: [
          texto(
            'Escribe tu nombre y tu apellido en las casillas. Luego elige el nombre de tu correo: es la parte de tu dirección que va antes de la arroba (@).',
          ),
          consejo(
            'Usa un nombre fácil de dictar, como tu nombre y tu apellido juntos.',
          ),
        ],
      },
      {
        titulo: 'Crea una contraseña',
        bloques: [
          texto(
            'Inventa una contraseña que solo tú conozcas. Combina letras, números y algún símbolo.',
          ),
          alerta('No uses tu fecha de nacimiento ni tu número de cédula.'),
        ],
      },
      {
        titulo: 'Guarda tus datos',
        bloques: [
          texto(
            'Anota tu dirección de correo y tu contraseña en un papel que guardes en casa. Con esos dos datos puedes entrar desde cualquier computador.',
          ),
          alerta('No dejes ese papel en la sala ni se lo muestres a nadie.'),
        ],
      },
    ],
    actividad: {
      titulo: 'Practica: crear una cuenta de correo',
      preguntas: [
        {
          enunciado: '¿Cuál de estas contraseñas es más segura?',
          explicacion:
            'Una fecha se adivina fácil. Una mezcla de letras, números y símbolos es mucho más difícil de adivinar.',
          opciones: [
            'Tu fecha de nacimiento',
            'Una mezcla de letras, números y un símbolo',
          ],
          correcta: 1,
        },
        {
          enunciado:
            '¿Qué necesitas para entrar a tu correo desde otro computador?',
          explicacion:
            'Tu dirección y tu contraseña son la llave de tu cuenta. Con ellas entras desde cualquier equipo.',
          opciones: [
            'Tu dirección de correo y tu contraseña',
            'Solo tu nombre completo',
          ],
          correcta: 0,
        },
      ],
    },
  },
  {
    slug: 'enviar-correo-con-adjunto',
    categoria: 'correo-electronico',
    titulo: 'Enviar un correo con un archivo adjunto',
    objetivo:
      'Al terminar sabrás escribir un correo y enviarlo con una foto o un documento.',
    duracionEstimadaMin: 10,
    palabrasClave: [
      'email',
      'mandar',
      'foto',
      'documento',
      'archivo',
      'mensaje',
      'redactar',
    ],
    pasos: [
      {
        titulo: 'Empieza un mensaje nuevo',
        bloques: [
          texto(
            'Entra a tu correo y busca el botón «Redactar» o «Nuevo mensaje». Al tocarlo se abre una ventana para escribir.',
          ),
        ],
      },
      {
        titulo: 'Escribe para quién es',
        bloques: [
          texto(
            'En la casilla «Para» escribe la dirección de correo de la persona. En «Asunto» escribe en pocas palabras de qué trata el mensaje.',
          ),
          alerta(
            'Revisa la dirección letra por letra: si hay un error, el correo no llega.',
          ),
        ],
      },
      {
        titulo: 'Escribe el mensaje',
        bloques: [
          texto(
            'En el espacio grande escribe lo que quieres decir. Empieza con un saludo y termina con tu nombre.',
          ),
        ],
      },
      {
        titulo: 'Adjunta el archivo',
        bloques: [
          texto(
            'Toca el dibujo del clip, que significa «Adjuntar». Busca la foto o el documento en el computador y tócalo dos veces. Espera a que aparezca su nombre en el mensaje.',
          ),
          consejo(
            'Si el archivo es pesado puede tardar un poco: no cierres la ventana.',
          ),
        ],
      },
      {
        titulo: 'Envía',
        bloques: [
          texto(
            'Toca el botón «Enviar». El correo queda guardado en la carpeta «Enviados», donde puedes revisarlo después.',
          ),
        ],
      },
    ],
    actividad: {
      titulo: 'Practica: enviar un correo con adjunto',
      preguntas: [
        {
          enunciado: '¿Qué dibujo se usa para adjuntar un archivo a un correo?',
          explicacion:
            'El clip significa «Adjuntar». La papelera sirve para borrar.',
          opciones: ['Un clip', 'Una papelera'],
          correcta: 0,
        },
        {
          enunciado: '¿Dónde puedes revisar un correo que ya enviaste?',
          explicacion:
            'Todo lo que envías queda guardado en la carpeta «Enviados».',
          opciones: ['En la carpeta «Enviados»', 'En la carpeta «Papelera»'],
          correcta: 0,
        },
      ],
    },
  },
  {
    slug: 'responder-y-reenviar-correos',
    categoria: 'correo-electronico',
    titulo: 'Responder y reenviar un correo',
    objetivo:
      'Al terminar sabrás contestar un correo y enviárselo a otra persona.',
    duracionEstimadaMin: 8,
    palabrasClave: [
      'email',
      'contestar',
      'respuesta',
      'reenvío',
      'mensaje',
      'bandeja de entrada',
    ],
    pasos: [
      {
        titulo: 'Abre el correo',
        bloques: [
          texto(
            'En la «Bandeja de entrada» están los correos que te llegan. Toca el que quieres contestar para abrirlo.',
          ),
        ],
      },
      {
        titulo: 'Responde',
        bloques: [
          texto(
            'Toca «Responder». La dirección de quien te escribió ya aparece puesta. Escribe tu respuesta y toca «Enviar».',
          ),
        ],
      },
      {
        titulo: 'Reenvía',
        bloques: [
          texto(
            'Para mostrarle ese correo a otra persona, toca «Reenviar». Escribe la dirección de esa persona en «Para» y toca «Enviar».',
          ),
          alerta(
            'Antes de reenviar, piensa si quien te escribió querría que otra persona lo lea.',
          ),
        ],
      },
      {
        titulo: null,
        bloques: [
          texto(
            'No tienes que contestar todos los correos. Si no conoces a quien escribe o el mensaje te parece raro, es mejor no responder.',
          ),
          consejo(
            'En la categoría «Seguridad digital» aprendes a reconocer mensajes falsos.',
          ),
        ],
      },
    ],
  },

  // ─── HU-18: documentos de texto ────────────────────────────────────────────
  {
    slug: 'crear-un-documento',
    categoria: 'documentos',
    titulo: 'Crear y escribir un documento',
    objetivo:
      'Al terminar sabrás abrir el procesador de texto y escribir una carta sencilla.',
    duracionEstimadaMin: 10,
    palabrasClave: [
      'carta',
      'escribir',
      'texto',
      'procesador de texto',
      'hoja',
      'teclado',
    ],
    pasos: [
      {
        titulo: 'Abre el procesador de texto',
        bloques: [
          texto(
            'El procesador de texto es el programa para escribir cartas y documentos. Búscalo en el escritorio o en el menú de inicio y tócalo dos veces.',
          ),
          consejo('Si no lo encuentras, pide ayuda a un monitor.'),
        ],
      },
      {
        titulo: 'Empieza un documento en blanco',
        bloques: [
          texto(
            'Elige «Documento en blanco». Aparece una hoja vacía con una rayita que parpadea: ahí se escribe.',
          ),
        ],
      },
      {
        titulo: 'Escribe',
        bloques: [
          texto(
            'Escribe con el teclado. Para dejar un espacio entre palabras usa la barra larga. Para empezar un renglón nuevo usa la tecla «Enter».',
          ),
        ],
      },
      {
        titulo: 'Corrige',
        bloques: [
          texto(
            'Si te equivocas, usa la tecla de borrar, que tiene una flecha hacia la izquierda. Borra letra por letra y vuelve a escribir.',
          ),
          consejo('Equivocarse es normal: todo se puede corregir.'),
        ],
      },
    ],
    actividad: {
      titulo: 'Practica: escribir un documento',
      preguntas: [
        {
          enunciado: '¿Qué tecla usas para empezar un renglón nuevo?',
          explicacion:
            'Con «Enter» bajas al renglón siguiente. La barra larga deja un espacio entre palabras.',
          opciones: ['La tecla «Enter»', 'La barra larga'],
          correcta: 0,
        },
        {
          enunciado: 'Escribiste mal una palabra. ¿Qué haces?',
          explicacion:
            'No hay que empezar de nuevo: la tecla de borrar quita letra por letra.',
          opciones: [
            'Empiezo el documento de nuevo',
            'Borro las letras con la tecla de borrar y las escribo otra vez',
          ],
          correcta: 1,
        },
      ],
    },
  },
  {
    slug: 'guardar-un-documento',
    categoria: 'documentos',
    titulo: 'Guardar un documento en una carpeta',
    objetivo:
      'Al terminar sabrás guardar tu documento con un nombre y en un lugar donde lo puedas encontrar.',
    duracionEstimadaMin: 8,
    palabrasClave: [
      'archivo',
      'guardar como',
      'nombre',
      'memoria USB',
      'no perder',
    ],
    pasos: [
      {
        titulo: 'Busca «Guardar»',
        bloques: [
          texto(
            'Arriba a la izquierda toca «Archivo» y luego «Guardar como». También sirve el dibujo del disquete.',
          ),
        ],
      },
      {
        titulo: 'Elige dónde guardarlo',
        bloques: [
          texto(
            'Se abre una ventana con las carpetas del computador. Elige «Documentos», o tu memoria USB si trajiste una.',
          ),
          alerta(
            'Los computadores de la sala se usan entre todos: lleva tu documento en una memoria USB o envíatelo por correo.',
          ),
        ],
      },
      {
        titulo: 'Ponle un nombre',
        bloques: [
          texto(
            'En la casilla «Nombre» escribe uno que diga de qué trata, como «Carta para la EPS». Luego toca «Guardar».',
          ),
          consejo('Un buen nombre te ahorra tiempo cuando lo busques.'),
        ],
      },
      {
        titulo: 'Guarda mientras trabajas',
        bloques: [
          texto(
            'Mientras escribes, guarda de vez en cuando. Así no pierdes el trabajo si se va la luz o se cierra el programa.',
          ),
        ],
      },
    ],
    actividad: {
      titulo: 'Practica: guardar un documento',
      preguntas: [
        {
          enunciado: '¿Cuál es un buen nombre para guardar una carta?',
          explicacion:
            'Un nombre que dice de qué trata el documento ayuda a encontrarlo después.',
          opciones: ['«Carta para la EPS»', '«Documento1»'],
          correcta: 0,
        },
        {
          enunciado:
            'Estás en un computador de la sala. ¿Cómo te llevas tu documento?',
          explicacion:
            'Los computadores de la sala los usan muchas personas. Con una memoria USB o tu correo, el documento va contigo.',
          opciones: [
            'Lo dejo guardado en el escritorio de ese computador',
            'Lo guardo en mi memoria USB o me lo envío por correo',
          ],
          correcta: 1,
        },
      ],
    },
  },
  {
    slug: 'abrir-un-documento-guardado',
    categoria: 'documentos',
    titulo: 'Abrir un documento guardado',
    objetivo:
      'Al terminar sabrás encontrar y abrir un documento que guardaste antes.',
    duracionEstimadaMin: 6,
    palabrasClave: [
      'archivo',
      'buscar',
      'encontrar',
      'carpeta',
      'recuperar',
      'memoria USB',
    ],
    pasos: [
      {
        titulo: 'Abre la carpeta',
        bloques: [
          texto(
            'Abre la carpeta donde guardaste el documento, por ejemplo «Documentos». Si está en una memoria USB, conéctala primero.',
          ),
        ],
      },
      {
        titulo: 'Encuentra el documento',
        bloques: [
          texto(
            'Busca el nombre que le pusiste. Si hay muchos archivos, suelen estar en orden alfabético.',
          ),
          consejo(
            'Si no lo ves, escribe su nombre en la casilla de búsqueda de la carpeta.',
          ),
        ],
      },
      {
        titulo: 'Ábrelo',
        bloques: [
          texto(
            'Toca el documento dos veces seguidas. Se abre en el procesador de texto, listo para leer o seguir escribiendo.',
          ),
        ],
      },
      {
        titulo: null,
        bloques: [
          texto('Si cambias algo, vuelve a guardar antes de cerrar.'),
          alerta('Si cierras sin guardar, los cambios se pierden.'),
        ],
      },
    ],
    actividad: {
      titulo: 'Practica: abrir un documento',
      preguntas: [
        {
          enunciado: '¿Cómo se abre un documento desde su carpeta?',
          explicacion:
            'Con dos toques seguidos el documento se abre en el procesador de texto.',
          opciones: [
            'Tocándolo dos veces seguidas',
            'Tocándolo una vez y esperando',
          ],
          correcta: 0,
        },
      ],
    },
  },

  // ─── HU-19: búsqueda en internet ───────────────────────────────────────────
  // El módulo de información confiable (HU-27) todavía no existe: cada guía cierra invitando
  // a la categoría «Seguridad digital», donde va a quedar.
  {
    slug: 'buscar-en-internet',
    categoria: 'busqueda-internet',
    titulo: 'Abrir el navegador y buscar',
    objetivo:
      'Al terminar sabrás usar un buscador para encontrar información en internet.',
    duracionEstimadaMin: 7,
    palabrasClave: [
      'buscador',
      'consultar',
      'averiguar',
      'página web',
      'internet',
    ],
    pasos: [
      {
        titulo: 'Abre el navegador',
        bloques: [
          texto(
            'El navegador es el programa para entrar a internet. Búscalo en el escritorio y tócalo dos veces.',
          ),
        ],
      },
      {
        titulo: 'Escribe lo que buscas',
        bloques: [
          texto(
            'En la casilla del centro escribe lo que quieres saber, por ejemplo «horario biblioteca Barranquilla». Luego oprime la tecla «Enter».',
          ),
        ],
      },
      {
        titulo: 'Mira los resultados',
        bloques: [
          texto(
            'Aparece una lista de páginas. Cada una tiene un título en azul y un texto corto que la describe.',
          ),
        ],
      },
      {
        titulo: 'Entra a una página',
        bloques: [
          texto(
            'Toca el título de la página que te interese. Para volver a la lista, toca la flecha hacia la izquierda, arriba en la pantalla.',
          ),
          consejo(
            'No todo lo que aparece es cierto. En la categoría «Seguridad digital» aprendes a reconocer la información confiable.',
          ),
        ],
      },
    ],
  },
  {
    slug: 'elegir-palabras-para-buscar',
    categoria: 'busqueda-internet',
    nivel: 'INTERMEDIO',
    titulo: 'Elegir buenas palabras para buscar',
    objetivo:
      'Al terminar sabrás escribir búsquedas cortas que encuentran justo lo que necesitas.',
    duracionEstimadaMin: 6,
    palabrasClave: [
      'palabras clave',
      'buscador',
      'consulta',
      'resultados',
      'encontrar',
    ],
    pasos: [
      {
        titulo: 'Usa pocas palabras',
        bloques: [
          texto(
            'El buscador entiende mejor las búsquedas cortas. En vez de una pregunta larga, escribe solo las palabras importantes.',
          ),
          consejo(
            'Ejemplo: «requisitos pasaporte Colombia» en vez de «qué necesito para sacar el pasaporte».',
          ),
        ],
      },
      {
        titulo: 'Di el lugar',
        bloques: [
          texto(
            'Si buscas algo cerca, agrega tu ciudad o tu barrio. «Farmacia de turno Barranquilla» encuentra mejor que solo «farmacia».',
          ),
        ],
      },
      {
        titulo: 'Cambia las palabras',
        bloques: [
          texto(
            'Si no encuentras lo que buscas, prueba con otras palabras que signifiquen lo mismo. Por ejemplo, «médico» en lugar de «doctor».',
          ),
        ],
      },
      {
        titulo: null,
        bloques: [
          texto(
            'Que una página aparezca de primera no significa que diga la verdad. Mira siempre quién la publica.',
          ),
          consejo(
            'En la categoría «Seguridad digital» aprendes a reconocer la información confiable.',
          ),
        ],
      },
    ],
  },
  {
    slug: 'anuncios-y-resultados',
    categoria: 'busqueda-internet',
    nivel: 'INTERMEDIO',
    titulo: 'Distinguir anuncios de resultados',
    objetivo:
      'Al terminar sabrás reconocer cuáles resultados de una búsqueda son publicidad.',
    duracionEstimadaMin: 6,
    palabrasClave: [
      'publicidad',
      'patrocinado',
      'buscador',
      'propaganda',
      'promoción',
    ],
    pasos: [
      {
        titulo: 'Busca la palabra «Anuncio»',
        bloques: [
          texto(
            'Los primeros resultados de una búsqueda a veces son publicidad. Se reconocen porque dicen «Anuncio» o «Patrocinado» en letra pequeña.',
          ),
        ],
      },
      {
        titulo: 'Un anuncio es pagado',
        bloques: [
          texto(
            'Una empresa paga para que su página salga de primera. Eso no quiere decir que sea la mejor ni la más confiable.',
          ),
          alerta(
            'Algunos anuncios imitan páginas de bancos o de entidades del Estado.',
          ),
        ],
      },
      {
        titulo: 'Baja en la lista',
        bloques: [
          texto(
            'Los resultados que no son anuncios están más abajo. Baja con la rueda del ratón y compáralos antes de entrar a una página.',
          ),
        ],
      },
      {
        titulo: 'Revisa la dirección',
        bloques: [
          texto(
            'Antes de tocar un resultado, lee la dirección que aparece junto al título. Las entidades del Estado colombiano terminan en «.gov.co».',
          ),
          consejo(
            'En la categoría «Seguridad digital» aprendes más sobre cómo reconocer la información confiable.',
          ),
        ],
      },
    ],
  },

  // ─── HU-20: redes sociales (sin marcas ni personas reales) ─────────────────
  {
    slug: 'usar-mensajeria-web',
    categoria: 'redes-sociales',
    titulo: 'Usar la mensajería desde el computador',
    objetivo:
      'Al terminar sabrás leer y enviar mensajes desde el computador y cerrar la sesión al terminar.',
    duracionEstimadaMin: 9,
    palabrasClave: [
      'chat',
      'mensajes',
      'conversación',
      'red social',
      'escribir',
      'contactos',
    ],
    pasos: [
      {
        titulo: 'Entra a la página',
        bloques: [
          texto(
            'Abre el navegador y entra a la página de la red social o del servicio de mensajes que usas. Escribe tu usuario y tu contraseña para entrar.',
          ),
          alerta('En la sala nunca marques la casilla «Recordar contraseña».'),
        ],
      },
      {
        titulo: 'Abre una conversación',
        bloques: [
          texto(
            'A la izquierda está la lista de tus conversaciones. Toca el nombre de la persona para ver sus mensajes.',
          ),
        ],
      },
      {
        titulo: 'Escribe y envía',
        bloques: [
          texto(
            'Escribe tu mensaje en la casilla de abajo. Para enviarlo oprime «Enter» o toca la flecha.',
          ),
          consejo(
            'Lee el mensaje antes de enviarlo: después es difícil corregirlo.',
          ),
        ],
      },
      {
        titulo: 'Cierra la sesión',
        bloques: [
          texto(
            'Al terminar, busca «Cerrar sesión» en el menú. Así la próxima persona que use el computador no puede leer tus mensajes.',
          ),
          alerta('Cerrar la ventana no basta: hay que cerrar la sesión.'),
        ],
      },
    ],
  },
  {
    slug: 'privacidad-en-redes-sociales',
    categoria: 'redes-sociales',
    nivel: 'INTERMEDIO',
    titulo: 'Revisar la privacidad de tu red social',
    objetivo: 'Al terminar sabrás elegir quién puede ver lo que publicas.',
    duracionEstimadaMin: 8,
    palabrasClave: [
      'configuración',
      'ajustes',
      'perfil',
      'publicaciones',
      'quién puede ver',
    ],
    pasos: [
      {
        titulo: 'Abre la configuración',
        bloques: [
          texto(
            'Entra a tu red social y busca el menú, que suele ser tu foto o tres rayitas. Toca «Configuración» y luego «Privacidad».',
          ),
        ],
      },
      {
        titulo: 'Elige quién ve tus publicaciones',
        bloques: [
          texto(
            'Busca la opción «Quién puede ver lo que publicas». Elige «Amigos» o «Contactos» en vez de «Público».',
          ),
          consejo(
            'Con «Público», cualquier persona en internet puede ver tus fotos.',
          ),
        ],
      },
      {
        titulo: 'Revisa tus datos',
        bloques: [
          texto(
            'Mira qué datos tuyos están a la vista, como tu teléfono o tu dirección. Deja visibles solo los que quieras compartir.',
          ),
          alerta(
            'No publiques tu número de cédula, tu dirección ni fotos de tus documentos.',
          ),
        ],
      },
      {
        titulo: 'Acepta solo a quien conoces',
        bloques: [
          texto(
            'Si alguien que no conoces te pide ser tu contacto, puedes decir que no. No es mala educación: es cuidarte.',
          ),
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
 * Crea o actualiza la actividad de una guía y sus preguntas por (actividad, orden), sin
 * borrarlas: así no se pierden los intentos ni las respuestas que apuntan a ellas.
 * Devuelve cuántas preguntas sembró.
 */
async function sembrarActividad(
  prisma: PrismaClient,
  guiaId: string,
  { titulo, preguntas }: ActividadSemilla,
  autorId: string,
): Promise<number> {
  const actividad = await prisma.actividad.upsert({
    where: { guiaId },
    create: { guiaId, titulo, creadaPorId: autorId, actualizadaPorId: autorId },
    update: { titulo },
  });
  for (const [
    i,
    { enunciado, explicacion, opciones, correcta },
  ] of preguntas.entries()) {
    const datos = { enunciado, explicacion };
    const orden = i + 1;
    // findFirst y no upsert: la UNIQUE (actividad_id, orden) es diferible y ON CONFLICT no la admite.
    const existente = await prisma.pregunta.findFirst({
      where: { actividadId: actividad.id, orden },
    });
    const pregunta = existente
      ? await prisma.pregunta.update({
          where: { id: existente.id },
          data: datos,
        })
      : await prisma.pregunta.create({
          data: { actividadId: actividad.id, orden, ...datos },
        });
    for (const [j, texto] of opciones.entries()) {
      const opcion = { texto, esCorrecta: j === correcta };
      await prisma.opcion.upsert({
        where: { preguntaId_orden: { preguntaId: pregunta.id, orden: j + 1 } },
        create: { preguntaId: pregunta.id, orden: j + 1, ...opcion },
        update: opcion,
      });
    }
  }
  return preguntas.length;
}

/**
 * HU-29: una solicitud de ayuda en espera, para que la cola del personal no salga vacía en
 * la demo. Si ya existe no se toca: puede que ya la hayan cancelado o atendido.
 */
async function sembrarSolicitudAyuda(prisma: PrismaClient): Promise<void> {
  const id = '00000000-0000-4000-8000-000000000029';
  const guia = await prisma.guia.findUnique({
    where: { slug: 'smishing' },
    select: { id: true, pasos: { where: { orden: 3 }, select: { id: true } } },
  });
  await prisma.solicitudAyuda.upsert({
    where: { id },
    create: {
      id,
      equipo: 'Equipo 7',
      tema: 'SEGURIDAD_DIGITAL',
      guiaId: guia?.id,
      pasoId: guia?.pasos[0]?.id,
    },
    update: {},
  });
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
    let preguntas = 0;
    for (const {
      slug,
      categoria = 'seguridad-digital',
      nivel = 'BASICO',
      pasos,
      actividad,
      ...datos
    } of GUIAS) {
      const categoriaId = CATEGORIAS.find((c) => c.slug === categoria)?.id;
      if (!categoriaId) {
        throw new Error(
          `La guía ${slug} tiene una categoría desconocida: ${categoria}`,
        );
      }
      const guia = await prisma.guia.upsert({
        where: { slug },
        create: {
          slug,
          ...datos,
          categoriaId,
          nivel,
          estado: 'PUBLICADA',
          publicadaEn: new Date('2026-11-01T00:00:00.000Z'),
          creadaPorId: autorId,
          actualizadaPorId: autorId,
        },
        update: { ...datos, categoriaId, nivel },
      });
      imagenes += await sembrarPasos(prisma, guia.id, pasos, autorId);
      if (actividad) {
        preguntas += await sembrarActividad(
          prisma,
          guia.id,
          actividad,
          autorId,
        );
      }
    }

    await sembrarSolicitudAyuda(prisma);

    const admin = await sembrarAdministradorInicial(prisma);

    console.log(
      `Semillas cargadas: aviso de privacidad ${AVISO_PRIVACIDAD.version}, ${CATEGORIAS.length} categorías, ${GUIAS.length} guías (${imagenes} imágenes, ${preguntas} preguntas de práctica), 1 solicitud de ayuda y ${admin}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

await main();
