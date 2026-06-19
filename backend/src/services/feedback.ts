import { db } from "../db";
import { feedback } from "../db/schema/feedback";

export async function saveFeedback(data: {
  diagnosisId: string;
  userId: string;
  isCorrect: boolean;
  comment?: string;
}) {
  const [saved] = await db
    .insert(feedback)
    .values({
      diagnosisId: data.diagnosisId,
      userId: data.userId,
      isCorrect: data.isCorrect,
      comment: data.comment ?? null,
    })
    .returning();

  return saved;
}
