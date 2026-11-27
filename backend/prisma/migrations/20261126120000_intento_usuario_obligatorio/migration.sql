-- BE-01 (Regla D, C-04): solo el usuario público guarda intentos. Quien practica sin cuenta
-- usa POST /guias/:slug/actividad/evaluar-respuesta, que no guarda nada.
-- Los intentos sin usuario que ya existan eran prácticas de invitados que no debían
-- guardarse: se borran (sus filas de respuesta_intento se van por ON DELETE CASCADE).
DELETE FROM "intento" WHERE "usuario_id" IS NULL;

ALTER TABLE "intento" ALTER COLUMN "usuario_id" SET NOT NULL;
