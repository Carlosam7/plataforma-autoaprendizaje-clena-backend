-- BE-02 (C-05): titularidad de la solicitud de ayuda. Quien la pide recibe una llave opaca
-- en una cookie httpOnly; aquí se guarda solo su huella SHA-256 (64 caracteres hex), como
-- refresh_token.token_hash. Solo el navegador con esa llave consulta o cancela la solicitud.
-- Las solicitudes que ya existían quedan sin titular (NULL): el personal las sigue viendo y
-- atendiendo, pero ningún visitante puede consultarlas ni cancelarlas.
ALTER TABLE "solicitud_ayuda" ADD COLUMN "titular_hash" VARCHAR(64);
