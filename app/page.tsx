"use client";

import { useMemo, useState } from "react";

type MessageFormat = "chat" | "email";
type OutputLanguage = "ko" | "en";

type DraftOption = {
  label: string;
  note: string;
  text: string;
};

const formatLabels: Record<MessageFormat, string> = {
  chat: "메신저",
  email: "이메일",
};

const languageLabels: Record<OutputLanguage, string> = {
  ko: "한국어",
  en: "English",
};

function track(event: string, detail?: Record<string, string>) {
  if (typeof window === "undefined") return;
  const target = window as Window & { dataLayer?: unknown[] };
  target.dataLayer = target.dataLayer || [];
  target.dataLayer.push({ event, ...detail });
}

function normalize(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function isMostlyEnglish(text: string) {
  const letters = text.match(/[A-Za-z가-힣]/g) || [];
  const english = text.match(/[A-Za-z]/g) || [];
  return letters.length > 0 && english.length / letters.length > 0.65;
}

function endSentence(text: string) {
  const clean = normalize(text);
  if (!clean) return clean;
  return /[.!?]$/.test(clean) ? clean : `${clean}.`;
}

function polishEnglish(text: string) {
  return endSentence(text)
    .replace(/\bI want to\b/gi, "I would like to")
    .replace(/\bCan you\b/gi, "Could you")
    .replace(/\bASAP\b/g, "when convenient")
    .replace(/\bYou must\b/gi, "Could you please");
}

function englishSubject(purpose: string) {
  if (isMostlyEnglish(purpose)) return normalize(purpose).replace(/[.!?]+$/, "");
  if (/과제|제출|기한|연장/.test(purpose)) return "Request Regarding Assignment Submission";
  if (/면담|미팅|회의/.test(purpose)) return "Meeting Request";
  if (/일정|시간|날짜/.test(purpose)) return "Schedule Coordination";
  if (/지원|채용|면접/.test(purpose)) return "Follow-up Regarding My Application";
  if (/사과|미안/.test(purpose)) return "Apology and Follow-up";
  if (/감사|고마/.test(purpose)) return "Thank You";
  if (/문의|질문|확인/.test(purpose)) return "A Quick Question";
  return "Regarding Our Conversation";
}

function englishIntent(purpose: string, message: string) {
  if (isMostlyEnglish(message)) return polishEnglish(message);
  if (/과제|제출|기한|연장/.test(`${purpose} ${message}`)) {
    return "I am writing to ask whether a short extension on the assignment might be possible due to a personal matter.";
  }
  if (/면담|미팅|회의/.test(`${purpose} ${message}`)) {
    return "I am writing to ask if we could arrange a brief meeting at a time that works for you.";
  }
  if (/일정|시간|날짜/.test(`${purpose} ${message}`)) {
    return "I am writing to ask whether we could adjust the schedule to a time that works for both of us.";
  }
  if (/지원|채용|면접/.test(`${purpose} ${message}`)) {
    return "I am writing to follow up on my application and ask whether there are any updates you could share.";
  }
  if (/사과|미안/.test(`${purpose} ${message}`)) {
    return "I wanted to apologize for the situation and explain my circumstances more clearly.";
  }
  if (/감사|고마/.test(`${purpose} ${message}`)) {
    return "I wanted to thank you for your time and support.";
  }
  return "I am writing to share a brief update and ask for your thoughts when you have a moment.";
}

function englishSalutation(recipient: string) {
  const clean = normalize(recipient);
  if (!clean) return "Hello";
  if (isMostlyEnglish(clean)) return `Dear ${clean}`;
  if (/교수/.test(clean)) return "Dear Professor";
  if (/담당자|채용|인사/.test(clean)) return "Dear Hiring Team";
  if (/고객|클라이언트/.test(clean)) return "Dear Client";
  return "Hello";
}

function koreanRecipient(recipient: string) {
  const clean = normalize(recipient);
  if (!clean) return "안녕하세요";
  if (/님$|교수님$|선생님$/.test(clean)) return `${clean}, 안녕하세요`;
  return `${clean}님, 안녕하세요`;
}

function shortenKorean(text: string) {
  const clean = normalize(text);
  const sentences = clean.split(/(?<=[.!?。])\s+/).filter(Boolean);
  return sentences.slice(0, 2).join(" ") || clean;
}

function softenKorean(text: string) {
  return endSentence(text)
    .replace(/제발/g, "가능하다면")
    .replace(/당장/g, "가능한 때")
    .replace(/답장해/g, "확인되면 알려줘")
    .replace(/왜 안/g, "혹시 확인이 어려웠는지");
}

function makeDrafts(
  recipient: string,
  purpose: string,
  message: string,
  format: MessageFormat,
  language: OutputLanguage,
): DraftOption[] {
  const cleanMessage = normalize(message);

  if (language === "en" && format === "email") {
    const subject = englishSubject(purpose);
    const salutation = englishSalutation(recipient);
    const intent = englishIntent(purpose, message);
    return [
      {
        label: "Professional",
        note: "Formal and complete",
        text: `Subject: ${subject}\n\n${salutation},\n\nI hope you are doing well. ${intent}\n\nI would appreciate it if you could let me know when convenient.\n\nBest regards,\n[Your name]`,
      },
      {
        label: "Concise",
        note: "Short and direct",
        text: `Subject: ${subject}\n\n${salutation},\n\n${intent}\n\nThank you for your time.\n\nBest,\n[Your name]`,
      },
      {
        label: "Warm",
        note: "Polite and approachable",
        text: `Subject: ${subject}\n\n${salutation},\n\nI hope your week is going well. ${intent}\n\nThank you for considering my request. I look forward to hearing from you.\n\nWarm regards,\n[Your name]`,
      },
    ];
  }

  if (language === "en") {
    const base = englishIntent(purpose, message);
    const name = isMostlyEnglish(recipient) ? normalize(recipient) : "there";
    return [
      {
        label: "Natural",
        note: "Clear without sounding stiff",
        text: `Hi ${name}, ${base} When you have a moment, could you let me know what you think?`,
      },
      {
        label: "Concise",
        note: "Only the essential point",
        text: `${base} Please let me know when you can.`,
      },
      {
        label: "Polite",
        note: "Adds a little more consideration",
        text: `Hi ${name}, I hope you are doing well. ${base} I would really appreciate your thoughts when you have time.`,
      },
    ];
  }

  if (format === "email") {
    const subject = purpose.trim() || "문의드립니다";
    const greeting = koreanRecipient(recipient);
    const body = endSentence(cleanMessage);
    return [
      {
        label: "기본형",
        note: "제목부터 맺음말까지 갖춘 형식",
        text: `제목: ${subject}\n\n${greeting}.\n\n${body}\n\n확인 가능하실 때 답변 부탁드립니다.\n\n감사합니다.\n[이름]`,
      },
      {
        label: "간결하게",
        note: "용건과 요청을 바로 전달",
        text: `제목: ${subject}\n\n${greeting}.\n\n${shortenKorean(body)}\n\n가능 여부를 알려주시면 감사하겠습니다.\n\n[이름] 드림`,
      },
      {
        label: "조금 부드럽게",
        note: "부담을 낮춘 표현",
        text: `제목: ${subject}\n\n${greeting}.\n\n${softenKorean(body)}\n\n바쁘시겠지만 편하실 때 확인 부탁드립니다.\n\n감사합니다.\n[이름]`,
      },
    ];
  }

  const softened = softenKorean(cleanMessage);
  return [
    {
      label: "자연스럽게",
      note: "원래 말투를 최대한 유지",
      text: softened,
    },
    {
      label: "간결하게",
      note: "핵심만 남긴 표현",
      text: shortenKorean(softened),
    },
    {
      label: "조금 더 정중하게",
      note: "상대의 선택권을 남긴 표현",
      text: `${softened} 가능할 때 편하게 알려줘.`,
    },
  ];
}

function analyzeMessage(
  recipient: string,
  purpose: string,
  message: string,
  format: MessageFormat,
  language: OutputLanguage,
) {
  const findings: { phrase: string; reason: string }[] = [];

  if (!recipient.trim()) {
    findings.push({ phrase: "받는 사람 정보 없음", reason: "관계를 적으면 말투와 호칭을 더 정확히 정할 수 있어요." });
  }
  if (!purpose.trim()) {
    findings.push({ phrase: "목적이 비어 있음", reason: "원하는 답이나 행동을 한 문장으로 정해보세요." });
  }
  if (message.length > (format === "email" ? 600 : 180)) {
    findings.push({ phrase: "문장이 긴 편", reason: "핵심 요청이 묻히지 않도록 내용을 나누는 편이 좋아요." });
  }

  const checks = language === "en"
    ? [
        { words: ["ASAP", "immediately"], reason: "The timing may sound more demanding than intended." },
        { words: ["You must", "Why didn't"], reason: "This can sound accusatory. A request-focused sentence is clearer." },
        { words: ["!!!", "???"], reason: "Repeated punctuation can make the tone feel emotional." },
      ]
    : [
        { words: ["제발", "한 번만", "답장해"], reason: "상대에게 답을 재촉하는 느낌을 줄 수 있어요." },
        { words: ["아마", "것 같아", "상황 되면"], reason: "결론이 흐려져 상대가 뜻을 다르게 이해할 수 있어요." },
        { words: ["이해가 안 돼", "네 잘못", "맨날"], reason: "내용보다 비난으로 읽힐 가능성이 있어요." },
      ];

  for (const check of checks) {
    const phrase = check.words.find((word) => message.toLowerCase().includes(word.toLowerCase()));
    if (phrase) findings.push({ phrase, reason: check.reason });
  }

  if (language === "en" && !isMostlyEnglish(message)) {
    findings.push({ phrase: "영문으로 전환", reason: "직역보다 목적과 형식에 맞게 새로 구성한 문장을 제안해요." });
  }
  if (findings.length === 0) {
    findings.push({ phrase: "큰 위험 표현 없음", reason: "받는 사람, 목적, 요청이 서로 맞는지만 마지막으로 확인하세요." });
  }

  return {
    label: findings.length >= 3 ? "맥락을 조금 더 보완해보세요" : findings.length >= 2 ? "몇 군데만 다듬으면 돼요" : "보내도 괜찮아 보여요",
    summary: format === "email"
      ? `${languageLabels[language]} 이메일 형식에 맞춰 제목, 인사, 본문, 맺음말을 정리했어요.`
      : `${languageLabels[language]} 메신저 문장으로 자연스럽게 읽히도록 정리했어요.`,
    findings: findings.slice(0, 4),
  };
}

export default function Home() {
  const [recipient, setRecipient] = useState("");
  const [purpose, setPurpose] = useState("");
  const [message, setMessage] = useState("");
  const [format, setFormat] = useState<MessageFormat>("chat");
  const [language, setLanguage] = useState<OutputLanguage>("ko");
  const [analyzed, setAnalyzed] = useState(false);
  const [selectedOption, setSelectedOption] = useState(0);
  const [editedDraft, setEditedDraft] = useState("");
  const [copied, setCopied] = useState(false);

  const options = useMemo(
    () => makeDrafts(recipient, purpose, message, format, language),
    [recipient, purpose, message, format, language],
  );
  const analysis = useMemo(
    () => analyzeMessage(recipient, purpose, message, format, language),
    [recipient, purpose, message, format, language],
  );

  const resetResult = () => {
    setAnalyzed(false);
    setCopied(false);
  };

  const changeFormat = (next: MessageFormat) => {
    setFormat(next);
    resetResult();
    track("select_format", { format: next });
  };

  const changeLanguage = (next: OutputLanguage) => {
    setLanguage(next);
    resetResult();
    track("select_language", { language: next });
  };

  const fillExample = () => {
    if (language === "en" && format === "email") {
      setRecipient("Professor Kim");
      setPurpose("Request a one-day assignment extension");
      setMessage("I want to ask if I can submit the assignment one day late because of a personal matter");
    } else if (language === "en") {
      setRecipient("Project teammate");
      setPurpose("Ask to move tomorrow's meeting");
      setMessage("Can you move our meeting to Thursday? I have another appointment tomorrow");
    } else if (format === "email") {
      setRecipient("담당 교수님");
      setPurpose("과제 제출 기한 하루 연장 요청");
      setMessage("개인 사정으로 과제 준비가 늦어져 하루 늦게 제출해도 괜찮을지 문의드립니다");
    } else {
      setRecipient("같이 과제하는 팀원");
      setPurpose("회의 시간을 목요일로 변경 요청");
      setMessage("내일 다른 일정이 생겨서 그런데 혹시 회의를 목요일로 옮길 수 있을까?");
    }
    resetResult();
  };

  const runCheck = () => {
    if (!message.trim()) return;
    const drafts = makeDrafts(recipient, purpose, message, format, language);
    setSelectedOption(0);
    setEditedDraft(drafts[0].text);
    setAnalyzed(true);
    setCopied(false);
    track("submit_message", { format, language });
    window.setTimeout(() => document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const chooseOption = (index: number) => {
    setSelectedOption(index);
    setEditedDraft(options[index].text);
    setCopied(false);
    track("select_tone", { tone: options[index].label });
  };

  const copyDraft = async () => {
    await navigator.clipboard.writeText(editedDraft);
    setCopied(true);
    track("copy_message", { format, language, tone: options[selectedOption].label });
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
        <span>한국어와 영어, 메신저와 이메일을 지원해요.</span>
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
              <legend>보낼 형식</legend>
              <div>
                {(Object.keys(formatLabels) as MessageFormat[]).map((key) => (
                  <button key={key} type="button" aria-pressed={format === key} className={format === key ? "active" : ""} onClick={() => changeFormat(key)}>
                    {formatLabels[key]}
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
              placeholder={format === "email" ? "메일에 담고 싶은 내용을 편하게 적어주세요." : "지금 보내려던 말을 그대로 적어주세요."}
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
            <div><span>형식</span><strong>{formatLabels[format]}</strong></div>
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
                <div><h3>{format === "email" ? "완성된 메일" : "대안 문장"}</h3><p>가까운 표현을 고른 뒤 직접 고쳐서 사용하세요.</p></div>
                <span>직접 수정 가능</span>
              </div>

              <div className="option-list" role="tablist" aria-label="문장 유형 선택">
                {options.map((option, index) => (
                  <button type="button" role="tab" aria-selected={selectedOption === index} key={option.label} onClick={() => chooseOption(index)}>
                    <strong>{option.label}</strong><small>{option.note}</small>
                  </button>
                ))}
              </div>

              <label className="result-draft" htmlFor="edited-draft">
                <span>{format === "email" ? "메일 초안" : "보낼 문장"}</span>
                <textarea
                  id="edited-draft"
                  lang={language}
                  value={editedDraft}
                  onChange={(event) => {
                    setEditedDraft(event.target.value);
                    setCopied(false);
                  }}
                />
              </label>

              <div className="result-actions">
                <button type="button" className="copy-button" onClick={copyDraft}>{copied ? "복사했어요" : "전체 문장 복사"}</button>
              </div>
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
          <div><dt>03. 형식</dt><dd>메신저인지 공식 이메일인지</dd></div>
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
