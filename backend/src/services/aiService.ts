import axios, { AxiosError } from "axios";
import FormData from "form-data";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

export interface AiDiagnosisResult {
  plant: string;
  disease: string;
  confidence: number;
  status: string;
  explanation: string;
  treatment: string[];
}

export async function analyzeWithAi(imageUrl: string): Promise<AiDiagnosisResult> {
  const maxRetries = 1;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[AiService] Downloading image: ${imageUrl}`);
      const imageRes = await axios.get(imageUrl, { responseType: "arraybuffer" });
      const imageBuffer = Buffer.from(imageRes.data);

      console.log(`[AiService] Image downloaded (${imageBuffer.length} bytes). Sending to AI service...`);

      const form = new FormData();
      form.append("image", imageBuffer, {
        filename: "plant.jpg",
        contentType: String(imageRes.headers["content-type"] ?? "image/jpeg"),
      });

      const aiRes = await axios.post(`${AI_SERVICE_URL}/predict`, form, {
        headers: form.getHeaders(),
        timeout: 30000,
      });

      console.log(`[AiService] Response received — plant: ${aiRes.data.plant}, disease: ${aiRes.data.disease}`);
      return aiRes.data as AiDiagnosisResult;
    } catch (error) {
      if (attempt < maxRetries && isRetryable(error)) {
        console.warn(`[AiService] Attempt ${attempt + 1} failed, retrying...`);
        continue;
      }
      throw translateError(error);
    }
  }

  throw new Error("AI service failed after retries");
}

function isRetryable(error: unknown): boolean {
  if (error instanceof AxiosError) {
    if (!error.response) return true;
    return error.response.status >= 500;
  }
  return false;
}

function translateError(error: unknown): Error {
  if (error instanceof AxiosError) {
    if (error.response) {
      const detail = error.response.data?.detail ?? error.response.statusText;
      return new Error(`AI service error (${error.response.status}): ${detail}`);
    }
    if (error.code === "ECONNREFUSED") {
      return new Error(`AI service unreachable at ${AI_SERVICE_URL}. Is it running?`);
    }
    return new Error(`AI service request failed: ${error.message}`);
  }
  return error instanceof Error ? error : new Error("Unknown AI service error");
}
