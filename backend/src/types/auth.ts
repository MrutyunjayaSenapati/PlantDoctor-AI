import { type Request } from "express";

export interface AuthPayload {
  id: string;
  email: string;
  name: string;
}

export type AuthRequest = Request & { user?: AuthPayload };
