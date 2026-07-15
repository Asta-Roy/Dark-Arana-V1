import { db, usageCounters } from "@workspace/db";
import { eq, and } from "drizzle-orm";

// Plan limits definition
export const PLAN_LIMITS = {
  free: {
    image: { max: 8, windowHours: 24 },
    video: null, // Not allowed
    aiPower: 40,
  },
  pro: {
    image: { max: 16, windowHours: 6 },
    video: { max: 5, windowHours: 24 },
    aiPower: 80,
  },
  premium: {
    image: null, // Unlimited
    video: { max: 13, windowHours: 24 },
    aiPower: 100,
  },
} as const;

// Returns { allowed: true } or { allowed: false, reason: string }
export async function checkAndIncrementUsage(
  userId: number,
  plan: "free" | "pro" | "premium",
  feature: "image" | "video"
): Promise<{ allowed: boolean; reason?: string }> {
  const limits = PLAN_LIMITS[plan];
  const limit = limits[feature as keyof typeof limits] as { max: number; windowHours: number } | null | undefined;

  if (limit === null) {
    return { allowed: false, reason: `الفيديو غير متاح في الباقة المجانية. الرجاء الترقية إلى باقة برو أو بريميوم.` };
  }
  if (limit === undefined) {
    // Unlimited (premium image)
    return { allowed: true };
  }

  const windowMs = limit.windowHours * 60 * 60 * 1000;
  const now = new Date();

  // Get or create usage counter for this user+feature
  let [counter] = await db
    .select()
    .from(usageCounters)
    .where(and(eq(usageCounters.userId, userId), eq(usageCounters.feature, feature)));

  if (!counter) {
    // Create new counter
    const [newCounter] = await db
      .insert(usageCounters)
      .values({ userId, feature, count6h: 0, count24h: 0, window6hStart: now, window24hStart: now })
      .returning();
    counter = newCounter;
  }

  // Determine which window to use based on plan
  const useWindow = plan === "pro" ? "6h" : "24h";
  const windowStart = useWindow === "6h" ? counter.window6hStart : counter.window24hStart;
  const count = useWindow === "6h" ? counter.count6h : counter.count24h;

  // Check if window expired — reset if so
  if (now.getTime() - windowStart.getTime() > windowMs) {
    // Reset the window
    if (useWindow === "6h") {
      await db
        .update(usageCounters)
        .set({ count6h: 1, window6hStart: now })
        .where(eq(usageCounters.id, counter.id));
    } else {
      await db
        .update(usageCounters)
        .set({ count24h: 1, window24hStart: now })
        .where(eq(usageCounters.id, counter.id));
    }
    return { allowed: true };
  }

  // Check if limit reached
  if (count >= limit.max) {
    const resetAt = new Date(windowStart.getTime() + windowMs);
    const hoursLeft = Math.ceil((resetAt.getTime() - now.getTime()) / (1000 * 60 * 60));
    return {
      allowed: false,
      reason: `لقد وصلت للحد الأقصى (${limit.max} في ${limit.windowHours} ساعة). ستُجدَّد القدرة خلال ${hoursLeft} ساعة.`,
    };
  }

  // Increment counter
  if (useWindow === "6h") {
    await db.update(usageCounters).set({ count6h: count + 1 }).where(eq(usageCounters.id, counter.id));
  } else {
    await db.update(usageCounters).set({ count24h: count + 1 }).where(eq(usageCounters.id, counter.id));
  }

  return { allowed: true };
}
