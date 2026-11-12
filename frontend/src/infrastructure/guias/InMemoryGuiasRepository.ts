import type { GuiasRepository } from '../../application/guias/ports';
import type { Categoria, DetalleGuia, Guia } from '../../domain/guias/types';

export class InMemoryGuiasRepository implements GuiasRepository {
  private readonly categoriaPhishing: Categoria = {
    id: 'cat-phishing',
    slug: 'phishing',
    nombre: 'Phishing',
    numero: '01 / CATEGORÍA',
    descripcion:
      'Reconoce los engaños antes de actuar. Algunas personas se hacen pasar por alguien de confianza para pedirte datos o dinero. Aprende a reconocer sus señales en mensajes, llamadas, códigos QR y alertas falsas.',
  };

  private readonly guias: Map<string, DetalleGuia> = new Map();

  constructor() {
    this.inicializarDatos();
  }

  async obtenerCategoria(slug: string): Promise<Categoria | null> {
    if (slug === 'phishing') {
      return this.categoriaPhishing;
    }
    return null;
  }

  async listarGuiasPublicadas(categoriaSlug?: string): Promise<Guia[]> {
    const todas = Array.from(this.guias.values()).map((d) => d.guia);
    if (!categoriaSlug) {
      return todas.filter((g) => g.estado === 'PUBLICADA');
    }
    return todas.filter(
      (g) => g.categoriaSlug === categoriaSlug && g.estado === 'PUBLICADA',
    );
  }

  async obtenerDetalleGuia(slug: string): Promise<DetalleGuia | null> {
    return this.guias.get(slug) ?? null;
  }

  async registrarAperturaGuia(slug: string): Promise<void> {
    void slug;
    // Registrado localmente / telemetría simulada
    return Promise.resolve();
  }

  private inicializarDatos(): void {
    // 01 · Smishing
    this.guias.set('smishing', {
      guia: {
        slug: 'smishing',
        numero: '01',
        titulo: 'Smishing',
        subtitulo: 'Mensajes falsos por SMS o WhatsApp',
        descripcion: 'Mensajes falsos por SMS o WhatsApp.',
        duracionEstimadaMinutos: 8,
        nivel: 'Básico',
        estado: 'PUBLICADA',
        categoriaSlug: 'phishing',
        objetivo: 'Aprender a reconocer las señales de un mensaje engañoso.',
      },
      pasos: [
        {
          numero: 1,
          titulo: '01 / Haz una pausa',
          contenido:
            'Un mensaje puede parecer de tu banco y no serlo. Si te pide actuar de inmediato, detente antes de tocar un enlace. La urgencia es una señal de alerta.',
          recordatorio: {
            titulo: 'Recuerda',
            consejo: 'No tienes que responder de inmediato.',
          },
          ejemplo: {
            tipo: 'whatsapp',
            titulo: 'Mensaje de un número desconocido',
            remitente: '+00 000 000 000 · Hoy, 10:42',
            contenido:
              'URGENTE: tu cuenta será bloqueada hoy. Confirma tus datos en este enlace para evitarlo.',
            enlaceODetalle: 'banco-ejemplo.invalid/verificar',
            senalAlerta: '!  Te presiona para actuar rápido',
            textoAlternativo:
              'Ejemplo simulado de mensaje de texto alarmante solicitando confirmar datos en un enlace ficticio.',
          },
        },
        {
          numero: 2,
          titulo: '02 / Revisa quién escribe',
          contenido:
            'Comprueba si el número o nombre coincide con tus contactos conocidos. Los estafadores usan números desconocidos o nombres parecidos a entidades oficiales.',
          recordatorio: {
            titulo: 'Recuerda',
            consejo:
              'Un logo en la foto de perfil no garantiza que el mensaje sea auténtico.',
          },
          ejemplo: {
            tipo: 'whatsapp',
            titulo: 'Remitente desconocido con logo bancario',
            remitente: '+57 300 000 0000 · Cuenta no verificada',
            contenido:
              'Estimado cliente: detectamos un movimiento no autorizado en su cuenta de ahorros.',
            enlaceODetalle: 'servicio-banco-ficticio.invalid',
            senalAlerta:
              '!  Número celular desconocido afirmando ser una entidad',
            textoAlternativo:
              'Ejemplo simulado de remitente sospechoso que utiliza una imagen institucional sin verificación.',
          },
        },
        {
          numero: 3,
          titulo: '03 / Desconfía de los enlaces',
          contenido:
            'Nunca abras enlaces que te envíen por mensaje de texto solicitando contraseñas o números de tarjeta. Si tienes dudas, ingresa tú mismo escribiendo la dirección oficial en el navegador.',
          recordatorio: {
            titulo: 'Recuerda',
            consejo:
              'Las entidades financieras nunca piden claves por mensaje ni por enlace.',
          },
          ejemplo: {
            tipo: 'sms',
            titulo: 'Enlace engañoso en mensaje SMS',
            remitente: 'BANCO-AVISO',
            contenido:
              'Su clave de internet vencerá hoy. Renueve su clave aquí: http://banco-actualiza.invalid',
            enlaceODetalle: 'banco-actualiza.invalid (Dirección sospechosa)',
            senalAlerta: '!  Dirección web extraña que no es la oficial',
            textoAlternativo:
              'Ejemplo simulado de SMS con dirección web fraudulenta solicitando renovar contraseñas.',
          },
        },
        {
          numero: 4,
          titulo: '04 / Consulta por un canal seguro',
          contenido:
            'Si el mensaje dice ser de tu banco o de un familiar con un problema urgente, comunícate por el número habitual que tengas guardado. No uses los números ni datos que vengan en ese mismo mensaje.',
          recordatorio: {
            titulo: 'Recuerda',
            consejo:
              'Verificar directamente con la persona o entidad evita confusiones.',
          },
          ejemplo: {
            tipo: 'llamada',
            titulo: 'Verificación directa',
            remitente: 'Llamada al número oficial del reverso de tu tarjeta',
            contenido:
              'Llama directamente a la línea de atención al cliente oficial para confirmar si el mensaje era real.',
            enlaceODetalle: 'Línea de atención oficial conocida',
            senalAlerta: '✓  Acción segura recomendada',
            textoAlternativo:
              'Esquema recomendado para consultar mediante la línea telefónica oficial conocida.',
          },
        },
        {
          numero: 5,
          titulo: '05 / Protege tu información',
          contenido:
            'Recuerda las tres reglas de oro: no compartas contraseñas ni códigos OTP, deténte ante cualquier mensaje alarmante y pide apoyo en el CLENA si tienes dudas.',
          recordatorio: {
            titulo: 'Recuerda',
            consejo: 'Aprender a tu ritmo y con calma te mantiene seguro.',
          },
          ejemplo: {
            tipo: 'whatsapp',
            titulo: 'Tus reglas de oro',
            remitente: 'Kamá · Autoaprendizaje CLENA',
            contenido:
              '1. No compartas claves ni códigos.\n2. Verifica por un canal conocido.\n3. Deténte ante la urgencia o el miedo.',
            enlaceODetalle: 'Consejos de seguridad Kamá',
            senalAlerta: '✓  Protección garantizada al seguir estas pautas',
            textoAlternativo:
              'Infografía simulada con las tres reglas de oro de seguridad digital para adultos mayores.',
          },
        },
      ],
      preguntas: [
        {
          id: 'smishing-p1',
          numero: 1,
          enunciado:
            'Recibiste un mensaje que te pide ingresar urgentemente a un enlace para evitar el bloqueo de tu cuenta. ¿Qué deberías hacer?',
          opciones: [
            { id: 'A', texto: 'Abrir el enlace y escribir mis datos.' },
            {
              id: 'B',
              texto:
                'No abrir el enlace y consultar al banco por un canal oficial.',
            },
            { id: 'C', texto: 'Reenviar el mensaje a mis contactos.' },
          ],
          opcionCorrecta: 'B',
          explicacion:
            'Los bancos nunca te pedirán ingresar a un enlace con urgencia para evitar el bloqueo. Siempre debes comunicarte por el teléfono oficial que conoces o en la sucursal.',
          mensajeSimulado: {
            tipo: 'sms',
            titulo: 'MENSAJE SIMULADO',
            remitente: 'Número desconocido',
            contenido:
              'URGENTE: tu cuenta será bloqueada hoy. Ingresa aquí para verificar tus datos.',
            enlaceODetalle: 'banco-ejemplo.invalid',
            senalAlerta: '!  Urgencia y enlace desconocido',
            textoAlternativo:
              'Mensaje de texto simulado con urgencia falsa y enlace inerte.',
          },
        },
        {
          id: 'smishing-p2',
          numero: 2,
          enunciado:
            'Un número desconocido te escribe por WhatsApp diciendo: "Hola mamá, cambié de número, necesito que me transfieras dinero urgente". ¿Cómo actúas?',
          opciones: [
            {
              id: 'A',
              texto:
                'Hacer la transferencia de inmediato porque dice ser un familiar.',
            },
            {
              id: 'B',
              texto:
                'Llamar al número habitual de tu familiar para comprobar si realmente es él o ella.',
            },
            { id: 'C', texto: 'Responder enviándole tus datos personales.' },
          ],
          opcionCorrecta: 'B',
          explicacion:
            'La suplantación de familiares es muy común. Siempre debes llamar al número de siempre antes de enviar cualquier dinero.',
          mensajeSimulado: {
            tipo: 'whatsapp',
            titulo: 'MENSAJE SIMULADO',
            remitente: '+57 311 000 0000 · Sin foto',
            contenido:
              'Hola má, se me dañó el celular y este es mi número provisional. Necesito pagar algo urgente, ¿me ayudas con una transferencia?',
            enlaceODetalle: 'Cuenta bancaria de un tercero',
            senalAlerta: '!  Pide dinero y no puedes verificar su voz',
            textoAlternativo:
              'Mensaje de WhatsApp simulado pidiendo dinero haciéndose pasar por un hijo.',
          },
        },
        {
          id: 'smishing-p3',
          numero: 3,
          enunciado:
            'Te llega un SMS: "Ganaste un subsidio de $500.000. Reclámalo aquí antes de 1 hora". ¿Es confiable o es un fraude?',
          opciones: [
            {
              id: 'A',
              texto: 'Es confiable, porque los bonos se vencen rápido.',
            },
            {
              id: 'B',
              texto:
                'Es un fraude. Los premios inesperados con enlaces urgentes buscan capturar tus datos.',
            },
            { id: 'C', texto: 'Es confiable si viene con un enlace corto.' },
          ],
          opcionCorrecta: 'B',
          explicacion:
            'Nadie entrega premios ni subsidios en los que no te inscribiste previamente. La urgencia y el premio falso son señales claras de engaño.',
          mensajeSimulado: {
            tipo: 'sms',
            titulo: 'MENSAJE SIMULADO',
            remitente: 'SUBSIDIO-GOB',
            contenido:
              'FELICIDADES: Ha sido seleccionado para el subsidio solidario extraordinario. Reclame aquí: subsidio-ejemplo.invalid',
            enlaceODetalle: 'subsidio-ejemplo.invalid',
            senalAlerta: '!  Premio no solicitado con enlace extraño',
            textoAlternativo:
              'Mensaje de texto prometiendo subsidios inexistentes mediante enlace ficticio.',
          },
        },
        {
          id: 'smishing-p4',
          numero: 4,
          enunciado:
            'Un mensaje te pide confirmar el código de 6 dígitos que te acaba de llegar a tu celular para "validar tu identidad". ¿Qué debes hacer?',
          opciones: [
            {
              id: 'A',
              texto:
                'Compartir el código porque te lo están pidiendo amablemente.',
            },
            {
              id: 'B',
              texto:
                'Nunca compartirlo. Ese código es privado y da acceso a tus cuentas o WhatsApp.',
            },
            {
              id: 'C',
              texto: 'Publicarlo en redes para que te ayuden a revisarlo.',
            },
          ],
          opcionCorrecta: 'B',
          explicacion:
            'Los códigos de verificación o contraseñas temporales son estrictamente personales. Ninguna entidad legítima te los pedirá.',
          mensajeSimulado: {
            tipo: 'sms',
            titulo: 'MENSAJE SIMULADO',
            remitente: 'Código OTP 6 Dígitos',
            contenido:
              'Tu código de WhatsApp es 482-194. No lo compartas con nadie.',
            enlaceODetalle: 'Código de seguridad privado',
            senalAlerta: '!  Petición de código confidencial',
            textoAlternativo:
              'Mensaje de confirmación de código de seguridad que nunca debe compartirse.',
          },
        },
        {
          id: 'smishing-p5',
          numero: 5,
          enunciado:
            'Ves un enlace que termina en ".invalid" o tiene letras raras parecidas al nombre de tu entidad. ¿Qué significa?',
          opciones: [
            {
              id: 'A',
              texto: 'Es una dirección web falsa creada para engañarte.',
            },
            { id: 'B', texto: 'Es una dirección web moderna y segura.' },
            { id: 'C', texto: 'Es un enlace oficial de respaldo.' },
          ],
          opcionCorrecta: 'A',
          explicacion:
            'Los estafadores crean enlaces con nombres parecidos para confundir a las personas. Si la dirección tiene letras raras o no es la oficial, nunca ingreses.',
          mensajeSimulado: {
            tipo: 'whatsapp',
            titulo: 'MENSAJE SIMULADO',
            remitente: 'Portal de seguridad',
            contenido:
              'Entra a www.banc0-colombia-seguro.invalid para revisar tu clave.',
            enlaceODetalle: 'banc0 con un cero en lugar de la letra o',
            senalAlerta: '!  Sustitución de letras por números en la dirección',
            textoAlternativo:
              'Ejemplo de dirección web falsa imitando a un banco con caracteres modificados.',
          },
        },
      ],
    });

    // 02 · Vishing
    this.guias.set('vishing', {
      guia: {
        slug: 'vishing',
        numero: '02',
        titulo: 'Vishing',
        subtitulo: 'Llamadas telefónicas que buscan engañarte',
        descripcion: 'Llamadas telefónicas que buscan engañarte.',
        duracionEstimadaMinutos: 7,
        nivel: 'Básico',
        estado: 'PUBLICADA',
        categoriaSlug: 'phishing',
        objetivo:
          'Identificar cuando una llamada pretende sacarte datos o códigos de seguridad.',
      },
      pasos: [
        {
          numero: 1,
          titulo: '01 / Respira y no sientas prisa',
          contenido:
            'En el vishing, una persona te llama haciéndose pasar por asesor bancario, policía o funcionario. Su objetivo es ponerte nervioso para que actúes sin pensar.',
          recordatorio: {
            titulo: 'Recuerda',
            consejo:
              'Ninguna urgencia bancaria se resuelve dando datos por teléfono.',
          },
          ejemplo: {
            tipo: 'llamada',
            titulo: 'Llamada sospechosa',
            remitente: 'Número desconocido o privado',
            contenido:
              '«Señor(a), le hablamos del área de fraudes. Alguien está retirando dinero de su cuenta ahora mismo. Dígame su clave para congelar la transacción.»',
            enlaceODetalle: 'Llamada entrante con presión psicológica',
            senalAlerta: '!  Voz de alarma y solicitud inmediata de clave',
            textoAlternativo:
              'Llamada telefónica simulada con un supuesto asesor pidiendo la clave para evitar un fraude.',
          },
        },
        {
          numero: 2,
          titulo: '02 / Cuelga y llama tú mismo',
          contenido:
            'Si desconfías de una llamada, tienes todo el derecho de colgar de inmediato. Luego, busca la tarjeta de tu banco y llama al número oficial impreso en el reverso.',
          recordatorio: {
            titulo: 'Recuerda',
            consejo:
              'Colgar una llamada sospechosa no tiene ninguna consecuencia negativa.',
          },
        },
        {
          numero: 3,
          titulo: '03 / Los códigos OTP son solo tuyos',
          contenido:
            'Si durante la llamada te llega un mensaje con un código de 6 dígitos, jamás se lo leas al interlocutor. El estafador lo está pidiendo para ingresar a tu cuenta.',
          recordatorio: {
            titulo: 'Recuerda',
            consejo:
              'Los asesores legítimos nunca te piden códigos de verificación.',
          },
        },
      ],
      preguntas: [
        {
          id: 'vishing-p1',
          numero: 1,
          enunciado:
            'Te llama un supuesto asesor diciéndote que te robarán tu dinero si no le dictas el código que te acaba de llegar al celular. ¿Qué haces?',
          opciones: [
            { id: 'A', texto: 'Dictarle el código rápido para protegerme.' },
            {
              id: 'B',
              texto:
                'Colgar inmediatamente y llamar al número oficial de mi banco.',
            },
            {
              id: 'C',
              texto: 'Pedirle su nombre completo y dictarle la clave.',
            },
          ],
          opcionCorrecta: 'B',
          explicacion:
            'Los códigos recibidos por SMS son solo para ti. Quien te los pida por teléfono está intentando entrar a tus cuentas.',
          mensajeSimulado: {
            tipo: 'llamada',
            titulo: 'LLAMADA SIMULADA',
            remitente: 'Supuesto Asesor de Seguridad',
            contenido:
              '«Por favor dígame los 6 dígitos que le enviamos a su teléfono para anular el cobro».',
            senalAlerta: '!  Petición verbal de código de seguridad',
            textoAlternativo: 'Simulación de llamada pidiendo código SMS.',
          },
        },
      ],
    });

    // 03 · Quishing
    this.guias.set('quishing', {
      guia: {
        slug: 'quishing',
        numero: '03',
        titulo: 'Quishing',
        subtitulo: 'Engaños que se esconden en códigos QR',
        descripcion: 'Engaños que se esconden en códigos QR.',
        duracionEstimadaMinutos: 6,
        nivel: 'Básico',
        estado: 'PUBLICADA',
        categoriaSlug: 'phishing',
        objetivo:
          'Aprender a verificar la dirección web antes de abrir un código QR.',
      },
      pasos: [
        {
          numero: 1,
          titulo: '01 / El código QR es solo un enlace',
          contenido:
            'Un código QR funciona igual que tocar un enlace en internet. Al escanearlo con la cámara, tu celular te muestra primero a qué dirección web te va a llevar.',
          recordatorio: {
            titulo: 'Recuerda',
            consejo:
              'Siempre lee la dirección que aparece en pantalla antes de presionar abrir.',
          },
        },
        {
          numero: 2,
          titulo: '02 / Cuidado con pegatinas sospechosas',
          contenido:
            'En restaurantes, parquímetros o comercios, los estafadores a veces pegan un código QR falso encima del original. Toca la superficie para asegurarte de que no sea una pegatina sobrepuesta.',
          recordatorio: {
            titulo: 'Recuerda',
            consejo:
              'Si la pegatina está suelta o doblada, desconfía y pregunta al personal.',
          },
        },
      ],
      preguntas: [
        {
          id: 'quishing-p1',
          numero: 1,
          enunciado:
            'Escaneas un código QR en una mesa y la cámara te muestra la dirección «pagos-restaurante-gratis.invalid». ¿Qué haces?',
          opciones: [
            { id: 'A', texto: 'Abrir y pagar sin mirar más.' },
            {
              id: 'B',
              texto:
                'No abrir el enlace y preguntarle al personal del restaurante por el medio de pago oficial.',
            },
            { id: 'C', texto: 'Escanearlo varias veces seguidas.' },
          ],
          opcionCorrecta: 'B',
          explicacion:
            'Verificar con el personal del establecimiento evita que caigas en códigos QR adulterados.',
          mensajeSimulado: {
            tipo: 'qr',
            titulo: 'CÓDIGO QR SIMULADO',
            remitente: 'Pegatina sobre mesa de restaurante',
            contenido: 'Escanea para pagar tu cuenta en línea',
            enlaceODetalle: 'pagos-restaurante-gratis.invalid',
            senalAlerta: '!  Dirección web no oficial',
            textoAlternativo: 'Código QR simulado con dirección no verificada.',
          },
        },
      ],
    });

    // 04 · Falso soporte técnico
    this.guias.set('falso-soporte-tecnico', {
      guia: {
        slug: 'falso-soporte-tecnico',
        numero: '04',
        titulo: 'Falso soporte técnico',
        subtitulo: 'Alertas falsas y solicitudes de acceso al computador',
        descripcion: 'Alertas falsas y solicitudes de acceso al computador.',
        duracionEstimadaMinutos: 10,
        nivel: 'Básico',
        estado: 'PUBLICADA',
        categoriaSlug: 'phishing',
        objetivo:
          'Identificar falsas alertas de virus en pantalla y evitar que extraños controlen tu equipo.',
      },
      pasos: [
        {
          numero: 1,
          titulo: '01 / No te alarmes por ventanas emergentes',
          contenido:
            'Una ventana roja con sonidos y mensajes de «¡Tu equipo tiene 5 virus!» casi siempre es una página engañosa. Las empresas de computadores no te muestran números para que llames con urgencia.',
          recordatorio: {
            titulo: 'Recuerda',
            consejo: 'Cierra la pestaña del navegador con tranquilidad.',
          },
        },
        {
          numero: 2,
          titulo: '02 / Jamás permitas acceso remoto a desconocidos',
          contenido:
            'Si alguien te pide instalar programas como AnyDesk o TeamViewer para «limpiar tu computador», niégate. Dar acceso remoto es entregarle el control completo de tus archivos.',
          recordatorio: {
            titulo: 'Recuerda',
            consejo:
              'Si tienes dudas en la Sala de Internet, pídele ayuda a un monitor del CLENA.',
          },
        },
      ],
      preguntas: [
        {
          id: 'soporte-p1',
          numero: 1,
          enunciado:
            'Navegando en internet te salta una ventana con sirenas: «¡Virus detectado! Llame al 018000 para soporte Microsoft». ¿Qué debes hacer?',
          opciones: [
            {
              id: 'A',
              texto:
                'Llamar de inmediato al número que aparece en la pantalla.',
            },
            {
              id: 'B',
              texto:
                'Cerrar la pestaña del navegador y no llamar a ningún número.',
            },
            {
              id: 'C',
              texto: 'Instalar el programa que te recomiende la ventana.',
            },
          ],
          opcionCorrecta: 'B',
          explicacion:
            'Las empresas tecnológicas nunca te ponen números telefónicos en alertas de navegador pidiéndote que llames.',
          mensajeSimulado: {
            tipo: 'ventana',
            titulo: 'ALERTA SIMULADA',
            remitente: 'Ventana emergente del navegador',
            contenido:
              '«¡Alerta crítica de seguridad! Su equipo fue bloqueado. Llame ahora a soporte técnico».',
            enlaceODetalle: 'Teléfono de contacto falso',
            senalAlerta: '!  Alarma exagerada para provocar miedo',
            textoAlternativo: 'Ventana engañosa de falso soporte técnico.',
          },
        },
      ],
    });
  }
}
