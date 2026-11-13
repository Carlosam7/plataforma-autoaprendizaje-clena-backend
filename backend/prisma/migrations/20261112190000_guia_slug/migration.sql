-- HU-09 / HU-45: identificador legible de la guía para URLs y códigos QR.
-- NOT NULL sin valor por defecto: todavía no hay guías creadas en ningún entorno.
ALTER TABLE "guia" ADD COLUMN "slug" VARCHAR(80) NOT NULL;

CREATE UNIQUE INDEX "guia_slug_key" ON "guia"("slug");

-- Solo minúsculas sin tildes, números y guiones: así la URL nunca necesita codificarse.
ALTER TABLE "guia" ADD CONSTRAINT "guia_slug_formato_check"
  CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
