import { Router } from "express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { count, eq, inArray } from "drizzle-orm";

const router = Router();

function getSessionId(req: import("express").Request): string {
  return (req.headers["x-session-id"] as string) || "default";
}

router.get("/stats", async (req, res) => {
  const sessionId = getSessionId(req);
  try {
    const sessionConvs = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.sessionId, sessionId));

    const convIds = sessionConvs.map((c) => c.id);

    const [convCount] = await db
      .select({ count: count() })
      .from(conversations)
      .where(eq(conversations.sessionId, sessionId));

    const msgCount =
      convIds.length > 0
        ? await db
            .select({ count: count() })
            .from(messages)
            .where(inArray(messages.conversationId, convIds))
            .then((r) => r[0])
        : { count: 0 };

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
