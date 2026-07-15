import { Router } from "express";
import { GenerateOpenaiImageBody } from "@workspace/api-zod";
import { getGeminiClient, isAIConfigured } from "../../lib/gemini-client.js";
import { verifyToken } from "../../lib/auth.js";
import { checkAndIncrementUsage } from "../../lib/usage.js";

const router = Router();

const POLLINATIONS_URL = "https://image.pollinations.ai/prompt";

// ترجمة وتحسين البرومبت من العربية للإنجليزية
async function translateAndEnhancePrompt(prompt: string): Promise<string> {
  if (!isAIConfigured()) return prompt;

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Translate the following image prompt to English and enhance it with vivid details for an AI image generator. Return ONLY the English prompt, nothing else, no quotes, no explanation.

Prompt: "${prompt}"`,
            },
          ],
        },
      ],
    });
    const translated = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return translated && translated.length > 0 ? translated : prompt;
  } catch {
    return prompt;
  }
}

// استخراج بيانات المستخدم من الـ token اختياري (لو موجود)
function getUserFromRequest(req: import("express").Request): { id: number; plan: "free" | "pro" | "premium" } | null {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) return null;
  const payload = verifyToken(authHeader.slice(7));
  if (!payload) return null;
  const plan = (["free", "pro", "premium"].includes(payload.plan) ? payload.plan : "free") as "free" | "pro" | "premium";
  return { id: payload.id, plan };
}

router.post("/generate-image", async (req, res) => {
  const body = GenerateOpenaiImageBody.safeParse(req.body);

  if (!body.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  // نجيب بيانات المستخدم لو موجود token
  const user = getUserFromRequest(req);

  // ── فحص الليمت حسب الباقة ──
  if (user) {
    const check = await checkAndIncrementUsage(user.id, user.plan, "image");
    if (!check.allowed) {
      return res.status(429).json({
        error: "limit_reached",
        message: check.reason ?? "وصلت للحد الأقصى — اشترك للمتابعة",
        upgrade: true,
      });
    }
  }

  try {
    const englishPrompt = await translateAndEnhancePrompt(body.data.prompt);

    req.log?.info?.({ original: body.data.prompt, translated: englishPrompt, plan: user?.plan ?? "anonymous" }, "Image prompt translated");

    const encodedPrompt = encodeURIComponent(englishPrompt);
    const url = `${POLLINATIONS_URL}/${encodedPrompt}?width=1024&height=1024&nologo=true&model=flux`;

    const imgResponse = await fetch(url, {
      headers: { "User-Agent": "DarckArana/1.0" },
    });

    if (!imgResponse.ok) {
      req.log?.error?.({ status: imgResponse.status, url }, "Pollinations fetch failed");
      return res.status(500).json({ error: "Image generation failed" });
    }

    const contentType = imgResponse.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await imgResponse.arrayBuffer();

    if (!arrayBuffer.byteLength) {
      return res.status(500).json({ error: "Empty image returned" });
    }

    const b64 = Buffer.from(arrayBuffer).toString("base64");
    return res.json({ b64_json: b64, mimeType: contentType });
  } catch (err) {
    req.log?.error?.({ err }, "Failed to generate image");
    return res.status(500).json({ error: "Image generation failed" });
  }
});

export default router;
