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
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_usage_events_event_created_at").on(table.event, table.createdAt),
  ],
);
