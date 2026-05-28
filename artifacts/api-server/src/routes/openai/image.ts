import { Router } from "express";
import { GenerateOpenaiImageBody } from "@workspace/api-zod";
import { generateImageBuffer } from "@workspace/integrations-openai-ai-server/image";

const router = Router();

router.post("/generate-image", async (req, res) => {
  const body = GenerateOpenaiImageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  try {
    const validSizes = ["1024x1024", "1536x1024", "1024x1536"] as const;
    type ImageSize = typeof validSizes[number];
    const size: ImageSize =
      validSizes.includes(body.data.size as ImageSize)
        ? (body.data.size as ImageSize)
        : "1024x1024";

    const buffer = await generateImageBuffer(body.data.prompt, size);
    const b64_json = buffer.toString("base64");
    res.json({ b64_json });
  } catch (err) {
    req.log.error({ err }, "Failed to generate image");
    res.status(500).json({ error: "Image generation failed" });
  }
});

export default router;
