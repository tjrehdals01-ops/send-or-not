"use client";

import { useState } from "react";
import {
  channelLabels,
  emailShareTitle,
  isReviewResponse,
  languageLabels,
  recipientCategoryLabels,
  type DraftOption,
  type MessageAnalysis,
  type MessageChannel,
  type OutputLanguage,
  type RecipientCategory,
} from "../lib/message";

type AnalyticsWindow = Window & {
  gtag?: (command: "event", eventName: string, parameters?: Record<string, string | number>) => void;
};

type EventDetail = Record<string, string | number | undefined> & {
  language?: string;
  review_id?: string;
};

type ReviewRequestError = Error & {
  code?: string;
  providerAttempts?: number;
};

function track(event: string, detail?: EventDetail) {
  if (typeof window === "undefined") return;
  const trafficType = new URLSearchParams(window.location.search).get("test") === "synthetic"
    ? "synthetic"
    : "user";
  const { language, review_id: reviewId, ...rest } = detail ?? {};
  const analyticsDetail = {
    ...rest,
    ...(language ? { output_language: language } : {}),
    traffic_type: trafficType,
  };

  (window as AnalyticsWindow).gtag?.("event", event, analyticsDetail);
  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, ...analyticsDetail, ...(reviewId ? { review_id: reviewId } : {}) }),
    keepalive: true,
  }).catch(() => undefined);
}

function getMessageLengthBucket(length: number) {
  if (length <= 50) return "1_50";
  if (length <= 150) return "51_150";
  if (length <= 300) return "151_300";
  return "301_1000";
}

export default function Home() {
  const [recipient, setRecipient] = useState("");
  const [recipientCategory, setRecipientCategory] = useState<RecipientCategory>("other");
  const [purpose, setPurpose] = useState("");
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState<MessageChannel>("kakao");
  const [language, setLanguage] = useState<OutputLanguage>("ko");
  const [options, setOptions] = useState<DraftOption[]>([]);
  const [analysis, setAnalysis] = useState<MessageAnalysis | null>(null);
  const [analyzed, setAnalyzed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedOption, setSelectedOption] = useState(1);
  const [editedDraft, setEditedDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewAttempt, setReviewAttempt] = useState(0);
  const [feedback, setFeedback] = useState<"helpful" | "needs_improvement" | null>(null);

  const resetResult = () => {
    setAnalyzed(false);
    setErrorMessage("");
    setCopied(false);
    setShared(false);
    setReviewId(null);
    setReviewAttempt(0);
    setFeedback(null);
  };

  const changeChannel = (next: MessageChannel) => {
    setChannel(next);
    resetResult();
    track("select_channel", { channel: next, recipient_category: recipientCategory });
  };

  const changeLanguage = (next: OutputLanguage) => {
    setLanguage(next);
    resetResult();
    track("select_language", { language: next, channel, recipient_category: recipientCategory });
  };

  const changeRecipientCategory = (next: RecipientCategory) => {
    setRecipientCategory(next);
    resetResult();
    track("select_recipient_category", { recipient_category: next, channel, language });
  };

  const fillExample = () => {
    if (language === "en" && channel === "email") {
      setRecipient("Professor Kim");
      setRecipientCategory("professor_manager");
      setPurpose("Request a one-day assignment extension");
      setMessage("I want to ask if I can submit the assignment one day late because of a personal matter");
    } else if (language === "en" && channel === "instagram") {
      setRecipient("A creator I follow");
      setRecipientCategory("new_contact");
      setPurpose("Ask about a collaboration");
      setMessage("I want to ask if you are interested in working together on a small campus project");
    } else if (language === "en") {
      setRecipient("Project teammate");
      setRecipientCategory("colleague");
      setPurpose("Ask to move tomorrow's meeting");
      setMessage("Can you move our meeting to Thursday? I have another appointment tomorrow");
    } else if (channel === "email") {
      setRecipient("담당 교수님");
      setRecipientCategory("professor_manager");
      setPurpose("과제 제출 기한 하루 연장 요청");
      setMessage("개인 사정으로 과제 준비가 늦어져 하루 늦게 제출해도 괜찮을지 문의드립니다");
    } else if (channel === "instagram") {
      setRecipient("처음 연락하는 동아리 계정 운영자");
      setRecipientCategory("new_contact");
      setPurpose("행사 협업 가능 여부 문의");
      setMessage("안녕하세요 갑자기 DM드려서 죄송한데 이번 행사 때 같이 협업할 수 있을지 여쭤보고 싶어요");
    } else {
      setRecipient("같이 과제하는 팀원");
      setRecipientCategory("colleague");
      setPurpose("회의 시간을 목요일로 변경 요청");
      setMessage("내일 다른 일정이 생겨서 그런데 혹시 회의를 목요일로 옮길 수 있을까?");
    }
    resetResult();
  };

  const runCheck = async () => {
    if (!message.trim()) return;
    const nextReviewId = reviewId ?? crypto.randomUUID();
    const nextClientAttempt = reviewId ? reviewAttempt + 1 : 1;
    const startedAt = performance.now();
    const eventContext = {
      channel,
      language,
      recipient_category: recipientCategory,
      message_length_bucket: getMessageLengthBucket(message.trim().length),
      review_id: nextReviewId,
      client_attempt: nextClientAttempt,
    };

    setIsLoading(true);
    setErrorMessage("");
    setAnalyzed(false);
    setReviewId(nextReviewId);
    setReviewAttempt(nextClientAttempt);
    setFeedback(null);
    track(reviewId ? "review_retry" : "review_started", eventContext);

    try {
      const response = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient, recipientCategory, purpose, message, channel, language }),
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        const apiError = result as { error?: string; code?: string; providerAttempts?: number };
        throw Object.assign(
          new Error(apiError.error || "AI 문장을 생성하지 못했어요."),
          {
            code: apiError.code || "provider_unavailable",
            providerAttempts: apiError.providerAttempts || 1,
          },
        );
      }
      if (!isReviewResponse(result)) {
        throw Object.assign(
          new Error("AI 결과 형식이 올바르지 않아요. 다시 시도해주세요."),
          { code: "client_response_invalid", providerAttempts: 1 },
        );
      }

      setOptions(result.options);
      setAnalysis(result.analysis);
      setSelectedOption(1);
      setEditedDraft(result.options[1].text);
      setAnalyzed(true);
      setCopied(false);
      setShared(false);
      track("message_review_completed", {
        ...eventContext,
        duration_ms: Math.round(performance.now() - startedAt),
        generator: result.generatedBy,
        provider_attempts: result.providerAttempts,
      });
      window.setTimeout(() => document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (error) {
      const requestError = error as ReviewRequestError;
      setErrorMessage(error instanceof Error ? error.message : "AI 문장을 생성하지 못했어요.");
      track("message_review_error", {
        ...eventContext,
        duration_ms: Math.round(performance.now() - startedAt),
        error_code: requestError.code || "unknown_error",
        provider_attempts: requestError.providerAttempts || 1,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const chooseOption = (index: number) => {
    setSelectedOption(index);
    setEditedDraft(options[index].text);
    setCopied(false);
    setShared(false);
    track("select_tone", { tone: options[index].label, channel, language, recipient_category: recipientCategory });
  };

  const copyDraft = async () => {
    await navigator.clipboard.writeText(editedDraft);
    setCopied(true);
    track("copy_message", {
      channel,
      language,
      tone: options[selectedOption].label,
      recipient_category: recipientCategory,
      review_id: reviewId ?? undefined,
      action_source: "copy_button",
    });
  };

  const shareDraft = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: channel === "email" ? emailShareTitle(purpose, language) : undefined,
          text: editedDraft,
        });
        setShared(true);
        track("share_message", {
          method: "web_share",
          content_type: channel,
          channel,
          language,
          recipient_category: recipientCategory,
          review_id: reviewId ?? undefined,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await navigator.clipboard.writeText(editedDraft);
    setCopied(true);
    track("copy_message", {
      channel,
      language,
      tone: options[selectedOption].label,
      recipient_category: recipientCategory,
      review_id: reviewId ?? undefined,
      action_source: "share_fallback",
    });
  };

  const submitFeedback = (value: "helpful" | "needs_improvement") => {
    if (feedback) return;
    setFeedback(value);
    track("result_feedback", {
      feedback: value,
      channel,
      language,
      tone: options[selectedOption].label,
      recipient_category: recipientCategory,
      review_id: reviewId ?? undefined,
    });
  };

  return (
    <main>
      <header className="site-header">
        <a href="#main" className="brand" aria-label="보내도 돼 처음으로">보내도 돼?</a>
        <p>누구에게든, 보내기 전 한 번 더</p>
        <div className="header-actions"><a href="/kpi">KPI 보기</a><span>beta 0.3</span></div>
      </header>

      <div className="notice-bar">
        <span>입력한 문장은 AI 결과 생성에만 사용해요.</span>
        <span>카카오톡·Instagram DM·이메일의 맥락을 함께 분석해요.</span>
      </div>

      <section className="intro" id="main">
        <span className="section-number">01</span>
        <div>
          <p className="overline">MESSAGE CHECK</p>
          <h1>누구에게, 왜 보내는지부터<br />직접 정해주세요.</h1>
          <p>관계와 목적을 알면 같은 내용도 훨씬 자연스럽게 다듬을 수 있어요.</p>
        </div>
      </section>

      <section className="compose-flow" aria-label="메시지 작성 정보">
        <div className="flow-section context-section">
          <div className="flow-heading">
            <span>01</span>
            <div>
              <p>CONTEXT</p>
              <h2>누구에게, 왜 보내나요?</h2>
              <small>정해진 대상은 없어요. 실제 관계와 원하는 결과를 적어주세요.</small>
            </div>
          </div>

          <div className="context-inputs">
            <label htmlFor="recipient-category">
              <span>관계 유형 · 통계용</span>
              <select
                id="recipient-category"
                value={recipientCategory}
                onChange={(event) => changeRecipientCategory(event.target.value as RecipientCategory)}
              >
                {(Object.keys(recipientCategoryLabels) as RecipientCategory[]).map((key) => (
                  <option key={key} value={key}>{recipientCategoryLabels[key]}</option>
                ))}
              </select>
            </label>
            <label htmlFor="recipient">
              <span>받는 사람과 나의 관계</span>
              <input
                id="recipient"
                value={recipient}
                placeholder="예: 동아리 회장, 해외 고객, 친한 친구"
                onChange={(event) => {
                  setRecipient(event.target.value);
                  resetResult();
                }}
              />
            </label>
            <label htmlFor="purpose">
              <span>이번 메시지의 목적</span>
              <input
                id="purpose"
                value={purpose}
                placeholder="예: 일정 변경을 요청하고 싶어요"
                onChange={(event) => {
                  setPurpose(event.target.value);
                  resetResult();
                }}
              />
            </label>
          </div>

          <div className="format-row">
            <fieldset>
              <legend>보낼 곳</legend>
              <div className="channel-options">
                {(Object.keys(channelLabels) as MessageChannel[]).map((key) => (
                  <button key={key} type="button" aria-pressed={channel === key} className={channel === key ? "active" : ""} onClick={() => changeChannel(key)}>
                    {channelLabels[key]}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>결과 언어</legend>
              <div>
                {(Object.keys(languageLabels) as OutputLanguage[]).map((key) => (
                  <button key={key} type="button" aria-pressed={language === key} className={language === key ? "active" : ""} onClick={() => changeLanguage(key)}>
                    {languageLabels[key]}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </div>

        <div className="flow-section draft-section">
          <div className="flow-heading draft-heading">
            <span>02</span>
            <div>
              <p>DRAFT</p>
              <h2>보내려던 문장을 붙여 넣어주세요.</h2>
              <small>{language === "en" ? "한국어로 적어도 영문 형식으로 다시 구성해요." : "지금 보내려던 말을 그대로 적어도 괜찮아요."}</small>
            </div>
            <button type="button" className="example-button" onClick={fillExample}>예시로 보기</button>
          </div>

          <label className="message-field" htmlFor="message">
            <span className="sr-only">보내려던 문장</span>
            <textarea
              id="message"
              maxLength={1000}
              value={message}
              placeholder={channel === "email" ? "메일에 담고 싶은 내용을 편하게 적어주세요." : "지금 보내려던 말을 그대로 적어주세요."}
              onChange={(event) => {
                setMessage(event.target.value);
                resetResult();
              }}
            />
            <small>{message.length} / 1000</small>
          </label>

          <div className="check-action" aria-busy={isLoading}>
            <p>분석 결과는 결정을 대신하지 않고, 확인할 기준을 드려요.</p>
            <button type="button" disabled={!message.trim() || isLoading} onClick={runCheck}>
              {isLoading ? "AI가 점검하는 중..." : "AI로 메시지 점검하기"} {!isLoading && <span aria-hidden="true">→</span>}
            </button>
          </div>
          {errorMessage && <p className="error-message" role="alert">{errorMessage}</p>}
        </div>
      </section>

      {analyzed && analysis && (
        <section className="result-section" id="result" aria-live="polite">
          <div className="result-intro">
            <span className="section-number">02</span>
            <div>
              <p className="overline">REVIEW</p>
              <h2>{analysis.label}</h2>
              <p>{analysis.summary}</p>
            </div>
          </div>

          <div className="context-summary">
            <div><span>관계 유형</span><strong>{recipientCategoryLabels[recipientCategory]}</strong></div>
            <div><span>받는 사람</span><strong>{recipient.trim() || "입력하지 않음"}</strong></div>
            <div><span>목적</span><strong>{purpose.trim() || "입력하지 않음"}</strong></div>
            <div><span>보낼 곳</span><strong>{channelLabels[channel]}</strong></div>
            <div><span>언어</span><strong>{languageLabels[language]}</strong></div>
          </div>

          <div className="review-grid">
            <div className="finding-panel">
              <h3>확인할 부분</h3>
              <ol>
                {analysis.findings.map((finding, index) => (
                  <li key={`${finding.phrase}-${index}`}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div><strong>{finding.phrase}</strong><p>{finding.reason}</p></div>
                  </li>
                ))}
              </ol>
              {language === "en" && (
                <div className="language-note">
                  <strong>영문 작성 기준</strong>
                  <p>단어를 그대로 옮기기보다, 영어권 메일과 메시지에서 자연스러운 순서로 다시 구성했어요.</p>
                </div>
              )}
            </div>

            <div className="suggestion-panel">
              <div className="suggestion-heading">
                <div><h3>{channel === "email" ? "완성된 메일" : "대안 문장"}</h3><p>원문과 나란히 비교한 뒤 직접 고쳐서 사용하세요.</p></div>
                <span>AI 생성 · 직접 수정 가능</span>
              </div>

              <div className="option-list" role="tablist" aria-label="문장 유형 선택">
                {options.map((option, index) => (
                  <button type="button" role="tab" aria-selected={selectedOption === index} key={option.label} onClick={() => chooseOption(index)}>
                    <strong>{option.label}</strong><small>{option.note}</small>
                  </button>
                ))}
              </div>

              <div className="comparison-grid">
                <div className="original-message">
                  <div><span>원문</span><small>{message.length}자</small></div>
                  <p>{message}</p>
                </div>
                <label className="result-draft" htmlFor="edited-draft">
                  <span>{channel === "email" ? "메일 초안" : "수정 문장"}</span>
                  <textarea
                    id="edited-draft"
                    lang={language}
                    value={editedDraft}
                    onChange={(event) => {
                      setEditedDraft(event.target.value);
                      setCopied(false);
                      setShared(false);
                    }}
                  />
                </label>
              </div>

              <div className="result-actions">
                <button type="button" className="share-button" onClick={shareDraft}>{shared ? "공유했어요" : "앱으로 공유"}</button>
                <button type="button" className="copy-button" onClick={copyDraft}>{copied ? "복사했어요" : "전체 문장 복사"}</button>
              </div>
              <p className="share-note">휴대폰에서는 공유 창에서 카카오톡이나 Instagram을 선택할 수 있어요.</p>

              <div className="feedback-panel">
                <div>
                  <strong>이 결과가 도움이 됐나요?</strong>
                  <span>{feedback ? "응답이 저장됐어요." : "짧은 평가는 서비스 개선에만 사용해요."}</span>
                </div>
                <div role="group" aria-label="결과 만족도">
                  <button
                    type="button"
                    aria-pressed={feedback === "helpful"}
                    disabled={feedback !== null}
                    onClick={() => submitFeedback("helpful")}
                  >
                    도움됐어요
                  </button>
                  <button
                    type="button"
                    aria-pressed={feedback === "needs_improvement"}
                    disabled={feedback !== null}
                    onClick={() => submitFeedback("needs_improvement")}
                  >
                    아쉬워요
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="reset-button"
            onClick={() => {
              setRecipient("");
              setRecipientCategory("other");
              setPurpose("");
              setMessage("");
              resetResult();
              window.setTimeout(() => document.getElementById("main")?.scrollIntoView({ behavior: "smooth" }), 20);
            }}
          >
            새 메시지 작성하기
          </button>
        </section>
      )}

      <section className="criteria-section">
        <span className="section-number">03</span>
        <div><p className="overline">CHECKING POINTS</p><h2>문장보다 먼저<br />맥락을 확인해요.</h2></div>
        <dl>
          <div><dt>01. 관계</dt><dd>누가 받는 말인지</dd></div>
          <div><dt>02. 목적</dt><dd>어떤 답이나 행동을 원하는지</dd></div>
          <div><dt>03. 채널</dt><dd>카카오톡, DM, 이메일 중 어디로 보낼지</dd></div>
          <div><dt>04. 언어</dt><dd>한국어와 영어 중 무엇이 자연스러운지</dd></div>
        </dl>
      </section>

      <footer>
        <strong>보내도 돼?</strong>
        <p>성균관대학교 신인류 AI 사피엔스 · 기말 프로젝트</p>
        <span>원문과 이름은 저장하지 않고, 채널·관계 유형 같은 익명 통계만 DB와 Analytics에 기록합니다.</span>
      </footer>
    </main>
  );
}
