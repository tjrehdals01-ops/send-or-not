import { count, desc, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { usageEvents } from "../../../db/schema";

const allowedEvents = new Set([
  "select_channel",
  "select_language",
  "select_recipient_category",
  "message_review_completed",
  "message_review_error",
  "select_tone",
  "copy_message",
  "share",
]);
const allowedChannels = new Set(["kakao", "instagram", "email"]);
const allowedLanguages = new Set(["ko", "en"]);
const allowedTones = new Set(["원본", "기본형", "단호하게", "정중하게"]);
const allowedRecipientCategories = new Set([
  "friend",
  "colleague",
  "professor_manager",
  "family_partner",
  "customer",
  "new_contact",
  "other",
]);
const allowedMessageLengthBuckets = new Set(["1_50", "51_150", "151_300", "301_1000"]);
const allowedTrafficTypes = new Set(["user", "synthetic"]);

type EventPayload = {
  event?: unknown;
  channel?: unknown;
  language?: unknown;
  output_language?: unknown;
  tone?: unknown;
  recipient_category?: unknown;
  message_length_bucket?: unknown;
  traffic_type?: unknown;
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
    const language = optionalAllowed(payload.output_language ?? payload.language, allowedLanguages);
    const tone = optionalAllowed(payload.tone, allowedTones);
    const recipientCategory = optionalAllowed(payload.recipient_category, allowedRecipientCategories);
    const messageLengthBucket = optionalAllowed(payload.message_length_bucket, allowedMessageLengthBuckets);
    const trafficType = optionalAllowed(payload.traffic_type, allowedTrafficTypes);
    if (
      channel === undefined ||
      language === undefined ||
      tone === undefined ||
      recipientCategory === undefined ||
      messageLengthBucket === undefined ||
      trafficType === undefined
    ) {
      return Response.json({ error: "이벤트 속성이 올바르지 않습니다." }, { status: 400 });
    }

    const db = getDb();
    await db.insert(usageEvents).values({
      event: payload.event,
      channel,
      language,
      tone,
      recipientCategory,
      messageLengthBucket,
      trafficType,
    });

    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "사용 통계를 저장하지 못했습니다." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = getDb();
    const [
      summary,
      recent,
      channels,
      recipientCategories,
      languages,
      tones,
      messageLengthBuckets,
      trafficTypes,
    ] = await Promise.all([
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
      db
        .select({ channel: usageEvents.channel, count: count() })
        .from(usageEvents)
        .where(sql`${usageEvents.event} = 'message_review_completed' AND ${usageEvents.channel} IS NOT NULL`)
        .groupBy(usageEvents.channel)
        .orderBy(desc(count())),
      db
        .select({ recipientCategory: usageEvents.recipientCategory, count: count() })
        .from(usageEvents)
        .where(sql`${usageEvents.event} = 'message_review_completed' AND ${usageEvents.recipientCategory} IS NOT NULL`)
        .groupBy(usageEvents.recipientCategory)
        .orderBy(desc(count())),
      db
        .select({ language: usageEvents.language, count: count() })
        .from(usageEvents)
        .where(sql`${usageEvents.event} = 'message_review_completed' AND ${usageEvents.language} IS NOT NULL`)
        .groupBy(usageEvents.language)
        .orderBy(desc(count())),
      db
        .select({ tone: usageEvents.tone, count: count() })
        .from(usageEvents)
        .where(sql`${usageEvents.event} = 'select_tone' AND ${usageEvents.tone} IS NOT NULL`)
        .groupBy(usageEvents.tone)
        .orderBy(desc(count())),
      db
        .select({ messageLengthBucket: usageEvents.messageLengthBucket, count: count() })
        .from(usageEvents)
        .where(sql`${usageEvents.event} = 'message_review_completed' AND ${usageEvents.messageLengthBucket} IS NOT NULL`)
        .groupBy(usageEvents.messageLengthBucket)
        .orderBy(desc(count())),
      db
        .select({ trafficType: usageEvents.trafficType, count: count() })
        .from(usageEvents)
        .where(sql`${usageEvents.event} = 'message_review_completed' AND ${usageEvents.trafficType} IS NOT NULL`)
        .groupBy(usageEvents.trafficType)
        .orderBy(desc(count())),
    ]);

    return Response.json(
      {
        summary,
        recent,
        completed: {
          channels,
          recipientCategories,
          languages,
          messageLengthBuckets,
          trafficTypes,
        },
        toneSelections: tones,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "사용 통계를 불러오지 못했습니다." }, { status: 500 });
  }
}
