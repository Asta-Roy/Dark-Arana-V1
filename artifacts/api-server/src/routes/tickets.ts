import { Router } from "express";
import { z } from "zod/v4";
import { db, tickets, users } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../lib/auth.js";
import { sendTicketNotification, sendTicketReply } from "../lib/email.js";

const router = Router();

const CreateTicketBody = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  imageUrl: z.string().url().optional(),
});

const AdminReplyBody = z.object({
  adminReply: z.string().min(1),
});

// POST /api/tickets — Pro plan only
router.post("/tickets", authMiddleware, async (req, res) => {
  const user = (req as any).user as { id: number; username: string; plan: string };

  // Only Pro users can create tickets
  if (user.plan !== "pro" && user.plan !== "premium") {
    return res.status(403).json({ error: "تذاكر الدعم متاحة لباقة برو فقط" });
  }
  // Premium users use WhatsApp, not tickets — but allow anyway as fallback
  const body = CreateTicketBody.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ error: "بيانات غير صحيحة", details: body.error.issues });
  }

  const [ticket] = await db
    .insert(tickets)
    .values({
      userId: user.id,
      username: user.username,
      title: body.data.title,
      description: body.data.description,
      imageUrl: body.data.imageUrl,
    })
    .returning();

  // Send email notification to admin (non-blocking)
  sendTicketNotification({ username: user.username, title: ticket.title, description: ticket.description }).catch(
    () => {}
  );

  return res.status(201).json(ticket);
});

// GET /api/tickets — user's own tickets
router.get("/tickets", authMiddleware, async (req, res) => {
  const user = (req as any).user as { id: number };
  const userTickets = await db
    .select()
    .from(tickets)
    .where(eq(tickets.userId, user.id))
    .orderBy(desc(tickets.createdAt));
  return res.json(userTickets);
});

// ─── ADMIN ROUTES (ROY only) ─────────────────────────────────────────────────

// GET /api/admin/tickets — all open tickets
router.get("/admin/tickets", authMiddleware, adminMiddleware, async (req, res) => {
  const openTickets = await db
    .select()
    .from(tickets)
    .where(eq(tickets.status, "open"))
    .orderBy(desc(tickets.createdAt));
  return res.json(openTickets);
});

// GET /api/admin/tickets/:id — single ticket
router.get("/admin/tickets/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
  if (!ticket) return res.status(404).json({ error: "التذكرة غير موجودة" });
  return res.json(ticket);
});

// PATCH /api/admin/tickets/:id/reply — reply to ticket
router.patch("/admin/tickets/:id/reply", authMiddleware, adminMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const body = AdminReplyBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "الرد مطلوب" });

  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
  if (!ticket) return res.status(404).json({ error: "التذكرة غير موجودة" });

  const [updated] = await db
    .update(tickets)
    .set({ adminReply: body.data.adminReply, status: "replied", adminReplyAt: new Date() })
    .where(eq(tickets.id, id))
    .returning();

  // Send reply email to user (non-blocking)
  const [user] = await db.select().from(users).where(eq(users.id, ticket.userId));
  if (user) {
    sendTicketReply({
      toEmail: user.email,
      username: user.username,
      ticketTitle: ticket.title,
      adminReply: body.data.adminReply,
    }).catch(() => {});
  }

  return res.json(updated);
});

export default router;
