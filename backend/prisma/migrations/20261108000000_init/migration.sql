-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "tipo_metodo_inicio" AS ENUM ('CORREO', 'TELEFONO');

-- CreateEnum
CREATE TYPE "rol_personal" AS ENUM ('PERSONAL', 'ADMINISTRADOR');

-- CreateEnum
CREATE TYPE "proposito_codigo" AS ENUM ('REGISTRO', 'INICIO_SESION', 'ELIMINAR_CUENTA', 'RESTABLECER_PASSWORD', 'CAMBIO_PASSWORD_INICIAL');

-- CreateEnum
CREATE TYPE "tamano_letra" AS ENUM ('NORMAL', 'GRANDE', 'MUY_GRANDE');

-- CreateEnum
CREATE TYPE "nivel_guia" AS ENUM ('BASICO', 'INTERMEDIO', 'AVANZADO');

-- CreateEnum
CREATE TYPE "estado_guia" AS ENUM ('BORRADOR', 'PUBLICADA', 'OCULTA');

-- CreateEnum
CREATE TYPE "estado_solicitud" AS ENUM ('PENDIENTE', 'EN_ATENCION', 'RESUELTA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "tema_ayuda" AS ENUM ('CORREO', 'BUSQUEDA_INTERNET', 'DOCUMENTOS', 'REDES_SOCIALES', 'SEGURIDAD_DIGITAL', 'USO_DEL_EQUIPO', 'IMPRESION', 'OTRO');

-- CreateEnum
CREATE TYPE "valor_calificacion" AS ENUM ('ME_AYUDO', 'MAS_O_MENOS', 'NO_ME_AYUDO');

-- CreateEnum
CREATE TYPE "origen_calificacion" AS ENUM ('CIERRE_SESION', 'FIN_GUIA');

-- CreateTable
CREATE TABLE "usuario_publico" (
    "numero_identificacion" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "fecha_nacimiento" DATE NOT NULL,
    "tamano_letra" "tamano_letra" NOT NULL DEFAULT 'NORMAL',
    "alto_contraste" BOOLEAN NOT NULL DEFAULT false,
    "nivel_experiencia" "nivel_guia",
    "tutorial_visto" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "usuario_publico_pkey" PRIMARY KEY ("numero_identificacion")
);

-- CreateTable
CREATE TABLE "metodo_inicio" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" VARCHAR(20) NOT NULL,
    "tipo" "tipo_metodo_inicio" NOT NULL,
    "valor" VARCHAR(255) NOT NULL,
    "verificado_en" TIMESTAMPTZ,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metodo_inicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aviso_privacidad" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "version" VARCHAR(20) NOT NULL,
    "contenido" TEXT NOT NULL,
    "vigente_desde" TIMESTAMPTZ NOT NULL,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aviso_privacidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consentimiento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" VARCHAR(20) NOT NULL,
    "aviso_privacidad_id" UUID NOT NULL,
    "aceptado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consentimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(120) NOT NULL,
    "correo" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rol" "rol_personal" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "debe_cambiar_password" BOOLEAN NOT NULL DEFAULT true,
    "creado_por_id" UUID,
    "ultimo_acceso_en" TIMESTAMPTZ,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "personal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_publico_id" VARCHAR(20),
    "personal_id" UUID,
    "token_hash" VARCHAR(255) NOT NULL,
    "expira_en" TIMESTAMPTZ NOT NULL,
    "revocado_en" TIMESTAMPTZ,
    "reemplazado_por_id" UUID,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codigo_verificacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "proposito" "proposito_codigo" NOT NULL,
    "metodo_inicio_id" UUID,
    "personal_id" UUID,
    "codigo_hash" VARCHAR(255) NOT NULL,
    "intentos" SMALLINT NOT NULL DEFAULT 0,
    "expira_en" TIMESTAMPTZ NOT NULL,
    "usado_en" TIMESTAMPTZ,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codigo_verificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoria" (
    "id" SMALLINT NOT NULL,
    "slug" VARCHAR(40) NOT NULL,
    "nombre" VARCHAR(60) NOT NULL,
    "icono" VARCHAR(60) NOT NULL,
    "orden" SMALLINT NOT NULL,

    CONSTRAINT "categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guia" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "categoria_id" SMALLINT NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "objetivo" VARCHAR(300) NOT NULL,
    "descripcion" TEXT,
    "nivel" "nivel_guia" NOT NULL,
    "duracion_estimada_min" SMALLINT NOT NULL,
    "palabras_clave" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "estado" "estado_guia" NOT NULL DEFAULT 'BORRADOR',
    "publicada_en" TIMESTAMPTZ,
    "creada_por_id" UUID NOT NULL,
    "actualizada_por_id" UUID NOT NULL,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "guia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paso" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "guia_id" UUID NOT NULL,
    "orden" SMALLINT NOT NULL,
    "contenido" JSONB NOT NULL,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "paso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imagen" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clave_almacenamiento" VARCHAR(255) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "tipo_mime" VARCHAR(20) NOT NULL,
    "tamano_bytes" INTEGER NOT NULL,
    "texto_alternativo" VARCHAR(250) NOT NULL,
    "subida_por_id" UUID NOT NULL,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imagen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividad" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "guia_id" UUID NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "porcentaje_aprobacion" SMALLINT NOT NULL DEFAULT 70,
    "creada_por_id" UUID NOT NULL,
    "actualizada_por_id" UUID NOT NULL,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "actividad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pregunta" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actividad_id" UUID NOT NULL,
    "orden" SMALLINT NOT NULL,
    "enunciado" VARCHAR(500) NOT NULL,
    "explicacion" VARCHAR(500) NOT NULL,
    "imagen_id" UUID,

    CONSTRAINT "pregunta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opcion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pregunta_id" UUID NOT NULL,
    "orden" SMALLINT NOT NULL,
    "texto" VARCHAR(250) NOT NULL,
    "es_correcta" BOOLEAN NOT NULL,

    CONSTRAINT "opcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actividad_id" UUID NOT NULL,
    "usuario_id" VARCHAR(20),
    "total_preguntas" SMALLINT NOT NULL,
    "respuestas_correctas" SMALLINT NOT NULL DEFAULT 0,
    "porcentaje" SMALLINT,
    "aprobado" BOOLEAN,
    "iniciado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizado_en" TIMESTAMPTZ,

    CONSTRAINT "intento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "respuesta_intento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "intento_id" UUID NOT NULL,
    "pregunta_id" UUID NOT NULL,
    "opcion_id" UUID NOT NULL,
    "es_correcta" BOOLEAN NOT NULL,
    "respondida_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "respuesta_intento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progreso_guia" (
    "usuario_id" VARCHAR(20) NOT NULL,
    "guia_id" UUID NOT NULL,
    "ultimo_paso_id" UUID,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "completada_en" TIMESTAMPTZ,
    "actualizado_en" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "progreso_guia_pkey" PRIMARY KEY ("usuario_id","guia_id")
);

-- CreateTable
CREATE TABLE "paso_leido" (
    "usuario_id" VARCHAR(20) NOT NULL,
    "paso_id" UUID NOT NULL,
    "leido_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paso_leido_pkey" PRIMARY KEY ("usuario_id","paso_id")
);

-- CreateTable
CREATE TABLE "solicitud_ayuda" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "equipo" VARCHAR(100) NOT NULL,
    "tema" "tema_ayuda" NOT NULL,
    "estado" "estado_solicitud" NOT NULL DEFAULT 'PENDIENTE',
    "guia_id" UUID,
    "paso_id" UUID,
    "usuario_id" VARCHAR(20),
    "atendida_por_id" UUID,
    "comentario_resolucion" VARCHAR(500),
    "creada_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tomada_en" TIMESTAMPTZ,
    "resuelta_en" TIMESTAMPTZ,
    "cancelada_en" TIMESTAMPTZ,

    CONSTRAINT "solicitud_ayuda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pregunta_frecuente" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tema" VARCHAR(80) NOT NULL,
    "pregunta" VARCHAR(250) NOT NULL,
    "respuesta" TEXT NOT NULL,
    "orden" SMALLINT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "creada_por_id" UUID NOT NULL,
    "actualizada_por_id" UUID NOT NULL,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "pregunta_frecuente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "termino_glosario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "termino" VARCHAR(80) NOT NULL,
    "definicion" VARCHAR(500) NOT NULL,
    "imagen_id" UUID,
    "creado_por_id" UUID NOT NULL,
    "actualizado_por_id" UUID NOT NULL,
    "creado_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "termino_glosario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consulta_guia" (
    "id" BIGSERIAL NOT NULL,
    "guia_id" UUID NOT NULL,
    "usuario_id" VARCHAR(20),
    "consultada_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consulta_guia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calificacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "valor" "valor_calificacion" NOT NULL,
    "comentario" VARCHAR(300),
    "origen" "origen_calificacion" NOT NULL,
    "guia_id" UUID,
    "usuario_id" VARCHAR(20),
    "creada_en" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "metodo_inicio_tipo_valor_key" ON "metodo_inicio"("tipo", "valor");

-- CreateIndex
CREATE UNIQUE INDEX "metodo_inicio_usuario_id_tipo_key" ON "metodo_inicio"("usuario_id", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "aviso_privacidad_version_key" ON "aviso_privacidad"("version");

-- CreateIndex
CREATE UNIQUE INDEX "consentimiento_usuario_id_aviso_privacidad_id_key" ON "consentimiento"("usuario_id", "aviso_privacidad_id");

-- CreateIndex
CREATE UNIQUE INDEX "personal_correo_key" ON "personal"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_hash_key" ON "refresh_token"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_reemplazado_por_id_key" ON "refresh_token"("reemplazado_por_id");

-- CreateIndex
CREATE INDEX "refresh_token_usuario_publico_id_idx" ON "refresh_token"("usuario_publico_id");

-- CreateIndex
CREATE INDEX "refresh_token_personal_id_idx" ON "refresh_token"("personal_id");

-- CreateIndex
CREATE INDEX "codigo_verificacion_metodo_inicio_id_proposito_idx" ON "codigo_verificacion"("metodo_inicio_id", "proposito");

-- CreateIndex
CREATE INDEX "codigo_verificacion_personal_id_proposito_idx" ON "codigo_verificacion"("personal_id", "proposito");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_slug_key" ON "categoria"("slug");

-- CreateIndex
CREATE INDEX "guia_categoria_id_estado_nivel_idx" ON "guia"("categoria_id", "estado", "nivel");

-- CreateIndex
CREATE UNIQUE INDEX "paso_guia_id_orden_key" ON "paso"("guia_id", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "imagen_clave_almacenamiento_key" ON "imagen"("clave_almacenamiento");

-- CreateIndex
CREATE UNIQUE INDEX "actividad_guia_id_key" ON "actividad"("guia_id");

-- CreateIndex
CREATE UNIQUE INDEX "pregunta_actividad_id_orden_key" ON "pregunta"("actividad_id", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "opcion_pregunta_id_orden_key" ON "opcion"("pregunta_id", "orden");

-- CreateIndex
CREATE INDEX "intento_usuario_id_actividad_id_idx" ON "intento"("usuario_id", "actividad_id");

-- CreateIndex
CREATE INDEX "intento_actividad_id_finalizado_en_idx" ON "intento"("actividad_id", "finalizado_en");

-- CreateIndex
CREATE INDEX "respuesta_intento_pregunta_id_idx" ON "respuesta_intento"("pregunta_id");

-- CreateIndex
CREATE UNIQUE INDEX "respuesta_intento_intento_id_pregunta_id_key" ON "respuesta_intento"("intento_id", "pregunta_id");

-- CreateIndex
CREATE INDEX "solicitud_ayuda_estado_creada_en_idx" ON "solicitud_ayuda"("estado", "creada_en");

-- CreateIndex
CREATE INDEX "solicitud_ayuda_creada_en_tema_idx" ON "solicitud_ayuda"("creada_en", "tema");

-- CreateIndex
CREATE INDEX "solicitud_ayuda_usuario_id_idx" ON "solicitud_ayuda"("usuario_id");

-- CreateIndex
CREATE INDEX "pregunta_frecuente_visible_tema_orden_idx" ON "pregunta_frecuente"("visible", "tema", "orden");

-- CreateIndex
CREATE INDEX "consulta_guia_guia_id_consultada_en_idx" ON "consulta_guia"("guia_id", "consultada_en");

-- CreateIndex
CREATE INDEX "consulta_guia_usuario_id_idx" ON "consulta_guia"("usuario_id");

-- CreateIndex
CREATE INDEX "calificacion_usuario_id_idx" ON "calificacion"("usuario_id");

-- CreateIndex
CREATE INDEX "calificacion_creada_en_guia_id_idx" ON "calificacion"("creada_en", "guia_id");

-- AddForeignKey
ALTER TABLE "metodo_inicio" ADD CONSTRAINT "metodo_inicio_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario_publico"("numero_identificacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consentimiento" ADD CONSTRAINT "consentimiento_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario_publico"("numero_identificacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consentimiento" ADD CONSTRAINT "consentimiento_aviso_privacidad_id_fkey" FOREIGN KEY ("aviso_privacidad_id") REFERENCES "aviso_privacidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal" ADD CONSTRAINT "personal_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "personal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_usuario_publico_id_fkey" FOREIGN KEY ("usuario_publico_id") REFERENCES "usuario_publico"("numero_identificacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_personal_id_fkey" FOREIGN KEY ("personal_id") REFERENCES "personal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_reemplazado_por_id_fkey" FOREIGN KEY ("reemplazado_por_id") REFERENCES "refresh_token"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codigo_verificacion" ADD CONSTRAINT "codigo_verificacion_metodo_inicio_id_fkey" FOREIGN KEY ("metodo_inicio_id") REFERENCES "metodo_inicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codigo_verificacion" ADD CONSTRAINT "codigo_verificacion_personal_id_fkey" FOREIGN KEY ("personal_id") REFERENCES "personal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guia" ADD CONSTRAINT "guia_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guia" ADD CONSTRAINT "guia_creada_por_id_fkey" FOREIGN KEY ("creada_por_id") REFERENCES "personal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guia" ADD CONSTRAINT "guia_actualizada_por_id_fkey" FOREIGN KEY ("actualizada_por_id") REFERENCES "personal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paso" ADD CONSTRAINT "paso_guia_id_fkey" FOREIGN KEY ("guia_id") REFERENCES "guia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imagen" ADD CONSTRAINT "imagen_subida_por_id_fkey" FOREIGN KEY ("subida_por_id") REFERENCES "personal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividad" ADD CONSTRAINT "actividad_guia_id_fkey" FOREIGN KEY ("guia_id") REFERENCES "guia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividad" ADD CONSTRAINT "actividad_creada_por_id_fkey" FOREIGN KEY ("creada_por_id") REFERENCES "personal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividad" ADD CONSTRAINT "actividad_actualizada_por_id_fkey" FOREIGN KEY ("actualizada_por_id") REFERENCES "personal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pregunta" ADD CONSTRAINT "pregunta_actividad_id_fkey" FOREIGN KEY ("actividad_id") REFERENCES "actividad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pregunta" ADD CONSTRAINT "pregunta_imagen_id_fkey" FOREIGN KEY ("imagen_id") REFERENCES "imagen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opcion" ADD CONSTRAINT "opcion_pregunta_id_fkey" FOREIGN KEY ("pregunta_id") REFERENCES "pregunta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intento" ADD CONSTRAINT "intento_actividad_id_fkey" FOREIGN KEY ("actividad_id") REFERENCES "actividad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intento" ADD CONSTRAINT "intento_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario_publico"("numero_identificacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuesta_intento" ADD CONSTRAINT "respuesta_intento_intento_id_fkey" FOREIGN KEY ("intento_id") REFERENCES "intento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuesta_intento" ADD CONSTRAINT "respuesta_intento_pregunta_id_fkey" FOREIGN KEY ("pregunta_id") REFERENCES "pregunta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuesta_intento" ADD CONSTRAINT "respuesta_intento_opcion_id_fkey" FOREIGN KEY ("opcion_id") REFERENCES "opcion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progreso_guia" ADD CONSTRAINT "progreso_guia_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario_publico"("numero_identificacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progreso_guia" ADD CONSTRAINT "progreso_guia_guia_id_fkey" FOREIGN KEY ("guia_id") REFERENCES "guia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progreso_guia" ADD CONSTRAINT "progreso_guia_ultimo_paso_id_fkey" FOREIGN KEY ("ultimo_paso_id") REFERENCES "paso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paso_leido" ADD CONSTRAINT "paso_leido_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario_publico"("numero_identificacion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paso_leido" ADD CONSTRAINT "paso_leido_paso_id_fkey" FOREIGN KEY ("paso_id") REFERENCES "paso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_ayuda" ADD CONSTRAINT "solicitud_ayuda_guia_id_fkey" FOREIGN KEY ("guia_id") REFERENCES "guia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_ayuda" ADD CONSTRAINT "solicitud_ayuda_paso_id_fkey" FOREIGN KEY ("paso_id") REFERENCES "paso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_ayuda" ADD CONSTRAINT "solicitud_ayuda_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario_publico"("numero_identificacion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_ayuda" ADD CONSTRAINT "solicitud_ayuda_atendida_por_id_fkey" FOREIGN KEY ("atendida_por_id") REFERENCES "personal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pregunta_frecuente" ADD CONSTRAINT "pregunta_frecuente_creada_por_id_fkey" FOREIGN KEY ("creada_por_id") REFERENCES "personal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pregunta_frecuente" ADD CONSTRAINT "pregunta_frecuente_actualizada_por_id_fkey" FOREIGN KEY ("actualizada_por_id") REFERENCES "personal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "termino_glosario" ADD CONSTRAINT "termino_glosario_imagen_id_fkey" FOREIGN KEY ("imagen_id") REFERENCES "imagen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "termino_glosario" ADD CONSTRAINT "termino_glosario_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "personal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "termino_glosario" ADD CONSTRAINT "termino_glosario_actualizado_por_id_fkey" FOREIGN KEY ("actualizado_por_id") REFERENCES "personal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulta_guia" ADD CONSTRAINT "consulta_guia_guia_id_fkey" FOREIGN KEY ("guia_id") REFERENCES "guia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulta_guia" ADD CONSTRAINT "consulta_guia_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario_publico"("numero_identificacion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificacion" ADD CONSTRAINT "calificacion_guia_id_fkey" FOREIGN KEY ("guia_id") REFERENCES "guia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificacion" ADD CONSTRAINT "calificacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario_publico"("numero_identificacion") ON DELETE SET NULL ON UPDATE CASCADE;


-- ═══════════════════════════════════════════════════════════════════════════
-- SQL escrito a mano: restricciones e índices que Prisma no puede declarar.
-- Ver «Modelo de datos — Kamá», secciones 3 y 5.
-- ═══════════════════════════════════════════════════════════════════════════

-- Búsqueda sin tildes (HU-11, HU-34). unaccent() no es IMMUTABLE: se envuelve.
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE FUNCTION f_unaccent(text) RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE
  AS $$ SELECT public.unaccent('public.unaccent', $1) $$;
-- array_to_string() es STABLE; el índice GIN de guía necesita una versión IMMUTABLE.
CREATE FUNCTION f_array_to_text(text[]) RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE
  AS $$ SELECT array_to_string($1, ' ') $$;

-- Un solo dueño por token / código.
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_un_dueno_check"
  CHECK (num_nonnulls("usuario_publico_id", "personal_id") = 1);
ALTER TABLE "codigo_verificacion" ADD CONSTRAINT "codigo_verificacion_un_destino_check"
  CHECK (num_nonnulls("metodo_inicio_id", "personal_id") = 1);

-- Catálogo.
ALTER TABLE "guia" ADD CONSTRAINT "guia_duracion_estimada_min_check"
  CHECK ("duracion_estimada_min" > 0);
CREATE INDEX "guia_busqueda_idx" ON "guia" USING GIN (
  to_tsvector('spanish', f_unaccent("titulo" || ' ' || coalesce("descripcion", '') || ' '
    || f_array_to_text("palabras_clave")))
);
ALTER TABLE "paso" ADD CONSTRAINT "paso_contenido_bloques_check"
  CHECK (coalesce(jsonb_typeof("contenido" -> 'bloques') = 'array', false)); -- NULL no debe pasar
ALTER TABLE "imagen" ADD CONSTRAINT "imagen_tipo_mime_check"
  CHECK ("tipo_mime" IN ('image/png', 'image/jpeg', 'image/webp'));
ALTER TABLE "imagen" ADD CONSTRAINT "imagen_tamano_bytes_check"
  CHECK ("tamano_bytes" <= 5242880);

-- Reordenar pasos y preguntas en una sola transacción (HU-15): UNIQUE diferible.
-- Se conserva el nombre que Prisma espera para que no detecte drift.
DROP INDEX "paso_guia_id_orden_key";
ALTER TABLE "paso" ADD CONSTRAINT "paso_guia_id_orden_key"
  UNIQUE ("guia_id", "orden") DEFERRABLE INITIALLY DEFERRED;
DROP INDEX "pregunta_actividad_id_orden_key";
ALTER TABLE "pregunta" ADD CONSTRAINT "pregunta_actividad_id_orden_key"
  UNIQUE ("actividad_id", "orden") DEFERRABLE INITIALLY DEFERRED;

-- Práctica.
ALTER TABLE "actividad" ADD CONSTRAINT "actividad_porcentaje_aprobacion_check"
  CHECK ("porcentaje_aprobacion" BETWEEN 1 AND 100);
CREATE UNIQUE INDEX "opcion_una_correcta_idx" ON "opcion" ("pregunta_id") WHERE "es_correcta";

-- Ayuda: una solicitud activa por equipo (HU-29).
CREATE UNIQUE INDEX "solicitud_ayuda_equipo_activa_idx" ON "solicitud_ayuda" (lower(trim("equipo")))
  WHERE "estado" IN ('PENDIENTE', 'EN_ATENCION');

-- Glosario: término único sin tildes ni mayúsculas (HU-34).
CREATE UNIQUE INDEX "termino_glosario_termino_idx" ON "termino_glosario" (lower(f_unaccent("termino")));
