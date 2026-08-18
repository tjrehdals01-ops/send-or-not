import { count, desc, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { usageEvents } from "../../../db/schema";

const allowedEvents = new Set([
  "select_channel",
  "select_language",
  "message_review_completed",
  "message_review_error",
  "select_tone",
  "copy_message",
  "share",
]);
const allowedChannels = new Set(["kakao", "instagram", "email"]);
const allowedLanguages = new Set(["ko", "en"]);
const allowedTones = new Set(["원본", "기본형", "단호하게", "정중하게"]);

type EventPayload = {
  event?: unknown;
  channel?: unknown;
  language?: unknown;
  tone?: unknown;
};

function optionalAllowed(value: unknown, allowed: Set<string>) {
  if (value === undefined || value === null || value === "") return null;
  return typeof value === "string" && allowed.has(value) ? value : undefined;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as EventPayload;
    if (typeof payload.event !== "string" || !allowedEvents.has(payload.event)) {
      return Response.json({ error: "지원하지 않는 이벤트입니다." }, { status: 400 });
    }

    const channel = optionalAllowed(payload.channel, allowedChannels);
    const language = optionalAllowed(payload.language, allowedLanguages);
    const tone = optionalAllowed(payload.tone, allowedTones);
    if (channel === undefined || language === undefined || tone === undefined) {
      return Response.json({ error: "이벤트 속성이 올바르지 않습니다." }, { status: 400 });
    }

    const db = getDb();
    await db.insert(usageEvents).values({
      event: payload.event,
      channel,
      language,
      tone,
    });

    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "사용 통계를 저장하지 못했습니다." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = getDb();
    const [summary, recent] = await Promise.all([
      db
        .select({ event: usageEvents.event, count: count() })
        .from(usageEvents)
        .groupBy(usageEvents.event)
        .orderBy(desc(count())),
      db
        .select({
          date: sql<string>`date(${usageEvents.createdAt})`,
          count: count(),
        })
        .from(usageEvents)
        .where(sql`${usageEvents.createdAt} >= datetime('now', '-6 days')`)
        .groupBy(sql`date(${usageEvents.createdAt})`)
        .orderBy(sql`date(${usageEvents.createdAt})`),
    ]);

    return Response.json(
      { summary, recent },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "사용 통계를 불러오지 못했습니다." }, { status: 500 });
  }
}
