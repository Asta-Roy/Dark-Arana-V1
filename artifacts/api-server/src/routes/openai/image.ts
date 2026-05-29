import { Router } from "express";
import { GenerateOpenaiImageBody } from "@workspace/api-zod";
import { getGeminiClient, isAIConfigured } from "../../lib/gemini-client.js";

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

    const response = await ai.models.generateImages({
      model: "imagen-3.0-generate-002",
      prompt: body.data.prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: "image/jpeg",
        aspectRatio: "1:1",
      },
    });

    const image = response.generatedImages?.[0]?.image;

    if (!image?.imageBytes) {
      res.status(500).json({ error: "No image returned from AI model" });
      return;
    }

    const b64 =
      typeof image.imageBytes === "string"
        ? image.imageBytes
        : Buffer.from(image.imageBytes).toString("base64");

    res.json({
      b64_json: b64,
      mimeType: "image/jpeg",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to generate image");
    res.status(500).json({ error: "Image generation failed" });
  }
});

export default router;
