import { type Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../types/auth";
import { saveFeedback } from "../services/feedback";

const feedbackSchema = z.object({
  diagnosisId: z.string().uuid("Invalid diagnosis ID"),
  isCorrect: z.boolean(),
  comment: z.string().max(1000).optional(),
});

export async function handleSaveFeedback(req: AuthRequest, res: Response) {
  const user = req.user!.email;

  try {
    console.log(`[Feedback] Request ${user}`);

    const parsed = feedbackSchema.safeParse(req.body);

    if (!parsed.success) {
      console.log(`[Feedback] 400 ${user} — validation failed`);
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
      return;
    }

    console.log(`[Feedback] Saving — diagnosisId: ${parsed.data.diagnosisId}, isCorrect: ${parsed.data.isCorrect}`);
    const result = await saveFeedback({ ...parsed.data, userId: req.user!.id });

    console.log(`[Feedback] 201 ${user} — saved id: ${result.id}`);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error(`[Feedback] Error ${user}:`, error);
    res.status(500).json({ success: false, message: "Failed to save feedback" });
  }
}
