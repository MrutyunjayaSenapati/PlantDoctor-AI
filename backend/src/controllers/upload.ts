import { type Response } from "express";
import type { AuthRequest } from "../types/auth";
import { uploadImage } from "../services/upload";

export async function handleUpload(req: AuthRequest, res: Response) {
  const user = req.user!.email;

  try {
    const file = req.file;
    if (!file) {
      console.log(`[Upload] 400 ${user} — no file provided`);
      res.status(400).json({ success: false, message: "No image file provided" });
      return;
    }

    console.log(`[Upload] Request ${user} — ${file.originalname} (${(file.size / 1024).toFixed(1)}KB)`);
    console.log(`[Upload] Uploading to Cloudinary...`);

    const imageUrl = await uploadImage(file.buffer, file.mimetype);

    console.log(`[Upload] Success ${user} → ${imageUrl}`);
    res.json({ imageUrl });
  } catch (error) {
    console.error(`[Upload] Error ${user}:`, error);
    res.status(500).json({ success: false, message: "Image upload failed" });
  }
}
