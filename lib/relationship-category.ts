// 사용자가 자유롭게 입력한 관계 텍스트("전 여자친구", "3년 사귄 전 연인" 등)를
// 비슷한 결끼리 묶어주는 규칙 기반 분류기. AI 호출 없이 키워드 매칭만 사용해서
// 빠르고, 원문(raw relationship)은 그대로 두고 분류 결과만 별도로 계산함.
//
// 새로운 관계 표현이 자꾸 "기타"로 빠진다면, 아래 RULES에 키워드만 추가하면 됨.

export type RelationshipCategory =
  | "전 연인"
  | "학교 (교수님·선배)"
  | "직장"
  | "가족"
  | "친구"
  | "기타";

type Rule = { category: RelationshipCategory; keywords: string[] };

const RULES: Rule[] = [
  {
    category: "전 연인",
    keywords: [
      "전 여자친구", "전여친", "전 남자친구", "전남친",
      "전 연인", "전애인", "전 애인", "헤어진", "예전 애인",
      "옛 연인", "옛애인", "짝사랑", "전 여친", "전 남친",
    ],
  },
  {
    category: "학교 (교수님·선배)",
    keywords: [
      "교수", "지도교수", "조교", "선생님", "선배", "동아리",
      "과제", "학과", "조원", "팀플",
    ],
  },
  {
    category: "직장",
    keywords: [
      "상사", "팀장", "대표", "부장", "과장", "사수", "동료",
      "직장", "회사", "클라이언트", "거래처", "인턴", "면접관",
    ],
  },
  {
    category: "가족",
    keywords: [
      "부모님", "엄마", "아빠", "어머니", "아버지", "형", "누나",
      "언니", "오빠", "동생", "삼촌", "이모", "고모", "가족",
    ],
  },
  {
    category: "친구",
    keywords: ["친구", "베프", "지인", "동기"],
  },
];

export function categorizeRelationship(raw: string): RelationshipCategory {
  const text = raw.trim();
  if (!text) return "기타";

  for (const rule of RULES) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return rule.category;
    }
  }
  return "기타";
}
