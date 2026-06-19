import { db } from "../db";
import { diagnoses } from "../db/schema/diagnoses";
import { desc, eq, sql } from "drizzle-orm";

export interface DiagnosisResult {
  plant: string;
  disease: string;
  confidence: number;
  status: string;
  explanation: string;
  treatment: string[];
}

export async function diagnose(imageUrl: string): Promise<DiagnosisResult> {
  console.log(`Diagnosis requested for: ${imageUrl}`);

  return {
    plant: "Tomato",
    disease: "Early Blight",
    confidence: 0.94,
    status: "HIGH_CONFIDENCE",
    explanation: "Brown lesions detected on leaf surface. The pattern suggests a fungal infection consistent with Early Blight (Alternaria solani).",
    treatment: [
      "Remove infected leaves immediately to prevent spread",
      "Apply fungicide containing chlorothalonil or copper",
      "Improve air circulation around plants",
      "Avoid overhead watering",
      "Rotate crops next season",
    ],
  };
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
