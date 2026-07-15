import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

// Tracks feature usage per user within rolling time windows (6h and 24h)
export const usageCounters = pgTable("usage_counters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  feature: text("feature").notNull(), // "image" | "video" | "chat"
  // 6-hour window counter (used by Pro plan)
  count6h: integer("count_6h").notNull().default(0),
  window6hStart: timestamp("window_6h_start", { withTimezone: true }).defaultNow().notNull(),
  // 24-hour window counter (used by Free + Premium)
  count24h: integer("count_24h").notNull().default(0),
  window24hStart: timestamp("window_24h_start", { withTimezone: true }).defaultNow().notNull(),
});

export type UsageCounter = typeof usageCounters.$inferSelect;
