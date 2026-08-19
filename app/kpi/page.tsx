"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import "./kpi.css";

type CountRow = { count: number };
type ChannelRow = CountRow & { channel: string };
type RecipientRow = CountRow & { recipientCategory: string };
type LanguageRow = CountRow & { language: string };
type ToneRow = CountRow & { tone: string };
type LengthRow = CountRow & { messageLengthBucket: string };
type TrafficRow = CountRow & { trafficType: string };

type KpiResponse = {
  recent: Array<{ date: string; count: number }>;
  completed: {
    channels: ChannelRow[];
    recipientCategories: RecipientRow[];
    languages: LanguageRow[];
    messageLengthBuckets: LengthRow[];
    trafficTypes: TrafficRow[];
  };
  toneSelections: ToneRow[];
  kpis: {
    startedReviews: number;
    completedReviews: number;
    usedReviews: number;
    copiedReviews: number;
    sharedReviews: number;
    feedbackReviews: number;
    helpfulReviews: number;
    completionRate: number;
    resultUtilizationRate: number;
    copyRate: number;
    shareRate: number;
    feedbackParticipationRate: number;
    positiveFeedbackRate: number;
    averageResponseTimeMs: number;
  };
};

const channelLabels: Record<string, string> = { kakao: "카카오톡", instagram: "Instagram DM", email: "이메일" };
const recipientLabels: Record<string, string> = {
  friend: "친구",
  colleague: "동료·팀원",
  professor_manager: "교수·상사",
  family_partner: "가족·연인",
  customer: "고객",
  new_contact: "처음 연락하는 사람",
  other: "기타",
};
const languageLabels: Record<string, string> = { ko: "한국어", en: "영어" };
const lengthLabels: Record<string, string> = {
  "1_50": "1–50자",
  "51_150": "51–150자",
  "151_300": "151–300자",
  "301_1000": "301–1,000자",
};

function formatSeconds(milliseconds: number) {
  if (!milliseconds) return "–";
  return `${(milliseconds / 1000).toFixed(1)}초`;
}

function Distribution({
  title,
  caption,
  rows,
}: {
  title: string;
  caption: string;
  rows: Array<{ label: string; count: number }>;
}) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const max = Math.max(...rows.map((row) => row.count), 1);

  return (
    <article className="distribution-card">
      <div className="distribution-heading">
        <div>
          <h2>{title}</h2>
          <p>{caption}</p>
        </div>
        <span>{total.toLocaleString()}건</span>
      </div>
      <div className="bar-list">
        {rows.length === 0 && <p className="empty-state">아직 집계된 데이터가 없습니다.</p>}
        {rows.map((row) => (
          <div className="bar-row" key={row.label}>
            <div className="bar-label">
              <span>{row.label}</span>
              <strong>{row.count.toLocaleString()}건 · {total ? Math.round((row.count / total) * 100) : 0}%</strong>
            </div>
            <div className="bar-track" aria-hidden="true">
              <span style={{ width: `${(row.count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function KpiPage() {
  const [data, setData] = useState<KpiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/events", { cache: "no-store" });
      if (!response.ok) throw new Error("통계를 불러오지 못했습니다.");
      setData((await response.json()) as KpiResponse);
      setUpdatedAt(new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date()));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "통계를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const traffic = useMemo(() => {
    const rows = data?.completed.trafficTypes ?? [];
    const total = rows.reduce((sum, row) => sum + row.count, 0);
    const user = rows.find((row) => row.trafficType === "user")?.count ?? 0;
    const synthetic = rows.find((row) => row.trafficType === "synthetic")?.count ?? 0;
    return {
      total,
      user,
      synthetic,
      userRate: total ? Math.round((user / total) * 1000) / 10 : 0,
      syntheticRate: total ? Math.round((synthetic / total) * 1000) / 10 : 0,
    };
  }, [data]);

  const kpis = data?.kpis;

  return (
    <main className="kpi-page">
      <header className="kpi-header">
        <a className="kpi-brand" href="/">보내도 돼?</a>
        <a className="back-link" href="/">메시지 점검으로 돌아가기 <span aria-hidden="true">→</span></a>
      </header>

      <section className="kpi-hero">
        <div>
          <p className="kpi-overline">SERVICE KPI DASHBOARD</p>
          <h1>서비스 성과를<br />한눈에 확인해요.</h1>
        </div>
        <div className="dashboard-status">
          <span>누적 데이터 · 테스트 데이터 포함</span>
          <p>{updatedAt ? `${updatedAt} 기준` : "데이터를 불러오는 중"}</p>
          <button type="button" onClick={() => void loadData()} disabled={loading}>{loading ? "불러오는 중" : "새로고침"}</button>
        </div>
      </section>

      {error && (
        <section className="dashboard-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => void loadData()}>다시 불러오기</button>
        </section>
      )}

      {!error && kpis && (
        <>
          <section className="kpi-grid" aria-label="핵심 성과 지표">
            <article className="kpi-card primary">
              <span>01 · 검토 완료율</span>
              <strong>{kpis.completionRate}%</strong>
              <p>검토 시작 {kpis.startedReviews.toLocaleString()}건 중 {kpis.completedReviews.toLocaleString()}건 완료</p>
            </article>
            <article className="kpi-card primary">
              <span>02 · 결과 활용률</span>
              <strong>{kpis.resultUtilizationRate}%</strong>
              <p>완료 결과 중 복사하거나 공유한 비율</p>
            </article>
            <article className="kpi-card primary">
              <span>03 · 긍정 평가율</span>
              <strong>{kpis.positiveFeedbackRate}%</strong>
              <p>평가 {kpis.feedbackReviews.toLocaleString()}건 중 긍정 {kpis.helpfulReviews.toLocaleString()}건</p>
            </article>
            <article className="kpi-card">
              <span>04 · 피드백 참여율</span>
              <strong>{kpis.feedbackParticipationRate}%</strong>
              <p>완료 결과를 평가한 사용자 비율</p>
            </article>
            <article className="kpi-card split-card">
              <span>05 · 결과 사용 방식</span>
              <div><strong>{kpis.copyRate}%</strong><small>복사</small></div>
              <div><strong>{kpis.shareRate}%</strong><small>공유</small></div>
            </article>
            <article className="kpi-card">
              <span>06 · 평균 AI 응답시간</span>
              <strong>{formatSeconds(kpis.averageResponseTimeMs)}</strong>
              <p>성공한 메시지 점검 요청 기준</p>
            </article>
          </section>

          <section className="data-note">
            <div>
              <span>DATA QUALITY</span>
              <h2>실사용과 테스트 데이터를 구분해 봅니다.</h2>
            </div>
            <div className="traffic-summary">
              <div><strong>{traffic.userRate}%</strong><span>실제 사용자 · {traffic.user.toLocaleString()}건</span></div>
              <div><strong>{traffic.syntheticRate}%</strong><span>시나리오 테스트 · {traffic.synthetic.toLocaleString()}건</span></div>
            </div>
            <p>발표에서는 전체 KPI와 함께 데이터 구성을 표시해야 결과를 정확하게 설명할 수 있습니다.</p>
          </section>

          <section className="funnel-section">
            <div className="section-heading">
              <p>USER FUNNEL</p>
              <h2>검토부터 실제 활용까지</h2>
            </div>
            <div className="funnel-steps">
              <div><span>01</span><strong>{kpis.startedReviews.toLocaleString()}</strong><p>검토 시작</p></div>
              <div><span>02</span><strong>{kpis.completedReviews.toLocaleString()}</strong><p>AI 검토 완료</p></div>
              <div><span>03</span><strong>{kpis.usedReviews.toLocaleString()}</strong><p>복사·공유</p></div>
            </div>
          </section>

          <section className="distribution-grid" aria-label="세부 이용 통계">
            <Distribution
              title="채널별 이용"
              caption="어떤 곳에 보낼 메시지를 점검했는지"
              rows={data.completed.channels.map((row) => ({ label: channelLabels[row.channel] ?? row.channel, count: row.count }))}
            />
            <Distribution
              title="관계 유형별 이용"
              caption="누구에게 보낼 메시지가 많았는지"
              rows={data.completed.recipientCategories.map((row) => ({ label: recipientLabels[row.recipientCategory] ?? row.recipientCategory, count: row.count }))}
            />
            <Distribution
              title="결과 언어"
              caption="한국어와 영어 결과의 이용 비중"
              rows={data.completed.languages.map((row) => ({ label: languageLabels[row.language] ?? row.language, count: row.count }))}
            />
            <Distribution
              title="선택한 말투"
              caption="사용자가 최종 비교한 문장 유형"
              rows={data.toneSelections.map((row) => ({ label: row.tone, count: row.count }))}
            />
            <Distribution
              title="원문 길이"
              caption="점검한 원문의 글자 수 구간"
              rows={data.completed.messageLengthBuckets.map((row) => ({ label: lengthLabels[row.messageLengthBucket] ?? row.messageLengthBucket, count: row.count }))}
            />
            <Distribution
              title="최근 이용 추이"
              caption="최근 7일 동안 기록된 전체 행동"
              rows={data.recent.map((row) => ({ label: row.date.slice(5).replace("-", "."), count: row.count }))}
            />
          </section>

          <section className="privacy-note">
            <strong>개인정보 보호 기준</strong>
            <p>원문·이름·목적은 저장하지 않습니다. 채널, 관계 유형, 언어, 문장 길이처럼 개인을 식별할 수 없는 항목만 집계합니다.</p>
          </section>
        </>
      )}

      {!error && loading && !data && <p className="dashboard-loading">통계를 정리하고 있습니다…</p>}

      <footer className="kpi-footer">
        <strong>보내도 돼?</strong>
        <p>성균관대학교 신인류 AI 사피엔스 · 기말 프로젝트</p>
        <a href="/api/events">통계 원본 보기</a>
      </footer>
    </main>
  );
}
