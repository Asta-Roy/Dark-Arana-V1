import { Router } from "express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { count } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  try {
    const [convCount] = await db.select({ count: count() }).from(conversations);
    const [msgCount] = await db.select({ count: count() }).from(messages);

    res.json({
      totalConversations: convCount?.count ?? 0,
      totalMessages: msgCount?.count ?? 0,
      totalImagesGenerated: 0,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
