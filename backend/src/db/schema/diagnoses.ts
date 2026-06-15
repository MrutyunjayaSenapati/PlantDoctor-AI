import { pgTable, uuid, text, numeric, varchar, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { plants } from "./plants";
import { diseases } from "./diseases";

export const diagnoses = pgTable("diagnoses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  plantId: uuid("plant_id")
    .notNull()
    .references(() => plants.id),
  diseaseId: uuid("disease_id")
    .notNull()
    .references(() => diseases.id),
  imageUrl: text("image_url"),
  confidence: numeric("confidence"),
  explanation: text("explanation"),
  status: varchar("status", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
