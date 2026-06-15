import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { diagnoses } from "./diagnoses";
import { users } from "./users";

export const feedback = pgTable("feedback", {
  id: uuid("id").defaultRandom().primaryKey(),
  diagnosisId: uuid("diagnosis_id")
    .notNull()
    .references(() => diagnoses.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
