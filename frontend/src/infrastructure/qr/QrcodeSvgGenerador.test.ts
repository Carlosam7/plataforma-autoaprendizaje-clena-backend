import QRCode from 'qrcode';
import { describe, expect, it } from 'vitest';
import { QrcodeSvgGenerador } from './QrcodeSvgGenerador';

describe('FE-11 · QrcodeSvgGenerador', () => {
  it('genera un SVG con la URL codificada', async () => {
    const url = 'https://kama.clena.example/guias/smishing';
    const svg = await new QrcodeSvgGenerador().svg(url);
    expect(svg.startsWith('<svg')).toBe(true);
    // El mismo texto con las mismas opciones da el mismo dibujo: la URL va en el QR.
    const otro = await QRCode.toString(url, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 4,
      color: { dark: '#000000', light: '#ffffff' },
    });
    expect(svg).toBe(otro);
    expect(await new QrcodeSvgGenerador().svg(`${url}-x`)).not.toBe(svg);
  });
});
