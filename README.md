# 보내도 돼?

> 보내기 직전의 메시지를 상대, 목적, 채널에 맞게 다시 점검하는 커뮤니케이션 도구

![보내도 돼? 서비스 미리보기](./public/og.png)

**Live Demo:** [bonaedo-dwae.skku-boot5.chatgpt.site](https://bonaedo-dwae.skku-boot5.chatgpt.site)

성균관대학교 **신인류 AI 사피엔스** 기말 프로젝트입니다. 사용자가 실제 관계와 메시지 목적을 직접 입력하면, 카카오톡·Instagram DM·이메일에 맞는 문장 구조를 제안하고 원문과 결과를 한 화면에서 비교할 수 있습니다.

## 문제 정의

메시지는 내용이 같아도 받는 사람, 전달 채널, 원하는 결과에 따라 적절한 표현이 달라집니다. 이 프로젝트는 특정 인물이나 정해진 상황을 고르는 방식 대신, 사용자가 자신의 맥락을 직접 설명하도록 설계했습니다.

## 핵심 기능

- **자유로운 맥락 입력:** 받는 사람과의 관계와 메시지 목적을 직접 작성합니다.
- **채널별 문장 구성:** 카카오톡, Instagram DM, 이메일의 길이와 형식 차이를 반영합니다.
- **AI 맥락 분석:** OpenAI 모델이 관계, 목적, 채널, 원문을 함께 해석합니다.
- **한국어·영어 지원:** 한국어 메시지뿐 아니라 영문 메시지와 영문 이메일도 작성할 수 있습니다.
- **네 가지 결과 비교:** 원본, 기본형, 단호하게, 정중하게 중 원하는 표현을 선택합니다.
- **원문 대조:** 사용자가 입력한 문장과 수정 결과를 나란히 확인할 수 있습니다.
- **직접 편집과 공유:** 생성된 문장을 수정하고 복사하거나 모바일 공유 창으로 전달합니다.

## 사용 흐름

1. 받는 사람과 나의 관계를 입력합니다.
2. 이번 메시지에서 원하는 목적을 입력합니다.
3. 카카오톡, Instagram DM, 이메일 중 전달 채널을 선택합니다.
4. 한국어 또는 English를 선택하고 원문을 작성합니다.
5. 확인할 표현과 네 가지 대안 문장을 비교합니다.
6. 필요한 문장을 직접 수정한 뒤 복사하거나 공유합니다.

## 문장 유형

| 유형 | 생성 기준 |
| --- | --- |
| 원본 | 사용자가 입력한 문장을 그대로 보존 |
| 기본형 | 원래 의미를 유지하면서 자연스럽게 정리 |
| 단호하게 | 요청과 원하는 답을 명확하게 표현 |
| 정중하게 | 상대의 상황과 선택권을 고려해 표현 |

## 프로젝트 구조

```text
send-or-not/
├─ app/
│  ├─ api/rewrite/route.ts # OpenAI Responses API를 호출하는 서버 경로
│  ├─ page.tsx          # 입력, 비교, 편집, 공유 화면
│  ├─ globals.css       # 반응형 UI와 디자인 시스템
│  └─ layout.tsx        # 메타데이터와 소셜 미리보기
├─ lib/
│  └─ message.ts        # 클라이언트와 서버가 공유하는 타입과 검증 로직
├─ public/
│  └─ og.png            # GitHub 및 링크 공유용 대표 이미지
└─ tests/
   └─ rendered-html.test.mjs
```

## 기술 스택

- Next.js, React, TypeScript
- Vinext, Vite, Cloudflare Workers
- OpenAI Responses API, Structured Outputs
- Web Share API, Clipboard API
- Node.js Test Runner, ESLint

## 로컬 실행

Node.js 22.13.0 이상이 필요합니다.

```bash
git clone https://github.com/tjrehdals01-ops/send-or-not.git
cd send-or-not
npm install
copy .env.example .env.local
npm run dev
```

`.env.local`의 `OPENAI_API_KEY`에 본인의 서버용 API 키를 입력한 뒤, 개발 서버가 안내하는 로컬 주소를 브라우저에서 열면 됩니다. API 키는 `NEXT_PUBLIC_*` 변수나 클라이언트 코드에 넣지 않습니다.

## 검증 명령어

```bash
npm run build
npm run test
npm run lint
```

## 구현 방식과 범위

현재 버전은 브라우저가 `/api/rewrite` 서버 경로에 입력값을 전달하고, 서버가 OpenAI Responses API를 호출하는 구조입니다. API 키는 서버 환경 변수로만 관리하며 브라우저에 전달하지 않습니다.

AI는 다음 정보를 함께 해석합니다.

- 받는 사람과 사용자의 관계
- 메시지를 통해 얻고 싶은 결과
- 카카오톡, Instagram DM, 이메일의 형식 차이
- 한국어 또는 영어 출력 조건
- 원문에 포함된 압박감, 모호함, 비난 가능성

응답은 Structured Outputs의 JSON Schema로 제한하여 분석 결과와 세 가지 대안 문장을 항상 같은 데이터 구조로 받습니다. 원본은 AI가 수정하지 않고 그대로 보존합니다. OpenAI 요청에는 `store: false`를 지정합니다.

실제 서비스로 확장할 경우에는 다음 기능을 추가할 수 있습니다.

- 부적절하거나 공격적인 표현에 대한 안전성 점검
- 대표 시나리오 평가 데이터셋과 품질 지표 구축
- 공개 서비스용 요청 제한과 비용 관리
- 사용자 평가를 활용한 문장 추천 품질 개선
- 카카오톡·Instagram의 공식 공유 기능과 심화 연동

## 개인정보 안내

이 프로젝트는 입력한 메시지를 자체 데이터베이스에 저장하지 않습니다. 다만 결과 생성을 위해 메시지가 OpenAI API로 전송됩니다. 실제 개인정보나 민감한 내용을 입력하지 말고, 사용 전에는 생성된 문장을 직접 확인해야 합니다.
