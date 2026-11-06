-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('USUARIO_PUBLICO', 'PERSONAL', 'ADMINISTRADOR');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "CanalVerificacion" AS ENUM ('CORREO', 'TELEFONO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "numero_identificacion" VARCHAR(15),
    "fecha_nacimiento" DATE,
    "telefono" VARCHAR(16),
    "correo" VARCHAR(254),
    "rol" "Rol" NOT NULL DEFAULT 'USUARIO_PUBLICO',
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'ACTIVO',
    "consentimiento_version" VARCHAR(40),
    "consentimiento_aceptado_en" TIMESTAMPTZ(3),
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_pendientes" (
    "id" UUID NOT NULL,
    "numero_identificacion" VARCHAR(15) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "fecha_nacimiento" DATE NOT NULL,
    "telefono" VARCHAR(16),
    "correo" VARCHAR(254),
    "consentimiento_version" VARCHAR(40) NOT NULL,
    "consentimiento_aceptado_en" TIMESTAMPTZ(3) NOT NULL,
    "canal" "CanalVerificacion" NOT NULL,
    "codigo_hash" VARCHAR(100) NOT NULL,
    "codigo_enviado_en" TIMESTAMPTZ(3) NOT NULL,
    "codigo_expira_en" TIMESTAMPTZ(3) NOT NULL,
    "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_pendientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "refresh_token_hash" VARCHAR(64) NOT NULL,
    "expira_en" TIMESTAMPTZ(3) NOT NULL,
    "revocada_en" TIMESTAMPTZ(3),
    "creada_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sesiones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_numero_identificacion_key" ON "usuarios"("numero_identificacion");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_telefono_key" ON "usuarios"("telefono");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "registros_pendientes_numero_identificacion_key" ON "registros_pendientes"("numero_identificacion");

-- CreateIndex
CREATE INDEX "registros_pendientes_codigo_expira_en_idx" ON "registros_pendientes"("codigo_expira_en");

-- CreateIndex
CREATE INDEX "sesiones_usuario_id_idx" ON "sesiones"("usuario_id");

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
