import { Router } from "express";
import { z } from "zod/v4";
import { db, users } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../lib/auth.js";

const router = Router();

// ─── كل الـ routes دي تشتغل بس مع ROY ─────────────────────────────────────

// GET /api/admin/users — جلب كل اليوزرز (مع فلتر بحث اختياري)
router.get("/admin/users", authMiddleware, adminMiddleware, async (req, res) => {
  const search = req.query.search as string | undefined;

  let allUsers;

  if (search && search.trim()) {
    // بحث في اسم المستخدم أو الإيميل (case insensitive)
    allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        plan: users.plan,
        isBanned: users.isBanned,
        createdAt: users.createdAt,
        expiryDate: users.expiryDate,
      })
      .from(users)
      .where(
        or(
          ilike(users.username, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      )
      .orderBy(users.createdAt);
  } else {
    allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        plan: users.plan,
        isBanned: users.isBanned,
        createdAt: users.createdAt,
        expiryDate: users.expiryDate,
      })
      .from(users)
      .orderBy(users.createdAt);
  }

  return res.json(allUsers);
});

// PATCH /api/admin/users/:id/plan — تغيير الاشتراك
router.patch(
  "/admin/users/:id/plan",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const id = parseInt(req.params.id);
    const body = z.object({ plan: z.enum(["free", "pro", "premium"]) }).safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: "باقة غير صالحة" });

    // لو بريميوم أو برو نحسب تاريخ الانتهاء (30 يوم)
    let expiryDate: Date | null = null;
    if (body.data.plan !== "free") {
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
    }

    const [updated] = await db
      .update(users)
      .set({ plan: body.data.plan, expiryDate })
      .where(eq(users.id, id))
      .returning({ id: users.id, username: users.username, plan: users.plan, expiryDate: users.expiryDate });

    if (!updated) return res.status(404).json({ error: "المستخدم غير موجود" });
    return res.json(updated);
  }
);

// PATCH /api/admin/users/:id/ban — حظر أو رفع حظر يوزر
router.patch(
  "/admin/users/:id/ban",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const id = parseInt(req.params.id);
    const body = z.object({ isBanned: z.boolean() }).safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: "بيانات غير صحيحة" });

    const [updated] = await db
      .update(users)
      .set({ isBanned: body.data.isBanned })
      .where(eq(users.id, id))
      .returning({ id: users.id, username: users.username, isBanned: users.isBanned });

    if (!updated) return res.status(404).json({ error: "المستخدم غير موجود" });
    return res.json(updated);
  }
);

// DELETE /api/admin/users/:id — حذف يوزر نهائياً
router.delete(
  "/admin/users/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const id = parseInt(req.params.id);

    // امنع حذف حساب الادمن نفسه
    const adminUser = (req as any).user as { id: number; username: string };
    if (adminUser.id === id) {
      return res.status(400).json({ error: "مينفعش تحذف حسابك الخاص" });
    }

    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id, username: users.username });

    if (!deleted) return res.status(404).json({ error: "المستخدم غير موجود" });
    return res.json({ ok: true, deleted });
  }
);

export default router;
