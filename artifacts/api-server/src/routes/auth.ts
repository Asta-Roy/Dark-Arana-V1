import { Router } from "express";
import { z } from "zod/v4";
import { db, users } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword, signToken, authMiddleware } from "../lib/auth.js";
import { generateOTP, storeOTP, verifyOTP, sendOTPEmail } from "../lib/email.js";

const router = Router();

// قاعدة اسم المستخدم: حروف إنجليزية وأرقام فقط بدون مسافات أو رموز
const USERNAME_REGEX = /^[a-zA-Z0-9]+$/;

const RegisterBody = z.object({
  username: z
    .string()
    .min(3, "اسم المستخدم لازم يكون 3 حروف على الأقل")
    .max(30, "اسم المستخدم طويل جداً")
    .regex(USERNAME_REGEX, "مسموح حروف وأرقام فقط بدون مسافات"),
  email: z.email("بريد إلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور لازم تكون 6 أحرف على الأقل"),
});

const LoginBody = z.object({
  email: z.email(),
  password: z.string().min(1),
});

// POST /api/auth/send-otp — إرسال كود تحقق للإيميل قبل التسجيل
router.post("/auth/send-otp", async (req, res) => {
  const body = z.object({ email: z.email("بريد إلكتروني غير صحيح") }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "بريد إلكتروني غير صحيح" });

  const { email } = body.data;
  const code = generateOTP();
  storeOTP(email, code);

  try {
    await sendOTPEmail(email, code);
    return res.json({ ok: true, message: "تم إرسال الكود على بريدك الإلكتروني" });
  } catch (err) {
    req.log?.error?.({ err }, "Failed to send OTP email");
    return res.status(500).json({ error: "فشل إرسال الكود. حاول مرة أخرى." });
  }
});

// POST /api/auth/verify-otp — التحقق من الكود (بدون إنشاء حساب — مجرد تأكيد)
router.post("/auth/verify-otp", async (req, res) => {
  const body = z.object({
    email: z.email(),
    code: z.string().length(6, "الكود لازم يكون 6 أرقام"),
  }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "بيانات غير صحيحة" });

  const { email, code } = body.data;
  const valid = verifyOTP(email, code);
  if (!valid) return res.status(400).json({ error: "الكود غلط أو انتهت صلاحيته. اطلب كوداً جديداً." });

  return res.json({ ok: true, message: "الكود صحيح" });
});

// POST /api/auth/register — تسجيل حساب جديد
router.post("/auth/register", async (req, res) => {
  const body = RegisterBody.safeParse(req.body);
  if (!body.success) {
    // إرجاع أول رسالة خطأ واضحة للمستخدم
    const firstError = body.error.issues[0]?.message || "بيانات غير صحيحة";
    return res.status(400).json({ error: firstError });
  }

  const { username, email, password } = body.data;

  // التحقق إن الاسم مش موجود من قبل
  const [existingByUsername] = await db.select().from(users).where(eq(users.username, username));
  if (existingByUsername) {
    return res.status(409).json({ error: "اسم المستخدم ده مستخدم، جرب اسم تاني" });
  }

  // التحقق إن الإيميل مش موجود من قبل
  const [existingByEmail] = await db.select().from(users).where(eq(users.email, email));
  if (existingByEmail) {
    return res.status(409).json({ error: "البريد الإلكتروني مستخدم بالفعل" });
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({ username, email, passwordHash, plan: "free", isBanned: false })
    .returning();

  const token = signToken({ id: user.id, username: user.username, plan: user.plan });

  return res.status(201).json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      plan: user.plan,
      expiryDate: user.expiryDate,
      isBanned: user.isBanned,
    },
  });
});

// POST /api/auth/login — تسجيل الدخول مع فحص الحظر
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

  // فحص الحظر — المحظور ميعرفش يدخل
  if (user.isBanned) {
    return res.status(403).json({ error: "تم حظر حسابك. للاستفسار تواصل مع الدعم." });
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
  }

  const token = signToken({ id: user.id, username: user.username, plan: user.plan });

  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      plan: user.plan,
      expiryDate: user.expiryDate,
      isBanned: user.isBanned,
    },
  });
});

// GET /api/auth/me — جلب بيانات المستخدم الحالي من التوكن
router.get("/auth/me", authMiddleware, async (req, res) => {
  const payload = (req as any).user as { id: number; username: string; plan: string };
  const [user] = await db.select().from(users).where(eq(users.id, payload.id));
  if (!user) return res.status(404).json({ error: "المستخدم غير موجود" });

  // فحص الحظر حتى لو كان عنده توكن صالح
  if (user.isBanned) {
    return res.status(403).json({ error: "تم حظر حسابك." });
  }

  return res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    plan: user.plan,
    expiryDate: user.expiryDate,
    isBanned: user.isBanned,
  });
});

export default router;
