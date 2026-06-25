import { apiClient } from "../api/client";

export interface HistoryItem {
  id: string;
  userId: string;
  imageUrl: string | null;
  plantName: string | null;
  diseaseName: string | null;
  confidence: string | null;
  status: string | null;
  explanation: string | null;
  treatment: string[] | null;
  createdAt: string;
}

interface HistoryResponse {
  success: boolean;
  items: HistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getHistory(page = 1, limit = 10): Promise<HistoryResponse> {
  const res = await apiClient.get("/diagnosis/history", { params: { page, limit } });
  return res.data;
}

export async function getStats(): Promise<{ success: boolean; totalScans: number }> {
  const res = await apiClient.get("/diagnosis/stats");
  return res.data;
}
