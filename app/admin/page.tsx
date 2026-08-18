"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { channelLabels, type MessageChannel } from "../../lib/message";

type CrossTabRow = {
  category: string;
  channel: MessageChannel;
  count: number;
  examples: string[];
};

const CHANNELS: MessageChannel[] = ["kakao", "instagram", "email"];

const thStyle: CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid var(--ink)",
  padding: "8px 12px",
  fontSize: 13,
  color: "var(--muted)",
};

const tdStyle: CSSProperties = {
  borderBottom: "1px solid var(--line)",
  padding: "10px 12px",
  fontSize: 14,
  verticalAlign: "top",
};

// 관계 × 채널 교차분석 — usage_events(이용 시간·관계·채널·톤)만 집계해서 보여줌.
// relationship은 자유 텍스트라 "전 여자친구"/"전 연인"처럼 표현이 달라도
// 비슷한 결이면 서버(/api/stats, categorizeRelationship)에서 미리 묶어서 내려줌.
// 원문·이름·연락처는 애초에 저장 안 하니 이 화면에도 나올 수 없음.
// 로컬 확인용 화면이라 인증이 없음 — 실제 배포 시에는 접근 제한을 추가할 것.
export default function AdminPage() {
  const [rows, setRows] = useState<CrossTabRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data) => {
        setRows(data.crossTab);
        setTotal(data.total);
      })
      .catch(() => setError("통계를 불러오지 못했어요."));
  }, []);

  const categoryTotal = (category: string) =>
    (rows ?? []).filter((r) => r.category === category).reduce((sum, r) => sum + r.count, 0);

  const categories = Array.from(new Set((rows ?? []).map((r) => r.category))).sort(
    (a, b) => categoryTotal(b) - categoryTotal(a),
  );

  const cell = (category: string, channel: MessageChannel) =>
    rows?.find((r) => r.category === category && r.channel === channel);

  const examplesFor = (category: string) => {
    const set = new Set<string>();
    (rows ?? [])
      .filter((r) => r.category === category)
      .forEach((r) => r.examples.forEach((e) => set.add(e)));
    return Array.from(set).slice(0, 5);
  };

  return (
    <main
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "var(--font-noto-sans-kr), 'Apple SD Gothic Neo', sans-serif",
      }}
    >
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>관계 × 채널 교차분석</h1>
      <p style={{ color: "var(--muted)", marginBottom: 24, fontSize: 13 }}>
        총 {total}건의 이용 데이터 기준 · 복사 버튼을 누른 이벤트만 집계됨 · 비슷한 관계 표현은 자동으로 묶임 · 원문·이름·연락처는 저장되지 않음
      </p>

      {error && <p style={{ color: "#b3261e" }}>{error}</p>}
      {!rows && !error && <p>불러오는 중…</p>}
      {rows && rows.length === 0 && <p>아직 쌓인 데이터가 없어요. 서비스에서 결과를 복사해보세요.</p>}

      {rows && rows.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>관계 카테고리</th>
              {CHANNELS.map((c) => (
                <th key={c} style={thStyle}>
                  {channelLabels[c]}
                </th>
              ))}
              <th style={thStyle}>합계</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category}>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 600 }}>{category}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                    {examplesFor(category).join(", ")}
                  </div>
                </td>
                {CHANNELS.map((c) => (
                  <td key={c} style={{ ...tdStyle, textAlign: "center" }}>
                    {cell(category, c)?.count || "–"}
                  </td>
                ))}
                <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700 }}>
                  {categoryTotal(category)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
