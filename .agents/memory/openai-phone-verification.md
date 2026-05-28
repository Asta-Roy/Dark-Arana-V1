---
name: OpenAI AI Integration - Phone Verification & Lazy Client
description: When Replit AI Integrations for OpenAI isn't provisioned, the integration client throws at module load time, crashing the server on startup.
---

## The Rule

Never import directly from `@workspace/integrations-openai-ai-server` at the top-level of route files when the AI integration may not be provisioned. Use a lazy client wrapper instead.

**Why:** The `lib/integrations-openai-ai-server/src/client.ts` throws at module initialization if `AI_INTEGRATIONS_OPENAI_BASE_URL` or `AI_INTEGRATIONS_OPENAI_API_KEY` are missing. When esbuild bundles the server, this causes the entire process to crash on startup, not just the route that uses AI.

**How to apply:** Create `artifacts/api-server/src/lib/openai-client.ts` that:
1. Lazy-initializes the OpenAI client only when first called
2. Exports `isAIConfigured()` to check before using AI routes
3. Returns a 503 `{ error: "AI_NOT_CONFIGURED" }` in routes when not configured

Also requires: `openai` package added directly to `@workspace/api-server` dependencies (not just through the integration package), since esbuild needs to resolve it directly.

**Setup flow:** `setupReplitAIIntegrations()` returns `{ status: "awaiting_phone_verification" }` when the user's Replit account hasn't verified phone. Once verified, calling setup again provisions the env vars and the server picks them up on next restart.
