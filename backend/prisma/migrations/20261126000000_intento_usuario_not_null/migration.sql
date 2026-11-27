-- BE-01: los visitantes sin cuenta no persisten intentos ni respuestas educativas.
DELETE FROM "intento" WHERE "usuario_id" IS NULL;

ALTER TABLE "intento" ALTER COLUMN "usuario_id" SET NOT NULL;

