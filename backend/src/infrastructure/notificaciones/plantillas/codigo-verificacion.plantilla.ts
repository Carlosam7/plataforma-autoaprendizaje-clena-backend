import {
  MensajeCodigo,
  PropositoCodigo,
} from '../../../application/auth/codigo-verificacion.port.js';

export interface CorreoArmado {
  asunto: string;
  html: string;
  texto: string;
}

const TEXTOS: Record<PropositoCodigo, { asunto: string; para: string }> = {
  REGISTRO: {
    asunto: 'Código de verificación para tu registro en Kamá',
    para: 'para completar tu registro en Kamá',
  },
};

/** «483920» → «483 920»: en dos grupos se lee y se copia más fácil. */
function agrupar(codigo: string): string {
  return codigo.replace(/^(\d{3})(\d{3})$/, '$1 $2');
}

export function plantillaCodigoVerificacion(
  mensaje: MensajeCodigo,
): CorreoArmado {
  const { asunto, para } = TEXTOS[mensaje.proposito];
  const codigo = agrupar(mensaje.codigo);
  const vence = `Vence en ${mensaje.vigenciaMinutos} minutos.`;
  const aviso =
    'Nadie del CLENA te va a pedir este código por teléfono, mensaje o correo. Si alguien te lo pide, no se lo des.';

  const texto = [
    'Hola, ',
    '',
    `Tu código de verificación ${para} es:`,
    '',
    codigo,
    '',
    vence,
    '',
    aviso,
    '',
    'Si tú no pediste este código, ignora este mensaje.',
    '',
    'Kamá - Sala de Internet del CLENA',
  ].join('\n');

  return {
    asunto,
    texto,
    html: html(codigo, para, vence, aviso),
  };
}

function html(
  codigo: string,
  para: string,
  vence: string,
  aviso: string,
): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tu código de Kamá</title>
</head>
<body style="margin:0;padding:0;background:#f2f2f2;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f2;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
<tr><td style="padding:28px 28px 8px;font-size:26px;font-weight:bold;color:#0b3d91;">Kamá</td></tr>
<tr><td style="padding:8px 28px;font-size:20px;line-height:1.5;">Hola, este es tu código ${para}:</td></tr>
<tr><td align="center" style="padding:16px 28px;">
<div style="display:inline-block;background:#0b3d91;color:#ffffff;font-size:40px;font-weight:bold;letter-spacing:6px;padding:16px 28px;border-radius:10px;">${codigo}</div>
</td></tr>
<tr><td style="padding:8px 28px;font-size:20px;line-height:1.5;"><strong>${vence}</strong></td></tr>
<tr><td style="padding:16px 28px;">
<div style="background:#fff4e5;border-left:6px solid #b45309;padding:14px 16px;font-size:18px;line-height:1.5;">${aviso}</div>
</td></tr>
<tr><td style="padding:8px 28px 28px;font-size:16px;line-height:1.5;color:#444444;">Si tú no pediste este código, ignora este correo.<br>Kamá — Sala de Internet del CLENA</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
