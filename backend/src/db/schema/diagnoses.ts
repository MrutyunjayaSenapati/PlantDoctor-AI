import { pgTable, uuid, text, numeric, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";

export const diagnoses = pgTable("diagnoses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  imageUrl: text("image_url"),
  plantName: text("plant_name"),
  diseaseName: text("disease_name"),
  confidence: numeric("confidence"),
  status: varchar("status", { length: 50 }),
  explanation: text("explanation"),
  treatment: jsonb("treatment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
