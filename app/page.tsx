"use client";

import { useMemo, useState } from "react";

type ModeKey = "ex" | "professor" | "refusal" | "reply";
type MoodKey = "calm" | "emotional" | "drunk";

type Mode = {
  key: ModeKey;
  number: string;
  label: string;
  short: string;
  prompt: string;
  example: string;
};

const modes: Mode[] = [
  {
    key: "ex",
    number: "01",
    label: "전 연인",
    short: "술 마시고 연락",
    prompt: "지금 보내려는 말을 그대로 붙여 넣어도 돼요.",
    example: "자니? 나 아직도 네 생각나는데… 한 번만 얘기하면 안 돼?",
  },
  {
    key: "professor",
    number: "02",
    label: "교수님 · 선배",
    short: "요청과 질문",
    prompt: "길게 고민한 문장도 괜찮아요. 핵심 질문부터 찾아볼게요.",
    example:
      "교수님 안녕하세요. 신인류 AI 사피엔스 수강 중인 김민수입니다. 과제 제출 기한과 관련해서 개인적인 사정이 있어 혹시 하루 정도 늦게 제출해도 괜찮을지 문의드립니다.",
  },
  {
    key: "refusal",
    number: "03",
    label: "거절",
    short: "약속과 부탁",
    prompt: "미안해서 돌려 말한 문장을 붙여 넣어 보세요.",
    example:
      "불러줘서 진짜 고마운데 이번 주는 이것저것 일이 좀 있어서 아마 어려울 것 같아. 다음에 상황 되면 다시 얘기하자!",
  },
  {
    key: "reply",
    number: "04",
    label: "어려운 대답",
    short: "갈등과 해명",
    prompt: "답하기 막막한 상황이라면 초안 그대로 적어 주세요.",
    example:
      "네가 그렇게 느낀 건 알겠는데 나도 나름의 이유가 있었고 계속 내 잘못이라고만 하는 건 솔직히 이해가 안 돼.",
  },
];

const moodLabels: Record<MoodKey, string> = {
  calm: "차분함",
  emotional: "감정이 큼",
  drunk: "술을 마심",
};

const rewrites: Record<ModeKey, { label: string; note: string; text: string }[]> = {
  ex: [
    {
      label: "오늘은 보류",
      note: "가장 후회가 적은 선택",
      text: "지금은 감정이 커서 바로 연락하지 않고, 내일 다시 생각해볼게.",
    },
    {
      label: "짧게 확인",
      note: "답을 재촉하지 않게",
      text: "문득 생각나서 연락했어. 갑작스러웠다면 답하지 않아도 괜찮아.",
    },
    {
      label: "대화 요청",
      note: "상대의 선택권을 남기게",
      text: "괜찮다면 이번 주에 잠깐 이야기할 수 있을까? 불편하면 편하게 거절해도 돼.",
    },
  ],
  professor: [
    {
      label: "정중하게",
      note: "신원·목적·질문을 한 번에",
      text: "교수님 안녕하세요. 신인류 AI 사피엔스 수강생 김민수입니다. 개인 사정으로 과제를 하루 늦게 제출해도 되는지 문의드립니다. 가능 여부를 알려주시면 감사하겠습니다.",
    },
    {
      label: "간결하게",
      note: "바로 답할 수 있는 질문으로",
      text: "교수님 안녕하세요, 김민수입니다. 과제를 하루 늦게 제출할 수 있는지 문의드립니다. 불가하다면 기존 기한에 맞추겠습니다.",
    },
    {
      label: "설명 포함",
      note: "사유는 짧고 책임은 분명하게",
      text: "교수님 안녕하세요. 김민수입니다. 개인 사정으로 제출 준비가 늦어져 과제를 하루 연장할 수 있는지 여쭙습니다. 어려울 경우 기존 기한을 지키겠습니다.",
    },
  ],
  refusal: [
    {
      label: "부드럽게",
      note: "고마움은 남기고 기대는 줄이게",
      text: "불러줘서 고마워. 이번 주는 일정이 어려워서 함께하지 못할 것 같아. 즐거운 시간 보내!",
    },
    {
      label: "분명하게",
      note: "애매한 여지를 남기지 않게",
      text: "제안해줘서 고마워. 이번에는 참여하지 않을게. 이해해주면 고마워.",
    },
    {
      label: "짧게",
      note: "설명을 덧붙이지 않게",
      text: "불러줘서 고마워. 이번에는 어려워서 참석하지 못해.",
    },
  ],
  reply: [
    {
      label: "부드럽게",
      note: "상대 감정을 먼저 인정하게",
      text: "네가 그렇게 느꼈다는 건 이해해. 내 입장도 차분히 설명하고 싶은데, 우리 감정이 가라앉은 뒤 이야기하면 좋겠어.",
    },
    {
      label: "단호하게",
      note: "대화의 경계를 분명하게",
      text: "네 감정은 이해하지만 모든 책임이 내게 있다는 말에는 동의하기 어려워. 비난 없이 이야기할 수 있을 때 다시 대화하고 싶어.",
    },
    {
      label: "짧게",
      note: "지금 답을 멈추게",
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

function getAnalysis(mode: ModeKey, mood: MoodKey, message: string) {
  const signals: { phrase: string; reason: string }[] = [];
  const checks = [
    { words: ["자니", "보고 싶", "생각나"], reason: "감정이 큰 순간의 충동적인 표현이에요." },
    { words: ["한 번만", "제발", "답장해"], reason: "상대에게 답을 재촉하는 느낌을 줄 수 있어요." },
    { words: ["아마", "것 같아", "다음에 상황 되면"], reason: "결정이 모호해 상대가 다시 기대할 수 있어요." },
    { words: ["이해가 안 돼", "네 잘못", "항상", "맨날"], reason: "대화를 해결보다 방어로 이끌 수 있어요." },
  ];

  checks.forEach((check) => {
    const found = check.words.find((word) => message.includes(word));
    if (found) signals.push({ phrase: found, reason: check.reason });
  });

  if (message.length > 130) {
    signals.push({ phrase: "긴 문장", reason: "핵심 질문이나 결론이 묻힐 수 있어요." });
  }
  if (mode === "professor" && !message.includes("안녕하세요")) {
    signals.push({ phrase: "인사 없음", reason: "첫 연락이라면 짧은 인사와 신원을 먼저 적는 편이 좋아요." });
  }
  if (mode === "ex" && mood !== "calm") {
    signals.unshift({
      phrase: mood === "drunk" ? "술을 마신 상태" : "감정이 큰 상태",
      reason: "지금의 확신이 내일도 같을지 확인할 시간이 필요해요.",
    });
  }
  if (signals.length === 0) {
    signals.push({ phrase: "큰 위험 신호 없음", reason: "다만 보내기 전 목적과 원하는 답을 한 번 확인해 보세요." });
  }

  const score = Math.min(
    96,
    35 + signals.length * 14 + (mode === "ex" ? 10 : 0) + (mood === "drunk" ? 20 : mood === "emotional" ? 8 : 0),
  );

  return {
    score,
    level: score >= 75 ? "높음" : score >= 55 ? "주의" : "낮음",
    signals: signals.slice(0, 3),
  };
}

export default function Home() {
  const [mode, setMode] = useState<ModeKey>("ex");
  const [mood, setMood] = useState<MoodKey>("emotional");
  const [message, setMessage] = useState("");
  const [purpose, setPurpose] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [tone, setTone] = useState(0);
  const [copied, setCopied] = useState(false);
  const [held, setHeld] = useState(false);

  const selectedMode = modes.find((item) => item.key === mode) || modes[0];
  const analysis = useMemo(() => getAnalysis(mode, mood, message), [mode, mood, message]);
  const options = rewrites[mode];

  const chooseMode = (nextMode: ModeKey) => {
    setMode(nextMode);
    setAnalyzed(false);
    setHeld(false);
    setTone(0);
    track("select_situation", { situation: nextMode });
  };

  const fillExample = () => {
    setMessage(selectedMode.example);
    setAnalyzed(false);
  };

  const submit = () => {
    if (!message.trim()) return;
    setAnalyzed(true);
    setHeld(false);
    setCopied(false);
    track("submit_message", { situation: mode, mood });
    window.setTimeout(() => document.getElementById("result")?.scrollIntoView({ behavior: "smooth" }), 80);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(options[tone].text);
    setCopied(true);
    track("copy_message", { situation: mode, tone: options[tone].label });
  };

  const hold = () => {
    setHeld(true);
    track("choose_hold", { situation: mode });
  };

  return (
    <main>
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="보내도 돼 처음으로">
          보내도 돼?
        </a>
        <span className="prototype-tag">PROTOTYPE 01</span>
      </header>

      <section className="hero" id="top">
        <p className="eyebrow">SEND OR HOLD · 전송 전 30초</p>
        <h1>
          그 말,
          <br />
          <span>지금 보내도 돼?</span>
        </h1>
        <p className="hero-copy">
          문장을 그럴듯하게 바꾸는 대신,
          <br className="mobile-break" /> 보내고 후회할 가능성을 먼저 확인합니다.
        </p>
        <a className="start-link" href="#checker" onClick={() => track("start_check")}>
          바로 확인하기 <span aria-hidden="true">↓</span>
        </a>
      </section>

      <section className="checker" id="checker">
        <div className="section-heading">
          <span>01</span>
          <div>
            <p>상황 선택</p>
            <h2>누구에게 보내는 말인가요?</h2>
          </div>
        </div>

        <div className="mode-grid" role="group" aria-label="메시지 상황 선택">
          {modes.map((item) => (
            <button
              className={`mode-button ${mode === item.key ? "active" : ""}`}
              key={item.key}
              type="button"
              aria-pressed={mode === item.key}
              onClick={() => chooseMode(item.key)}
            >
              <span>{item.number}</span>
              <strong>{item.label}</strong>
              <small>{item.short}</small>
            </button>
          ))}
        </div>

        <div className="compose-area">
          <div className="compose-heading">
            <div>
              <label htmlFor="message">보내려는 문장</label>
              <p>{selectedMode.prompt}</p>
            </div>
            <button className="text-button" type="button" onClick={fillExample}>
              예시 넣기
            </button>
          </div>
          <textarea
            id="message"
            value={message}
            maxLength={500}
            placeholder="여기에 메시지를 붙여 넣으세요."
            onChange={(event) => {
              setMessage(event.target.value);
              setAnalyzed(false);
            }}
          />
          <div className="counter">{message.length} / 500</div>

          <div className="context-row">
            <div className="field-group">
              <label htmlFor="purpose">이 말을 보내는 목적</label>
              <input
                id="purpose"
                type="text"
                value={purpose}
                placeholder="예: 답을 받고 싶음, 일정 조율"
                onChange={(event) => setPurpose(event.target.value)}
              />
            </div>
            <fieldset className="field-group mood-group">
              <legend>지금 내 상태</legend>
              <div>
                {(Object.keys(moodLabels) as MoodKey[]).map((key) => (
                  <button
                    type="button"
                    key={key}
                    className={mood === key ? "selected" : ""}
                    onClick={() => setMood(key)}
                    aria-pressed={mood === key}
                  >
                    {moodLabels[key]}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="submit-row">
            <p>입력한 원문은 저장하지 않습니다.</p>
            <button className="primary-button" type="button" onClick={submit} disabled={!message.trim()}>
              보내기 전 확인 <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>

      {analyzed && (
        <section className="result" id="result" aria-live="polite">
          <div className="section-heading light">
            <span>02</span>
            <div>
              <p>전송 전 점검</p>
              <h2>지금은 한 번 멈추는 편이 좋아요.</h2>
            </div>
          </div>

          <div className="risk-summary">
            <div className="risk-score">
              <span>후회 위험</span>
              <strong>{analysis.level}</strong>
              <div className="risk-bar" aria-label={`후회 위험도 ${analysis.score}점`}>
                <i style={{ width: `${analysis.score}%` }} />
              </div>
              <small>{analysis.score} / 100</small>
            </div>
            <ol className="signal-list">
              {analysis.signals.map((signal, index) => (
                <li key={`${signal.phrase}-${index}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{signal.phrase}</strong>
                    <p>{signal.reason}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rewrite-section">
            <div className="rewrite-title">
              <p>대신 이렇게 보내볼 수 있어요.</p>
              <span>원하는 온도를 선택하세요.</span>
            </div>
            <div className="tone-tabs" role="tablist" aria-label="대안 문장 선택">
              {options.map((option, index) => (
                <button
                  key={option.label}
                  type="button"
                  role="tab"
                  aria-selected={tone === index}
                  onClick={() => {
                    setTone(index);
                    setCopied(false);
                    track("select_tone", { tone: option.label });
                  }}
                >
                  <strong>{option.label}</strong>
                  <small>{option.note}</small>
                </button>
              ))}
            </div>
            <div className="rewrite-card">
              <span className="quote-mark" aria-hidden="true">“</span>
              <p>{options[tone].text}</p>
              <div>
                <button className="copy-button" type="button" onClick={copy}>
                  {copied ? "복사했어요" : "이 문장 복사"}
                </button>
                <button className="hold-button" type="button" onClick={hold}>
                  지금은 안 보내기
                </button>
              </div>
            </div>
          </div>

          {held && (
            <div className="hold-confirmation">
              <span aria-hidden="true">✓</span>
              <div>
                <strong>좋은 선택이에요. 오늘은 여기까지만.</strong>
                <p>원문을 저장하지 않았어요. 내일도 같은 마음이라면 그때 다시 확인해 보세요.</p>
              </div>
            </div>
          )}

          <button
            className="restart-button"
            type="button"
            onClick={() => {
              setAnalyzed(false);
              setMessage("");
              setPurpose("");
              window.scrollTo({ top: document.getElementById("checker")?.offsetTop || 0, behavior: "smooth" });
            }}
          >
            다른 문장 확인하기 ↗
          </button>
        </section>
      )}

      <section className="principle">
        <p>우리의 기준</p>
        <blockquote>
          “더 잘 쓴 문장”보다
          <br />
          <span>“덜 후회할 선택”</span>
        </blockquote>
        <div>
          <span>원문 미저장</span>
          <span>로그인 없음</span>
          <span>보류도 성공</span>
        </div>
      </section>

      <footer>
        <strong>보내도 돼?</strong>
        <p>성균관대학교 신인류 AI 사피엔스 · 기말 프로젝트 초안</p>
        <span>2026</span>
      </footer>
    </main>
  );
}
