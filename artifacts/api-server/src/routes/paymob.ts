import { Router } from "express";
import { db, users } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// أسعار الباقات بالقروش المصرية (1 جنيه = 100 قرش)
const PLAN_AMOUNTS: Record<number, "pro" | "premium"> = {
  9900:  "pro",      // 99 جنيه = 9900 قرش
  19900: "premium",  // 199 جنيه = 19900 قرش
};

// مدة الاشتراك 30 يوم
function getExpiryDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d;
}

// POST /api/webhooks/paymob
// يستقبل إشعار Paymob بعد إتمام الدفع ويحدّث باقة المستخدم
router.post("/webhooks/paymob", async (req, res) => {
  try {
    const body = req.body;

    // Paymob يرسل الـ obj في body أو مباشرة
    const obj = body.obj ?? body;

    // نتأكد إن الدفع ناجح
    if (!obj || obj.success !== true) {
      return res.status(200).json({ ok: false, reason: "payment not successful" });
    }

    // نجيب بيانات الفاتورة
    const billing = obj.payment_key_claims?.billing_data ?? obj.order?.shipping_data;
    const email: string | undefined = billing?.email;
    const amountCents: number = obj.amount_cents ?? 0;

    if (!email) {
      return res.status(200).json({ ok: false, reason: "no email in payload" });
    }

    // نحدد الباقة من المبلغ
    const plan = PLAN_AMOUNTS[amountCents];
    if (!plan) {
      return res.status(200).json({ ok: false, reason: `unknown amount: ${amountCents}` });
    }

    // نبحث عن المستخدم بالإيميل
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      return res.status(200).json({ ok: false, reason: "user not found" });
    }

    // نحدّث الباقة وتاريخ الانتهاء
    await db
      .update(users)
      .set({ plan, expiryDate: getExpiryDate() })
      .where(eq(users.id, user.id));

    return res.status(200).json({ ok: true, plan, userId: user.id });
  } catch (err) {
    console.error("Paymob webhook error:", err);
    return res.status(200).json({ ok: false, reason: "server error" });
  }
});

// POST /api/webhooks/paymob/manual — أداة للأدمن ROY لترقية يدوية
router.post("/webhooks/paymob/manual", async (req, res) => {
  const { email, plan, adminKey } = req.body;

  // مفتاح سري للأدمن
  if (adminKey !== process.env.SESSION_SECRET) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  if (!email || !["pro", "premium"].includes(plan)) {
    return res.status(400).json({ error: "email and plan required" });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) return res.status(404).json({ error: "User not found" });

  await db
    .update(users)
    .set({ plan, expiryDate: getExpiryDate() })
    .where(eq(users.id, user.id));

  return res.json({ ok: true, plan, userId: user.id });
});

export default router;
