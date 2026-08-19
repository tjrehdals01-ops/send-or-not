import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usageEvents = sqliteTable(
  "usage_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    event: text("event").notNull(),
    channel: text("channel"),
    language: text("language"),
    tone: text("tone"),
    recipientCategory: text("recipient_category"),
    messageLengthBucket: text("message_length_bucket"),
    trafficType: text("traffic_type"),
    reviewId: text("review_id"),
    feedback: text("feedback"),
    shareMethod: text("share_method"),
    durationMs: integer("duration_ms"),
    clientAttempt: integer("client_attempt"),
    providerAttempts: integer("provider_attempts"),
    errorCode: text("error_code"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_usage_events_event_created_at").on(table.event, table.createdAt),
    index("idx_usage_events_channel_created_at").on(table.channel, table.createdAt),
    index("idx_usage_events_recipient_created_at").on(table.recipientCategory, table.createdAt),
    index("idx_usage_events_traffic_created_at").on(table.trafficType, table.createdAt),
    index("idx_usage_events_event_review").on(table.event, table.reviewId),
    index("idx_usage_events_event_error_code").on(table.event, table.errorCode),
  ],
);
