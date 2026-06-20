import { type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AuthRequest, AuthPayload } from "../types/auth";

const JWT_SECRET = process.env.JWT_SECRET!;

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    console.log(`[Auth] 401 ${req.path} — no Bearer header`);
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = payload;
    console.log(`[Auth] 200 ${req.path} — ${payload.email}`);
    next();
  } catch {
    console.log(`[Auth] 401 ${req.path} — invalid token`);
    res.status(401).json({ success: false, message: "Invalid token" });
  }
}
