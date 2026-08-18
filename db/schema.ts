import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// 사용 데이터 로그 — 원문·이름·연락처는 저장하지 않음.
// "복사" 버튼을 눌렀을 때만 기록됨 (app/api/log/route.ts 참고).
export const usageEvents = sqliteTable("usage_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  usedAt: text("used_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  relationship: text("relationship").notNull(), // 받는 사람과의 관계 (예: "전공 지도교수님")
  channel: text("channel").notNull(), // kakao | instagram | email
  tone: text("tone").notNull(), // 원본 | 기본형 | 단호하게 | 정중하게
});
