export type MessageChannel = "kakao" | "instagram" | "email";
export type OutputLanguage = "ko" | "en";

export type DraftOption = {
  label: string;
  note: string;
  text: string;
};

export type MessageAnalysis = {
  label: string;
  summary: string;
  findings: Array<{ phrase: string; reason: string }>;
};

export const channelLabels: Record<MessageChannel, string> = {
  kakao: "카카오톡",
  instagram: "Instagram DM",
  email: "이메일",
};

export const languageLabels: Record<OutputLanguage, string> = {
  ko: "한국어",
  en: "English",
};

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

export function englishSubject(purpose: string) {
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

export function makeDrafts(
  recipient: string,
  purpose: string,
  message: string,
  channel: MessageChannel,
  language: OutputLanguage,
): DraftOption[] {
  const cleanMessage = normalize(message);

  if (language === "en" && channel === "email") {
    const subject = englishSubject(purpose);
    const salutation = englishSalutation(recipient);
    const intent = englishIntent(purpose, message);
    return [
      { label: "원본", note: "입력한 문장 그대로", text: message.trim() },
      {
        label: "기본형",
        note: "Formal and complete",
        text: `Subject: ${subject}\n\n${salutation},\n\nI hope you are doing well. ${intent}\n\nI would appreciate it if you could let me know when convenient.\n\nBest regards,\n[Your name]`,
      },
      {
        label: "단호하게",
        note: "Direct with a clear request",
        text: `Subject: ${subject}\n\n${salutation},\n\n${intent}\n\nPlease let me know whether this is possible.\n\nBest,\n[Your name]`,
      },
      {
        label: "정중하게",
        note: "Considerate and formal",
        text: `Subject: ${subject}\n\n${salutation},\n\nI hope your week is going well. ${intent}\n\nIf possible, I would be grateful if you could let me know at your convenience. Thank you for considering my request.\n\nWarm regards,\n[Your name]`,
      },
    ];
  }

  if (language === "en") {
    const base = englishIntent(purpose, message);
    const name = isMostlyEnglish(recipient) ? normalize(recipient) : "there";
    if (channel === "instagram") {
      return [
        { label: "원본", note: "입력한 문장 그대로", text: message.trim() },
        { label: "기본형", note: "Short and conversational", text: `Hi ${name}! ${base} Let me know what you think when you get a chance.` },
        { label: "단호하게", note: "Clear and direct", text: `Hi ${name}, ${base} Please let me know if you are interested.` },
        { label: "정중하게", note: "Friendly and considerate", text: `Hey ${name}, hope you're doing well! ${base} No rush—I'd appreciate your thoughts when you have time.` },
      ];
    }
    return [
      { label: "원본", note: "입력한 문장 그대로", text: message.trim() },
      { label: "기본형", note: "Clear without sounding stiff", text: `Hi ${name}, ${base} When you have a moment, could you let me know what you think?` },
      { label: "단호하게", note: "Direct with a clear ask", text: `Hi ${name}, ${base} Please let me know whether this works for you.` },
      { label: "정중하게", note: "Adds more consideration", text: `Hi ${name}, I hope you are doing well. ${base} I would really appreciate your thoughts when you have time.` },
    ];
  }

  if (channel === "email") {
    const subject = purpose.trim() || "문의드립니다";
    const greeting = koreanRecipient(recipient);
    const body = endSentence(cleanMessage);
    return [
      { label: "원본", note: "입력한 문장 그대로", text: message.trim() },
      {
        label: "기본형",
        note: "제목부터 맺음말까지 갖춘 형식",
        text: `제목: ${subject}\n\n${greeting}.\n\n${body}\n\n확인 가능하실 때 답변 부탁드립니다.\n\n감사합니다.\n[이름]`,
      },
      {
        label: "단호하게",
        note: "요청과 원하는 답을 분명하게",
        text: `제목: ${subject}\n\n${greeting}.\n\n${shortenKorean(body)}\n\n가능 여부를 명확히 알려주시기 바랍니다.\n\n감사합니다.\n[이름]`,
      },
      {
        label: "정중하게",
        note: "상대의 상황을 고려한 표현",
        text: `제목: ${subject}\n\n${greeting}.\n\n${softenKorean(body)}\n\n바쁘시겠지만 편하실 때 확인 부탁드립니다.\n\n감사합니다.\n[이름]`,
      },
    ];
  }

  const softened = softenKorean(cleanMessage);
  if (channel === "instagram") {
    return [
      { label: "원본", note: "입력한 문장 그대로", text: message.trim() },
      { label: "기본형", note: "DM에 맞게 짧고 자연스럽게", text: softened },
      { label: "단호하게", note: "원하는 답을 분명하게", text: `${shortenKorean(softened)} 가능 여부를 알려주세요.` },
      { label: "정중하게", note: "갑작스러운 연락의 부담을 낮추기", text: `갑자기 DM드려 죄송합니다. ${softened} 편하실 때 답변 주시면 감사하겠습니다.` },
    ];
  }

  return [
    { label: "원본", note: "입력한 문장 그대로", text: message.trim() },
    { label: "기본형", note: "원래 말투를 유지하며 정리", text: softened },
    { label: "단호하게", note: "원하는 답을 분명하게", text: `${shortenKorean(softened)} 가능한지 알려줘.` },
    { label: "정중하게", note: "상대의 선택권을 남긴 표현", text: `${softened} 가능할 때 편하게 알려줘.` },
  ];
}

export function analyzeMessage(
  recipient: string,
  purpose: string,
  message: string,
  channel: MessageChannel,
  language: OutputLanguage,
): MessageAnalysis {
  const findings: MessageAnalysis["findings"] = [];

  if (!recipient.trim()) {
    findings.push({ phrase: "받는 사람 정보 없음", reason: "관계를 적으면 말투와 호칭을 더 정확히 정할 수 있어요." });
  }
  if (!purpose.trim()) {
    findings.push({ phrase: "목적이 비어 있음", reason: "원하는 답이나 행동을 한 문장으로 정해보세요." });
  }
  if (message.length > (channel === "email" ? 600 : channel === "instagram" ? 140 : 180)) {
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
    summary: channel === "email"
      ? `${languageLabels[language]} 이메일 형식에 맞춰 제목, 인사, 본문, 맺음말을 정리했어요.`
      : `${languageLabels[language]} ${channelLabels[channel]} 문장으로 자연스럽게 읽히도록 정리했어요.`,
    findings: findings.slice(0, 4),
  };
}
