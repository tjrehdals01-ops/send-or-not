"use client";

import { useMemo, useState } from "react";
import {
  analyzeMessage,
  channelLabels,
  englishSubject,
  languageLabels,
  makeDrafts,
  type MessageChannel,
  type OutputLanguage,
} from "../lib/message";

function track(event: string, detail?: Record<string, string>) {
  if (typeof window === "undefined") return;
  const target = window as Window & { dataLayer?: unknown[] };
  target.dataLayer = target.dataLayer || [];
  target.dataLayer.push({ event, ...detail });
}

export default function Home() {
  const [recipient, setRecipient] = useState("");
  const [purpose, setPurpose] = useState("");
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState<MessageChannel>("kakao");
  const [language, setLanguage] = useState<OutputLanguage>("ko");
  const [analyzed, setAnalyzed] = useState(false);
  const [selectedOption, setSelectedOption] = useState(1);
  const [editedDraft, setEditedDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const options = useMemo(
    () => makeDrafts(recipient, purpose, message, channel, language),
    [recipient, purpose, message, channel, language],
  );
  const analysis = useMemo(
    () => analyzeMessage(recipient, purpose, message, channel, language),
    [recipient, purpose, message, channel, language],
  );

  const resetResult = () => {
    setAnalyzed(false);
    setCopied(false);
    setShared(false);
  };

  const changeChannel = (next: MessageChannel) => {
    setChannel(next);
    resetResult();
    track("select_channel", { channel: next });
  };

  const changeLanguage = (next: OutputLanguage) => {
    setLanguage(next);
    resetResult();
    track("select_language", { language: next });
  };

  const fillExample = () => {
    if (language === "en" && channel === "email") {
      setRecipient("Professor Kim");
      setPurpose("Request a one-day assignment extension");
      setMessage("I want to ask if I can submit the assignment one day late because of a personal matter");
    } else if (language === "en" && channel === "instagram") {
      setRecipient("A creator I follow");
      setPurpose("Ask about a collaboration");
      setMessage("I want to ask if you are interested in working together on a small campus project");
    } else if (language === "en") {
      setRecipient("Project teammate");
      setPurpose("Ask to move tomorrow's meeting");
      setMessage("Can you move our meeting to Thursday? I have another appointment tomorrow");
    } else if (channel === "email") {
      setRecipient("담당 교수님");
      setPurpose("과제 제출 기한 하루 연장 요청");
      setMessage("개인 사정으로 과제 준비가 늦어져 하루 늦게 제출해도 괜찮을지 문의드립니다");
    } else if (channel === "instagram") {
      setRecipient("처음 연락하는 동아리 계정 운영자");
      setPurpose("행사 협업 가능 여부 문의");
      setMessage("안녕하세요 갑자기 DM드려서 죄송한데 이번 행사 때 같이 협업할 수 있을지 여쭤보고 싶어요");
    } else {
      setRecipient("같이 과제하는 팀원");
      setPurpose("회의 시간을 목요일로 변경 요청");
      setMessage("내일 다른 일정이 생겨서 그런데 혹시 회의를 목요일로 옮길 수 있을까?");
    }
    resetResult();
  };

  const runCheck = () => {
    if (!message.trim()) return;
    const drafts = makeDrafts(recipient, purpose, message, channel, language);
    setSelectedOption(1);
    setEditedDraft(drafts[1].text);
    setAnalyzed(true);
    setCopied(false);
    setShared(false);
    track("submit_message", { channel, language });
    window.setTimeout(() => document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const chooseOption = (index: number) => {
    setSelectedOption(index);
    setEditedDraft(options[index].text);
    setCopied(false);
    setShared(false);
    track("select_tone", { tone: options[index].label });
  };

  const copyDraft = async () => {
    await navigator.clipboard.writeText(editedDraft);
    setCopied(true);
    track("copy_message", { channel, language, tone: options[selectedOption].label });
  };

  const shareDraft = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: channel === "email" ? (language === "en" ? englishSubject(purpose) : purpose.trim() || "메일 초안") : undefined,
          text: editedDraft,
        });
        setShared(true);
        track("share_message", { channel, language });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await navigator.clipboard.writeText(editedDraft);
    setCopied(true);
  };

  return (
    <main>
      <header className="site-header">
        <a href="#main" className="brand" aria-label="보내도 돼 처음으로">보내도 돼?</a>
        <p>누구에게든, 보내기 전 한 번 더</p>
        <span>beta 0.3</span>
      </header>

      <div className="notice-bar">
        <span>입력한 문장은 저장하지 않아요.</span>
        <span>카카오톡·Instagram DM·이메일에 맞춰 정리해요.</span>
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

          <div className="check-action">
            <p>분석 결과는 결정을 대신하지 않고, 확인할 기준을 드려요.</p>
            <button type="button" disabled={!message.trim()} onClick={runCheck}>
              메시지 점검하기 <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>

      {analyzed && (
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
                <span>직접 수정 가능</span>
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
            </div>
          </div>

          <button
            type="button"
            className="reset-button"
            onClick={() => {
              setRecipient("");
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
        <span>입력 내용은 저장하지 않습니다.</span>
      </footer>
    </main>
  );
}
