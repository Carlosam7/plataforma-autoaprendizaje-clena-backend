-- HU-10: título opcional de cada paso; sin él, el paso se muestra solo como «Paso 2 de 6».
ALTER TABLE "paso" ADD COLUMN "titulo" VARCHAR(120);
