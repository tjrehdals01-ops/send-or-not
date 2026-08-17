"use client";

import { useMemo, useState } from "react";

type ModeKey = "ex" | "professor" | "refusal" | "reply";
type MoodKey = "calm" | "emotional" | "drunk";

type Mode = {
  key: ModeKey;
  label: string;
  description: string;
  placeholder: string;
  example: string;
};

const modes: Mode[] = [
  {
    key: "ex",
    label: "전 연인에게 연락",
    description: "감정이 앞선 연락인지 확인해요.",
    placeholder: "지금 보내려는 말을 그대로 적어주세요.",
    example: "자니? 나 아직도 네 생각나는데… 한 번만 얘기하면 안 돼?",
  },
  {
    key: "professor",
    label: "교수님·선배에게 질문",
    description: "신원, 목적, 요청을 분명히 해요.",
    placeholder: "길게 적은 문장도 괜찮아요. 핵심부터 살펴볼게요.",
    example:
      "교수님 안녕하세요. 신인류 AI 사피엔스 수강 중인 김민수입니다. 개인 사정이 있어 과제를 하루 늦게 제출해도 괜찮을지 문의드립니다.",
  },
  {
    key: "refusal",
    label: "부탁이나 약속 거절",
    description: "예의는 지키고 뜻은 분명히 해요.",
    placeholder: "미안해서 돌려 말한 문장도 그대로 적어주세요.",
    example:
      "불러줘서 진짜 고마운데 이번 주는 이것저것 일이 좀 있어서 아마 어려울 것 같아. 다음에 상황 되면 다시 얘기하자!",
  },
  {
    key: "reply",
    label: "답하기 어려운 대화",
    description: "감정과 사실을 나눠서 정리해요.",
    placeholder: "답하기 막막한 메시지라면 초안 그대로 적어주세요.",
    example:
      "네가 그렇게 느낀 건 알겠는데 나도 나름의 이유가 있었고 계속 내 잘못이라고만 하는 건 솔직히 이해가 안 돼.",
  },
];

const moodLabels: Record<MoodKey, string> = {
  calm: "차분한 편",
  emotional: "감정이 큰 편",
  drunk: "술을 마심",
};

const rewriteOptions: Record<ModeKey, { label: string; note: string; text: string }[]> = {
  ex: [
    {
      label: "오늘은 보류",
      note: "감정이 가라앉은 뒤 다시 결정하기",
      text: "지금은 감정이 커서 바로 연락하지 않고, 내일 다시 생각해볼게.",
    },
    {
      label: "부담 없이",
      note: "답장을 재촉하지 않는 표현",
      text: "문득 생각나서 연락했어. 갑작스러웠다면 답하지 않아도 괜찮아.",
    },
    {
      label: "대화 제안",
      note: "상대에게 선택권을 남기는 표현",
      text: "괜찮다면 이번 주에 잠깐 이야기할 수 있을까? 불편하면 편하게 거절해도 돼.",
    },
  ],
  professor: [
    {
      label: "기본형",
      note: "신원, 용건, 질문 순서",
      text: "교수님 안녕하세요. 신인류 AI 사피엔스 수강생 김민수입니다. 개인 사정으로 과제를 하루 늦게 제출해도 되는지 문의드립니다. 가능 여부를 알려주시면 감사하겠습니다.",
    },
    {
      label: "간결하게",
      note: "바로 답할 수 있는 질문으로",
      text: "교수님 안녕하세요, 김민수입니다. 과제를 하루 늦게 제출할 수 있는지 문의드립니다. 어렵다면 기존 기한에 맞추겠습니다.",
    },
    {
      label: "사유 포함",
      note: "설명은 짧고 책임은 분명하게",
      text: "교수님 안녕하세요. 김민수입니다. 개인 사정으로 제출 준비가 늦어져 과제를 하루 연장할 수 있는지 여쭙습니다. 어려울 경우 기존 기한을 지키겠습니다.",
    },
  ],
  refusal: [
    {
      label: "부드럽게",
      note: "고마움은 남기고 기대는 줄이기",
      text: "불러줘서 고마워. 이번 주는 일정이 어려워서 함께하지 못할 것 같아. 즐거운 시간 보내!",
    },
    {
      label: "분명하게",
      note: "애매한 여지를 남기지 않기",
      text: "제안해줘서 고마워. 이번에는 참여하지 않을게. 이해해주면 고마워.",
    },
    {
      label: "짧게",
      note: "불필요한 설명을 덧붙이지 않기",
      text: "불러줘서 고마워. 이번에는 참석하기 어려워.",
    },
  ],
  reply: [
    {
      label: "대화 이어가기",
      note: "상대 감정을 먼저 인정하기",
      text: "네가 그렇게 느꼈다는 건 이해해. 내 입장도 차분히 설명하고 싶은데, 우리 감정이 가라앉은 뒤 이야기하면 좋겠어.",
    },
    {
      label: "경계 세우기",
      note: "동의하기 어려운 부분을 분명히 하기",
      text: "네 감정은 이해하지만 모든 책임이 내게 있다는 말에는 동의하기 어려워. 비난 없이 이야기할 수 있을 때 다시 대화하고 싶어.",
    },
    {
      label: "대화 멈추기",
      note: "지금 답하지 않겠다고 알리기",
      text: "지금은 감정적으로 답할 것 같아. 조금 정리한 뒤 다시 이야기할게.",
    },
  ],
};

function track(event: string, detail?: Record<string, string>) {
  if (typeof window === "undefined") return;
  const target = window as Window & { dataLayer?: unknown[] };
  target.dataLayer = target.dataLayer || [];
  target.dataLayer.push({ event, ...detail });
}

function analyzeMessage(mode: ModeKey, mood: MoodKey, message: string) {
  const findings: { phrase: string; reason: string }[] = [];
  const checks = [
    { words: ["자니", "보고 싶", "생각나"], reason: "외로운 순간의 감정이 결정에 크게 반영된 표현이에요." },
    { words: ["한 번만", "제발", "답장해"], reason: "상대에게 답을 재촉하는 느낌을 줄 수 있어요." },
    { words: ["아마", "것 같아", "상황 되면"], reason: "거절의 뜻이 흐려져 상대가 다시 기대할 수 있어요." },
    { words: ["이해가 안 돼", "네 잘못", "항상", "맨날"], reason: "내용보다 비난으로 읽힐 가능성이 있어요." },
  ];

  for (const check of checks) {
    const phrase = check.words.find((word) => message.includes(word));
    if (phrase) findings.push({ phrase, reason: check.reason });
  }

  if (message.length > 140) {
    findings.push({ phrase: "문장이 긴 편", reason: "상대가 답해야 할 핵심 질문이 묻힐 수 있어요." });
  }
  if (mode === "professor" && !message.includes("안녕하세요")) {
    findings.push({ phrase: "인사와 신원", reason: "첫 연락이라면 짧은 인사와 소속을 먼저 적는 편이 좋아요." });
  }
  if (mode === "ex" && mood !== "calm") {
    findings.unshift({
      phrase: mood === "drunk" ? "술을 마신 상태" : "감정이 큰 상태",
      reason: "지금의 확신이 내일도 같은지 확인할 시간이 필요해요.",
    });
  }
  if (findings.length === 0) {
    findings.push({ phrase: "뚜렷한 위험 표현 없음", reason: "보내기 전 원하는 답이 무엇인지만 다시 확인해보세요." });
  }

  const needsPause = mode === "ex" && mood !== "calm";
  const needsReview = findings.length >= 2 || mood === "drunk";

  if (needsPause) {
    return {
      key: "pause",
      label: "오늘은 보류를 권해요",
      summary: "문장보다 지금의 상태가 더 큰 변수예요. 내일 같은 마음인지 먼저 확인해보세요.",
      findings: findings.slice(0, 3),
    };
  }
  if (needsReview) {
    return {
      key: "review",
      label: "조금 다듬고 보내세요",
      summary: "뜻은 충분히 전달돼요. 다만 아래 표현을 정리하면 오해를 줄일 수 있어요.",
      findings: findings.slice(0, 3),
    };
  }
  return {
    key: "ready",
    label: "보내도 괜찮아 보여요",
    summary: "큰 위험 신호는 없어요. 마지막으로 받는 사람과 목적이 맞는지만 확인하세요.",
    findings: findings.slice(0, 3),
  };
}

export default function Home() {
  const [mode, setMode] = useState<ModeKey>("ex");
  const [mood, setMood] = useState<MoodKey>("emotional");
  const [message, setMessage] = useState("");
  const [purpose, setPurpose] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [selectedOption, setSelectedOption] = useState(0);
  const [editedDraft, setEditedDraft] = useState(rewriteOptions.ex[0].text);
  const [copied, setCopied] = useState(false);
  const [held, setHeld] = useState(false);

  const activeMode = modes.find((item) => item.key === mode) || modes[0];
  const options = rewriteOptions[mode];
  const analysis = useMemo(() => analyzeMessage(mode, mood, message), [mode, mood, message]);

  const resetResult = () => {
    setAnalyzed(false);
    setCopied(false);
    setHeld(false);
  };

  const selectMode = (nextMode: ModeKey) => {
    setMode(nextMode);
    setSelectedOption(0);
    setEditedDraft(rewriteOptions[nextMode][0].text);
    resetResult();
    track("select_situation", { situation: nextMode });
  };

  const runCheck = () => {
    if (!message.trim()) return;
    setAnalyzed(true);
    setSelectedOption(0);
    setEditedDraft(options[0].text);
    setCopied(false);
    setHeld(false);
    track("submit_message", { situation: mode, mood });
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
    track("copy_message", { situation: mode, tone: options[selectedOption].label });
  };

  const chooseHold = () => {
    setHeld(true);
    track("choose_hold", { situation: mode });
  };

  return (
    <main>
      <header className="site-header">
        <a href="#main" className="brand" aria-label="보내도 돼 처음으로">
          보내도 돼?
        </a>
        <p>메시지를 보내기 전, 잠깐 생각할 시간을 만드는 도구</p>
        <span>beta 0.2</span>
      </header>

      <div className="notice-bar">
        <span>입력한 문장은 저장하지 않아요.</span>
        <span>로그인 없이 바로 사용할 수 있어요.</span>
      </div>

      <section className="intro" id="main">
        <div className="intro-index">01</div>
        <div>
          <p className="overline">보내기 전 확인</p>
          <h1>지금 보내려는 말을<br />한 번 같이 볼게요.</h1>
          <p className="intro-copy">맞춤법보다 중요한 건, 이 말을 왜 지금 보내려는지예요.</p>
        </div>
      </section>

      <section className="workbench" aria-label="메시지 검토 입력">
        <aside className="scenario-panel">
          <div className="panel-label">어떤 상황인가요?</div>
          <nav aria-label="상황 선택">
            {modes.map((item, index) => (
              <button
                type="button"
                key={item.key}
                className={mode === item.key ? "active" : ""}
                aria-pressed={mode === item.key}
                onClick={() => selectMode(item.key)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </div>
              </button>
            ))}
          </nav>
        </aside>

        <div className="composer-panel">
          <div className="composer-title">
            <div>
              <span>선택한 상황</span>
              <strong>{activeMode.label}</strong>
            </div>
            <button
              type="button"
              onClick={() => {
                setMessage(activeMode.example);
                resetResult();
              }}
            >
              예시 문장으로 보기
            </button>
          </div>

          <label className="message-field" htmlFor="message">
            <span>보내려는 문장</span>
            <textarea
              id="message"
              maxLength={500}
              value={message}
              placeholder={activeMode.placeholder}
              onChange={(event) => {
                setMessage(event.target.value);
                resetResult();
              }}
            />
            <small>{message.length} / 500</small>
          </label>

          <div className="context-fields">
            <label className="purpose-field" htmlFor="purpose">
              <span>이 말을 보내는 이유 <em>선택</em></span>
              <input
                id="purpose"
                value={purpose}
                placeholder="예: 답을 받고 싶어서, 일정을 조율하려고"
                onChange={(event) => setPurpose(event.target.value)}
              />
            </label>

            <fieldset className="mood-field">
              <legend>지금 내 상태</legend>
              <div>
                {(Object.keys(moodLabels) as MoodKey[]).map((key) => (
                  <button
                    type="button"
                    key={key}
                    className={mood === key ? "active" : ""}
                    aria-pressed={mood === key}
                    onClick={() => {
                      setMood(key);
                      resetResult();
                    }}
                  >
                    {moodLabels[key]}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="check-action">
            <p>이 결과는 결정 대신 참고할 수 있는 기준을 드려요.</p>
            <button type="button" onClick={runCheck} disabled={!message.trim()}>
              문장 확인하기 <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
      </section>

      {analyzed && (
        <section className="result-section" id="result" aria-live="polite">
          <div className="result-heading">
            <span className="section-number">02</span>
            <div>
              <p className="overline">검토 결과</p>
              <h2>{analysis.label}</h2>
              <p>{analysis.summary}</p>
            </div>
            <div className={`result-status ${analysis.key}`}>{analysis.key === "pause" ? "보류 권장" : analysis.key === "review" ? "수정 권장" : "전송 가능"}</div>
          </div>

          <div className="review-grid">
            <div className="finding-panel">
              <h3>먼저 확인할 부분</h3>
              <ol>
                {analysis.findings.map((finding, index) => (
                  <li key={`${finding.phrase}-${index}`}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <strong>{finding.phrase}</strong>
                      <p>{finding.reason}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="purpose-note">
                <span>내가 원하는 결과</span>
                <p>{purpose.trim() || "아직 적지 않았어요. 상대가 어떤 답을 주길 바라는지 먼저 정해보세요."}</p>
              </div>
            </div>

            <div className="suggestion-panel">
              <div className="suggestion-heading">
                <div>
                  <h3>대안 문장</h3>
                  <p>가까운 표현을 고른 뒤 내 말투로 직접 고쳐보세요.</p>
                </div>
                <span>수정 가능</span>
              </div>

              <div className="option-list" role="tablist" aria-label="대안 문장 선택">
                {options.map((option, index) => (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selectedOption === index}
                    key={option.label}
                    onClick={() => chooseOption(index)}
                  >
                    <span>{option.label}</span>
                    <small>{option.note}</small>
                  </button>
                ))}
              </div>

              <label className="draft-field" htmlFor="edited-draft">
                <span>내가 보낼 문장</span>
                <textarea
                  id="edited-draft"
                  value={editedDraft}
                  onChange={(event) => {
                    setEditedDraft(event.target.value);
                    setCopied(false);
                  }}
                />
              </label>

              <div className="result-actions">
                <button className="secondary-action" type="button" onClick={chooseHold}>
                  오늘은 보내지 않기
                </button>
                <button className="primary-action" type="button" onClick={copyDraft}>
                  {copied ? "복사했어요" : "문장 복사하기"}
                </button>
              </div>

              {held && (
                <div className="hold-note">
                  <strong>오늘은 여기서 멈췄어요.</strong>
                  <p>원문은 저장되지 않았어요. 내일도 같은 마음이라면 그때 다시 확인해보세요.</p>
                </div>
              )}
            </div>
          </div>

          <button
            className="reset-button"
            type="button"
            onClick={() => {
              setMessage("");
              setPurpose("");
              resetResult();
              window.setTimeout(() => document.getElementById("main")?.scrollIntoView({ behavior: "smooth" }), 20);
            }}
          >
            다른 문장 확인하기
          </button>
        </section>
      )}

      <section className="criteria-section">
        <span className="section-number">03</span>
        <div>
          <p className="overline">우리가 보는 기준</p>
          <h2>좋은 문장보다<br />덜 후회할 선택.</h2>
        </div>
        <dl>
          <div>
            <dt>01. 시점</dt>
            <dd>왜 하필 지금 보내려는지</dd>
          </div>
          <div>
            <dt>02. 목적</dt>
            <dd>상대에게 어떤 답을 원하는지</dd>
          </div>
          <div>
            <dt>03. 여지</dt>
            <dd>상대가 선택할 공간이 남아 있는지</dd>
          </div>
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
