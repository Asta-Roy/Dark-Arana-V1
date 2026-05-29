import { Router } from "express";
import { GenerateOpenaiImageBody } from "@workspace/api-zod";
import { getGeminiClient, isAIConfigured } from "../../lib/gemini-client.js";
import { Modality } from "@google/genai";

const router = Router();

router.post("/generate-image", async (req, res) => {
  const body = GenerateOpenaiImageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  if (!isAIConfigured()) {
    res.status(503).json({ error: "AI_NOT_CONFIGURED" });
    return;
  }

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: [{ role: "user", parts: [{ text: body.data.prompt }] }],
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData?.mimeType?.startsWith("image/"));

    if (!imagePart?.inlineData?.data) {
      res.status(500).json({ error: "No image returned from AI model" });
      return;
    }

    res.json({
      b64_json: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to generate image");
    res.status(500).json({ error: "Image generation failed" });
  }
});

export default router;
