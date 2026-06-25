import { db } from "../db";
import { diagnoses } from "../db/schema/diagnoses";
import { desc, eq, sql } from "drizzle-orm";
import { analyzeWithAi, type AiDiagnosisResult } from "./aiService";

export type DiagnosisResult = AiDiagnosisResult;

export async function diagnose(imageUrl: string): Promise<DiagnosisResult> {
  return analyzeWithAi(imageUrl);
}

export async function saveDiagnosis(userId: string, imageUrl: string, result: DiagnosisResult) {
  const [saved] = await db
    .insert(diagnoses)
    .values({
      userId,
      imageUrl,
      plantName: result.plant,
      diseaseName: result.disease,
      confidence: String(result.confidence),
      status: result.status,
      explanation: result.explanation,
      treatment: result.treatment,
    })
    .returning();

  return saved;
}

export async function getStats(userId: string) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(diagnoses)
    .where(eq(diagnoses.userId, userId));

  return { totalScans: Number(count) };
}

export async function getHistory(userId: string, page: number, limit: number) {
  const offset = (page - 1) * limit;

  const items = await db
    .select()
    .from(diagnoses)
    .where(eq(diagnoses.userId, userId))
    .orderBy(desc(diagnoses.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(diagnoses)
    .where(eq(diagnoses.userId, userId));

  return {
    items,
    total: Number(count),
    page,
    limit,
    totalPages: Math.ceil(Number(count) / limit),
  };
}
