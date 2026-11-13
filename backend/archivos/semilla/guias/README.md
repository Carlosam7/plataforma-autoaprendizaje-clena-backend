# Imágenes de las guías semilla (HU-10)

`pnpm prisma:seed` busca aquí estos archivos. Si uno no está, el paso se muestra sin esa imagen.

| Archivo (sin extensión) | Guía · paso | Qué debe mostrar (es su texto alternativo) |
|---|---|---|
| `smishing-1` | Smishing · 1 | Mensaje de texto de un número desconocido que dice que tu cuenta será bloqueada hoy |
| `smishing-3` | Smishing · 3 | Mensaje con un enlace que imita la dirección de un banco |
| `vishing-2` | Vishing · 2 | Pantalla de una llamada entrante de un número desconocido que dice ser el banco |
| `quishing-1` | Quishing · 1 | Cartel con un código QR para pagar el parqueadero |
| `falso-soporte-1` | Falso soporte técnico · 1 | Ventana roja que dice que el computador está infectado y muestra un número de teléfono |

Reglas:

- Formato `.png`, `.jpg`, `.jpeg` o `.webp` (la base de datos no acepta otros). Máximo 5 MB; mejor menos de 200 KB para que cargue rápido en celular.
- Contenido ficticio: nada de capturas con números, nombres, correos o datos reales.
- Si cambias qué muestra una imagen, cambia también su texto alternativo en `prisma/seed.ts`.
- Se sirven en `/api/v1/archivos/semilla/guias/<archivo>`.
