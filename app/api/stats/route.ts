import { NextResponse } from "next/server";
import { getDb } from "../../../db";
import { usageEvents } from "../../../db/schema";
import { categorizeRelationship, type RelationshipCategory } from "../../../lib/relationship-category";
import type { MessageChannel } from "../../../lib/message";

type CrossTabBucket = {
  category: RelationshipCategory;
  channel: MessageChannel;
  count: number;
  examples: string[];
};

// 집계 전용 조회 — usage_events 자체에 원문/이름/연락처가 없어서
// 이 라우트도 개수(count)만 반환함. relationship은 자유 텍스트라서
// categorizeRelationship()으로 비슷한 표현("전 여자친구" ≈ "전 연인")을
// 묶은 뒤 category × channel로 집계함. 실제로 서비스에 배포할 땐
// 이 라우트에 간단한 접근 제한(관리자 키 확인 등)을 추가하는 걸 권장.
export async function GET() {
  try {
    const db = getDb();

    const events = await db
      .select({ relationship: usageEvents.relationship, channel: usageEvents.channel })
      .from(usageEvents);

    const buckets = new Map<string, CrossTabBucket & { exampleSet: Set<string> }>();

    for (const event of events) {
      const category = categorizeRelationship(event.relationship);
      const channel = event.channel as MessageChannel;
      const key = `${category}::${channel}`;
      const bucket = buckets.get(key) ?? { category, channel, count: 0, examples: [], exampleSet: new Set<string>() };
      bucket.count += 1;
      if (bucket.exampleSet.size < 5) bucket.exampleSet.add(event.relationship);
      buckets.set(key, bucket);
    }

    const crossTab: CrossTabBucket[] = Array.from(buckets.values())
      .map(({ exampleSet, ...bucket }) => ({ ...bucket, examples: Array.from(exampleSet) }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json(
      { crossTab, total: events.length },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("stats query failed", error);
    return NextResponse.json(
      { error: "통계를 불러오지 못했어요." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
