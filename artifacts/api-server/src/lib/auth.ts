import crypto from "crypto";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import type { User } from "@workspace/db";

const JWT_SECRET = process.env.SESSION_SECRET || "darck-arana-secret-2025";
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

export function signToken(payload: { id: number; username: string; plan: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): { id: number; username: string; plan: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; username: string; plan: string };
  } catch {
    return null;
  }
}

// Express middleware: extracts user from Authorization header
export function authMiddleware(
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid token" });
  }
  (req as any).user = payload;
  next();
}

// Admin-only middleware: only "ROY" username can access
export function adminMiddleware(
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) {
  const user = (req as any).user;
  if (!user || user.username !== "ROY") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
