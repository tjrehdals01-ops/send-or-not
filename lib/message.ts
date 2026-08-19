export type MessageChannel = "kakao" | "instagram" | "email";
export type OutputLanguage = "ko" | "en";
export type RecipientCategory =
  | "friend"
  | "colleague"
  | "professor_manager"
  | "family_partner"
  | "customer"
  | "new_contact"
  | "other";

export type ReviewRequest = {
  recipient: string;
  recipientCategory: RecipientCategory;
  purpose: string;
  message: string;
  channel: MessageChannel;
  language: OutputLanguage;
};

export type DraftOption = {
  label: "원본" | "기본형" | "단호하게" | "정중하게";
  note: string;
  text: string;
};

export type MessageAnalysis = {
  label: string;
  summary: string;
  findings: Array<{ phrase: string; reason: string }>;
};

export type ReviewResponse = {
  analysis: MessageAnalysis;
  options: DraftOption[];
  generatedBy: "groq";
  providerAttempts: number;
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

export const recipientCategoryLabels: Record<RecipientCategory, string> = {
  friend: "친구",
  colleague: "팀원·동료",
  professor_manager: "교수·상사",
  family_partner: "가족·연인",
  customer: "고객·거래처",
  new_contact: "처음 연락하는 사람",
  other: "기타",
};

export function emailShareTitle(purpose: string, language: OutputLanguage) {
  const cleanPurpose = purpose.replace(/\s+/g, " ").trim();
  if (language === "ko") return cleanPurpose || "메일 초안";
  const isAscii = [...cleanPurpose].every((character) => character.charCodeAt(0) <= 127);
  return isAscii && cleanPurpose ? cleanPurpose : "Email draft";
}

export function isReviewResponse(value: unknown): value is ReviewResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ReviewResponse>;
  return Boolean(
    candidate.analysis &&
    typeof candidate.analysis.label === "string" &&
    typeof candidate.analysis.summary === "string" &&
    Array.isArray(candidate.analysis.findings) &&
    Array.isArray(candidate.options) &&
    candidate.options.length === 4 &&
    candidate.options.every((option) => option && typeof option.text === "string") &&
    Number.isInteger(candidate.providerAttempts) &&
    Number(candidate.providerAttempts) >= 1,
  );
}
