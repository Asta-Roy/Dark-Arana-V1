import { Router } from "express";
import { z } from "zod/v4";
import { db, users } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword, signToken, authMiddleware } from "../lib/auth.js";

const router = Router();

const RegisterBody = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_\u0600-\u06FF]+$/, "اسم المستخدم يحتوي على حروف غير صالحة"),
  email: z.email(),
  password: z.string().min(6),
});

const LoginBody = z.object({
  email: z.email(),
  password: z.string().min(1),
});

// POST /api/auth/register
router.post("/auth/register", async (req, res) => {
  const body = RegisterBody.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ error: "بيانات غير صحيحة", details: body.error.issues });
  }

  const { username, email, password } = body.data;

  // Check unique username
  const [existingByUsername] = await db.select().from(users).where(eq(users.username, username));
  if (existingByUsername) {
    return res.status(409).json({ error: "الاسم مستخدم" });
  }

  // Check unique email
  const [existingByEmail] = await db.select().from(users).where(eq(users.email, email));
  if (existingByEmail) {
    return res.status(409).json({ error: "البريد الإلكتروني مستخدم بالفعل" });
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({ username, email, passwordHash, plan: "free" })
    .returning();

  const token = signToken({ id: user.id, username: user.username, plan: user.plan });

  return res.status(201).json({
    token,
    user: { id: user.id, username: user.username, email: user.email, plan: user.plan, expiryDate: user.expiryDate },
  });
});

// POST /api/auth/login
router.post("/auth/login", async (req, res) => {
  const body = LoginBody.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ error: "بيانات غير صحيحة" });
  }

  const { email, password } = body.data;

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) {
    return res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
  }

  const token = signToken({ id: user.id, username: user.username, plan: user.plan });

  return res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, plan: user.plan, expiryDate: user.expiryDate },
  });
});

// GET /api/auth/me — returns current user from token
router.get("/auth/me", authMiddleware, async (req, res) => {
  const payload = (req as any).user as { id: number; username: string; plan: string };
  const [user] = await db.select().from(users).where(eq(users.id, payload.id));
  if (!user) return res.status(404).json({ error: "المستخدم غير موجود" });
  return res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    plan: user.plan,
    expiryDate: user.expiryDate,
  });
});

export default router;
