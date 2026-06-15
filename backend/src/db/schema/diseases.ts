import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const diseases = pgTable("diseases", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).unique(),
  description: text("description"),
  symptoms: text("symptoms"),
  treatment: text("treatment"),
  prevention: text("prevention"),
  severity: varchar("severity", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
