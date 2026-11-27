/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * FE-11: URL pública con la que se abre Kamá desde los teléfonos (la de los QR impresos),
   * p. ej. `https://kama.clena.example`. Sin ella se usa la dirección actual del navegador.
   */
  readonly VITE_URL_PUBLICA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
