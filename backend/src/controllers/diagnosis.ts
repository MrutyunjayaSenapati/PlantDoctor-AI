import { type Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../types/auth";
import { diagnose, saveDiagnosis, getHistory, getStats } from "../services/diagnosis";

const diagnoseSchema = z.object({
  imageUrl: z.string().url("Invalid image URL"),
});

const historySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export async function handleDiagnose(req: AuthRequest, res: Response) {
  const user = req.user!.email;

  try {
    console.log(`[Diagnosis] Request ${user}`);

    const parsed = diagnoseSchema.safeParse(req.body);

    if (!parsed.success) {
      console.log(`[Diagnosis] 400 ${user} — validation failed`);
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
      return;
    }

    console.log(`[Diagnosis] Calling AI service...`);
    const result = await diagnose(parsed.data.imageUrl);

    console.log(`[Diagnosis] Saving to DB...`);
    const saved = await saveDiagnosis(req.user!.id, parsed.data.imageUrl, result);

    console.log(`[Diagnosis] 200 ${user} — saved id: ${saved.id}`);
    res.json({ ...result, diagnosisId: saved.id, createdAt: saved.createdAt });
  } catch (error) {
    console.error(`[Diagnosis] Error ${user}:`, error);
    res.status(500).json({ success: false, message: "Diagnosis failed" });
  }
}

export async function handleStats(req: AuthRequest, res: Response) {
  try {
    const { totalScans } = await getStats(req.user!.id);
    res.json({ success: true, totalScans });
  } catch (error) {
    console.error(`[Stats] Error:`, error);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
}

export async function handleHistory(req: AuthRequest, res: Response) {
  const user = req.user!.email;

  try {
    console.log(`[History] Request ${user}`);

    const parsed = historySchema.safeParse(req.query);

    if (!parsed.success) {
      console.log(`[History] 400 ${user} — validation failed`);
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
      return;
    }

    const { page, limit } = parsed.data;
    console.log(`[History] Fetching page ${page}, limit ${limit}...`);

    const result = await getHistory(req.user!.id, page, limit);

    console.log(`[History] 200 ${user} — ${result.total} total, page ${page}/${result.totalPages}`);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error(`[History] Error ${user}:`, error);
    res.status(500).json({ success: false, message: "Failed to fetch history" });
  }
}
