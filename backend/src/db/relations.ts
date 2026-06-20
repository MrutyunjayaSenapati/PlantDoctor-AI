import { relations } from "drizzle-orm";
import { users } from "./schema/users";
import { plants } from "./schema/plants";
import { diseases } from "./schema/diseases";
import { plantDiseases } from "./schema/plant_diseases";
import { diagnoses } from "./schema/diagnoses";
import { feedback } from "./schema/feedback";

export const usersRelations = relations(users, ({ many }) => ({
  diagnoses: many(diagnoses),
  feedback: many(feedback),
}));

export const plantsRelations = relations(plants, ({ many }) => ({
  plantDiseases: many(plantDiseases),
}));

export const diseasesRelations = relations(diseases, ({ many }) => ({
  plantDiseases: many(plantDiseases),
}));

export const plantDiseasesRelations = relations(plantDiseases, ({ one }) => ({
  plant: one(plants, {
    fields: [plantDiseases.plantId],
    references: [plants.id],
  }),
  disease: one(diseases, {
    fields: [plantDiseases.diseaseId],
    references: [diseases.id],
  }),
}));

export const diagnosesRelations = relations(diagnoses, ({ one, many }) => ({
  user: one(users, {
    fields: [diagnoses.userId],
    references: [users.id],
  }),
  feedback: many(feedback),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  diagnosis: one(diagnoses, {
    fields: [feedback.diagnosisId],
    references: [diagnoses.id],
  }),
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
}));
