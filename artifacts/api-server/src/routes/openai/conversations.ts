import { Router } from "express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import {
  CreateOpenaiConversationBody,
  SendOpenaiMessageBody,
  GetOpenaiConversationParams,
  DeleteOpenaiConversationParams,
  ListOpenaiMessagesParams,
  SendOpenaiMessageParams,
} from "@workspace/api-zod";
import { getGeminiClient, isAIConfigured } from "../../lib/gemini-client.js";
import { verifyToken } from "../../lib/auth.js";

const router = Router();

function getSessionId(req: import("express").Request): string {
  return (req.headers["x-session-id"] as string) || "default";
}

// استخراج بيانات المستخدم من الـ token اختياري
function getUserFromRequest(req: import("express").Request): { id: number; plan: "free" | "pro" | "premium" } | null {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) return null;
  const payload = verifyToken(authHeader.slice(7));
  if (!payload) return null;
  const plan = (["free", "pro", "premium"].includes(payload.plan) ? payload.plan : "free") as "free" | "pro" | "premium";
  return { id: payload.id, plan };
}

// قوة AI وحد الـ tokens حسب الباقة
function getAIPower(plan: "free" | "pro" | "premium"): { maxOutputTokens: number; label: string } {
  switch (plan) {
    case "premium": return { maxOutputTokens: 8192, label: "100%" };
    case "pro":     return { maxOutputTokens: 6144, label: "80%" };
    default:        return { maxOutputTokens: 2048, label: "40%" }; // free
  }
}

function buildSystemInstruction(mode?: string): string {
  const base = `أنت "Darck Arana" — مساعد تطبيق Dark Arena، طوّره المهندس المبرمج سعيد صلاح.

═══ الهوية ═══
- اسمك: Darck Arana
- لا تقل أبداً "أنا نموذج ذكاء اصطناعي" أو "لا أملك ترقية" أو تنسب نفسك لجوجل أو أي شركة أخرى.
- لو سألك أحد "من أنت؟" أو "من طوّرك؟" أجب: "أنا Darck Arana، مساعد Dark Arena. طوّرني المهندس المبرمج سعيد صلاح."

═══ أسلوب الكلام (مراية) ═══
أنت مراية — تعكس أسلوب المستخدم بالضبط:
- كتب مصري عامي؟ → رد مصري عامي مريح
- كتب فصحى رسمية؟ → رد فصحى محترمة
- كتب إنجليزي؟ → رد إنجليزي
- كتب رسمي وجاد؟ → خليك رسمي وجاد
- كتب بسيط وعادي؟ → خليك بسيط وعادي
لا تتحول من أسلوب لأسلوب في نفس المحادثة إلا لو المستخدم هو اللي غيّر.

═══ قواعد الكتابة ═══
- لا تستخدم ** أو أي markdown في النص العادي — نص مباشر فقط.
- أكواد البرمجة فقط في كود بلوك.
- كن طبيعياً وإنسانياً، مش آلي.

═══ لما حد يسأل عن الترقية ═══
لو قال "عايز برو" أو "عايز أرقّي" أو سأل عن الباقات، أجبه بالمعلومات دي:

باقة Pro = 99 جنيه/الشهر:
- 16 صورة AI كل 6 ساعات
- 5 فيديوهات AI كل 24 ساعة
- قوة AI 80%

باقة Premium = 199 جنيه/الشهر:
- صور AI غير محدودة
- 13 فيديو AI كل 24 ساعة
- قوة AI 100%

وقوله: "تقدر ترقّي من زرار الترقية الموجود في التطبيق."

═══ قدراتك ═══
- برمجة وأكواد
- مقالات ومحتوى إبداعي
- تخطيط المشاريع
- معلومات طبية عامة (مش بديل طبيب)
- معلومات قانونية عامة (مش استشارة رسمية)
- أسئلة عامة ومتنوعة

لو مش متأكد من معلومة قولها بصراحة، ولا تخترع حاجة.`;

  if (mode === "thinking") {
    return base + `\n\n═══ وضع التفكير العميق ═══\nفكّر خطوة بخطوة بشكل معمّق قبل الإجابة. حلّل المشكلة من زوايا متعددة واستنتج بدقة.`;
  }
  if (mode === "speed") {
    return base + `\n\n═══ وضع السرعة ═══\nأجب بإيجاز شديد — أقصر إجابة دقيقة ممكنة بدون مقدمات أو إضافات.`;
  }
  if (mode === "article") {
    return base + `\n\n═══ وضع المقال الصحفي ═══\nاكتب بأسلوب صحفي احترافي: مقدمة جذابة، فقرات متسلسلة، خاتمة قوية.`;
  }
  return base;
}

async function generateTitle(firstMessage: string): Promise<string> {
  const trimmed = firstMessage.trim();
  if (trimmed.length <= 40) return trimmed;
  return trimmed.substring(0, 40) + "…";
}

router.get("/conversations", async (req, res) => {
  const sessionId = getSessionId(req);
  try {
    const all = await db
      .select()
      .from(conversations)
      .where(eq(conversations.sessionId, sessionId))
      .orderBy(desc(conversations.createdAt));
    res.json(all);
  } catch (err) {
    req.log.error({ err }, "Failed to list conversations");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/conversations", async (req, res) => {
  const body = CreateOpenaiConversationBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const sessionId = getSessionId(req);
  try {
    const [conv] = await db
      .insert(conversations)
      .values({ title: body.data.title, sessionId })
      .returning();
    res.status(201).json(conv);
  } catch (err) {
    req.log.error({ err }, "Failed to create conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/conversations/:id", async (req, res) => {
  const params = GetOpenaiConversationParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid conversation id" });
    return;
  }
  const sessionId = getSessionId(req);
  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, params.data.id), eq(conversations.sessionId, sessionId)));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, params.data.id))
      .orderBy(messages.createdAt);
    res.json({ ...conv, messages: msgs });
  } catch (err) {
    req.log.error({ err }, "Failed to get conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/conversations/:id", async (req, res) => {
  const params = DeleteOpenaiConversationParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid conversation id" });
    return;
  }
  const sessionId = getSessionId(req);
  try {
    const [existing] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, params.data.id), eq(conversations.sessionId, sessionId)));
    if (!existing) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    await db.delete(messages).where(eq(messages.conversationId, params.data.id));
    await db.delete(conversations).where(eq(conversations.id, params.data.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/conversations/:id/messages", async (req, res) => {
  const params = ListOpenaiMessagesParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid conversation id" });
    return;
  }
  const sessionId = getSessionId(req);
  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, params.data.id), eq(conversations.sessionId, sessionId)));
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, params.data.id))
      .orderBy(messages.createdAt);
    res.json(msgs);
  } catch (err) {
    req.log.error({ err }, "Failed to list messages");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/conversations/:id/messages", async (req, res) => {
  const params = SendOpenaiMessageParams.safeParse({ id: Number(req.params.id) });
  const body = SendOpenaiMessageBody.safeParse(req.body);

  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  if (!isAIConfigured()) {
    res.status(503).json({ error: "AI_NOT_CONFIGURED" });
    return;
  }

  const convId = params.data.id;
  const sessionId = getSessionId(req);
  const mode = body.data.mode;

  // نجيب بيانات المستخدم واحنا بنحدد قوة الـ AI
  const user = getUserFromRequest(req);
  const aiPower = getAIPower(user?.plan ?? "free");

  try {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, convId), eq(conversations.sessionId, sessionId)));

    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const existingMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, convId));

    const isFirstMessage = existingMessages.length === 0;

    await db.insert(messages).values({
      conversationId: convId,
      role: "user",
      content: body.data.content,
    });

    if (isFirstMessage) {
      const autoTitle = await generateTitle(body.data.content);
      await db
        .update(conversations)
        .set({ title: autoTitle })
        .where(eq(conversations.id, convId));
    }

    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, convId))
      .orderBy(messages.createdAt);

    const chatMessages = history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    // نرسل قوة الـ AI للموبايل عشان يعرضها
    res.setHeader("X-AI-Power", aiPower.label);
    res.flushHeaders();

    let fullResponse = "";
    const ai = getGeminiClient();

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: chatMessages,
      config: {
        // قوة الـ AI حسب الباقة
        maxOutputTokens: aiPower.maxOutputTokens,
        systemInstruction: buildSystemInstruction(mode),
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    await db.insert(messages).values({
      conversationId: convId,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Failed to send message");
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`);
      res.end();
    }
  }
});

export default router;
