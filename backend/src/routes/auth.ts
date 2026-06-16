import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { users } from "../db/schema/users";
import { authenticate } from "../middleware/auth";
import type { AuthRequest } from "../types/auth";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({ success: false, message: "idToken is required" });
      return;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub) {
      res.status(400).json({ success: false, message: "Invalid token" });
      return;
    }

    const googleId = payload.sub;
    const email = payload.email ?? "";
    const name = payload.name ?? "";
    const avatarUrl = payload.picture ?? "";

    let user = await db
      .select()
      .from(users)
      .where(eq(users.googleId, googleId))
      .then((rows) => rows[0]);

    if (!user) {
      const created = await db
        .insert(users)
        .values({
          googleId,
          email,
          name,
          avatarUrl,
        })
        .returning();
      user = created[0];
    } else {
      const updated = await db
        .update(users)
        .set({ email, name, avatarUrl, updatedAt: new Date() })
        .where(eq(users.id, user.id))
        .returning();
      user = updated[0];
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ success: false, message: "Authentication failed" });
  }
});

router.get("/me", authenticate, async (req: AuthRequest, res) => {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, req.user!.id))
    .then((rows) => rows[0]);

  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
  });
});

export default router as import("express").Router;
