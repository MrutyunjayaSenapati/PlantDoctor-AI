import { apiClient } from "../api/client";

export interface DiagnosisResult {
  diagnosisId: string;
  plant: string;
  disease: string;
  confidence: number;
  status: string;
  explanation: string;
  treatment: string[];
  createdAt: string;
}

export async function getDiagnosis(imageUrl: string): Promise<DiagnosisResult> {
  console.log(`[Diagnosis] Requesting diagnosis for: ${imageUrl}`);
  const res = await apiClient.post("/diagnosis", { imageUrl });
  console.log(`[Diagnosis] Received — plant: ${res.data.plant}, disease: ${res.data.disease}, id: ${res.data.diagnosisId}`);
  return res.data;
}
