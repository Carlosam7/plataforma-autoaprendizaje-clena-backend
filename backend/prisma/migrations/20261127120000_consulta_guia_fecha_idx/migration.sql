-- BE-04 (HU-31): las estadísticas cuentan las consultas de todas las guías en un rango de
-- fechas. El índice (guia_id, consultada_en) no sirve sin guía: este empieza por la fecha.
CREATE INDEX "consulta_guia_consultada_en_idx" ON "consulta_guia"("consultada_en");
