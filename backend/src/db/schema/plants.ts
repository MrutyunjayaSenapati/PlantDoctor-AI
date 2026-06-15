import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const plants = pgTable("plants", {
  id: uuid("id").defaultRandom().primaryKey(),
  commonName: varchar("common_name", { length: 255 }),
  scientificName: varchar("scientific_name", { length: 255 }),
  description: text("description"),
  waterRequirement: varchar("water_requirement", { length: 255 }),
  sunlightRequirement: varchar("sunlight_requirement", { length: 255 }),
  temperatureRange: varchar("temperature_range", { length: 255 }),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
