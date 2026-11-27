import QRCode from 'qrcode';
import type { GeneradorQr } from '@/application/qr/ports';

/**
 * QR con la librería `qrcode` (MIT). Corrección de errores M: aguanta algo de desgaste o
 * suciedad del papel impreso. Margen de 4 módulos, el mínimo que piden los lectores.
 */
export class QrcodeSvgGenerador implements GeneradorQr {
  svg(texto: string): Promise<string> {
    return QRCode.toString(texto, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 4,
      color: { dark: '#000000', light: '#ffffff' },
    });
  }
}
