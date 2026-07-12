---
name: Image Generation Approach
description: How image generation works in this project — Pollinations.ai is the working solution
---

## Rule
Use **Pollinations.ai** for image generation. Do NOT use Gemini image models or OpenAI DALL-E — both fail in this environment.

**Why:**
- `gemini-2.0-flash-preview-image-generation` → 404 NOT_FOUND on v1beta and v1alpha
- `imagen-3.0-generate-002` → 404 NOT_FOUND on both API versions  
- OpenAI DALL-E 3 via Replit proxy → "model does not exist" (proxy doesn't support image models)
- OpenAI DALL-E 3 directly (with `baseURL: "https://api.openai.com/v1"`) → same 400 error (OPENAI_API_KEY goes through a proxy regardless)
- Pollinations.ai → FREE, no API key, returns image directly ✅

**How to apply:**
```typescript
const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&model=flux`;
const imgResponse = await fetch(url, { headers: { "User-Agent": "DarckArana/1.0" } });
const arrayBuffer = await imgResponse.arrayBuffer();
const b64 = Buffer.from(arrayBuffer).toString("base64");
```

The server fetches the image and converts it to base64 so the client can use `data:image/jpeg;base64,{b64}`.
