import { Router } from "express";
import { GenerateOpenaiImageBody } from "@workspace/api-zod";

const router = Router();

// Pollinations.ai — free image generation, no API key required
const POLLINATIONS_URL = "https://image.pollinations.ai/prompt";

router.post("/generate-image", async (req, res) => {
  const body = GenerateOpenaiImageBody.safeParse(req.body);

  if (!body.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  try {
    const encodedPrompt = encodeURIComponent(body.data.prompt);
    const url = `${POLLINATIONS_URL}/${encodedPrompt}?width=1024&height=1024&nologo=true&model=flux`;

    const imgResponse = await fetch(url, {
      headers: { "User-Agent": "DarckArana/1.0" },
    });

    if (!imgResponse.ok) {
      req.log?.error?.(
        { status: imgResponse.status, url },
        "Pollinations fetch failed"
      );
      return res.status(500).json({ error: "Image generation failed" });
    }

    const contentType = imgResponse.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await imgResponse.arrayBuffer();
    const b64 = Buffer.from(arrayBuffer).toString("base64");

    return res.json({ b64_json: b64, mimeType: contentType });
  } catch (err) {
    req.log?.error?.({ err }, "Failed to generate image via Pollinations");
    return res.status(500).json({ error: "Image generation failed" });
  }
});

export default router;
