import { pgTable, uuid } from "drizzle-orm/pg-core";
import { plants } from "./plants";
import { diseases } from "./diseases";

export const plantDiseases = pgTable("plant_diseases", {
  id: uuid("id").defaultRandom().primaryKey(),
  plantId: uuid("plant_id")
    .notNull()
    .references(() => plants.id),
  diseaseId: uuid("disease_id")
    .notNull()
    .references(() => diseases.id),
});
