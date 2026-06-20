import { apiClient } from "../api/client";

export interface FeedbackPayload {
  diagnosisId: string;
  isCorrect: boolean;
  comment?: string;
}

export async function submitFeedback(data: FeedbackPayload): Promise<void> {
  await apiClient.post("/feedback", data);
}
