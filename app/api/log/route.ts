import { NextResponse } from "next/server";
import { getDb } from "../../../db";
import { usageEvents } from "../../../db/schema";
import type { MessageChannel } from "../../../lib/message";

const channels: MessageChannel[] = ["kakao", "instagram", "email"];
const tones = ["원본", "기본형", "단호하게", "정중하게"];

type LogPayload = {
  relationship: string;
  channel: MessageChannel;
  tone: string;
};

function readPayload(value: unknown): LogPayload | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Partial<LogPayload>;
  if (
    typeof body.relationship !== "string" ||
    !channels.includes(body.channel as MessageChannel) ||
    typeof body.tone !== "string" ||
    !tones.includes(body.tone)
  ) {
    return null;
  }

  return {
    relationship: body.relationship.slice(0, 120).trim() || "입력하지 않음",
    channel: body.channel as MessageChannel,
    tone: body.tone,
  };
}

// 사용자가 "복사"를 눌렀을 때만 호출됨. 원문·이름·연락처는 절대 받지 않음 —
// 스키마(db/schema.ts)에 그 필드 자체가 없음.
export async function POST(request: Request) {
  let payload: LogPayload | null = null;
  try {
    payload = readPayload(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  if (!payload) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  try {
    const db = getDb();
    await db.insert(usageEvents).values(payload);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    // DB 바인딩이 아직 없거나(로컬 미설정 등) 실패해도 사용자 흐름은 막지 않음.
    console.error("usage log failed", error);
    return NextResponse.json({ ok: false }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }
}
