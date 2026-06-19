ALTER TABLE "diagnoses" DROP CONSTRAINT "diagnoses_plant_id_plants_id_fk";
ALTER TABLE "diagnoses" DROP CONSTRAINT "diagnoses_disease_id_diseases_id_fk";
ALTER TABLE "diagnoses" DROP COLUMN "plant_id";
ALTER TABLE "diagnoses" DROP COLUMN "disease_id";
ALTER TABLE "diagnoses" ADD COLUMN "plant_name" text;
ALTER TABLE "diagnoses" ADD COLUMN "disease_name" text;
ALTER TABLE "diagnoses" ADD COLUMN "treatment" jsonb;
ALTER TABLE "feedback" ADD COLUMN "is_correct" boolean NOT NULL;
