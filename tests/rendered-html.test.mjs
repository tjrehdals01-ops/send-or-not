import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the context-first message checker", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="ko">/);
  assert.match(html, /누구에게, 왜 보내는지부터/);
  assert.match(html, /받는 사람과 나의 관계/);
  assert.match(html, /이번 메시지의 목적/);
  assert.match(html, /결과 언어/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/);
});

test("supports custom context, three channels, comparison, and two languages", async () => {
  const [page, messageModule, apiRoute, eventRoute, dbSchema, hosting, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/message.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/rewrite/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/events/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(messageModule, /type MessageChannel = "kakao" \| "instagram" \| "email"/);
  assert.match(messageModule, /type OutputLanguage = "ko" \| "en"/);
  assert.match(page, /Professor Kim/);
  assert.match(apiRoute, /email includes a useful subject/);
  assert.match(page, /comparison-grid/);
  assert.match(page, /navigator\.share/);
  assert.match(page, /fetch\("\/api\/rewrite"/);
  for (const label of ["원본", "기본형", "단호하게", "정중하게"]) {
    assert.match(apiRoute, new RegExp(`label: "${label}"`));
  }
  assert.match(page, /입력한 문장은 AI 결과 생성에만 사용해요/);
  assert.match(apiRoute, /https:\/\/api\.groq\.com\/openai\/v1\/chat\/completions/);
  assert.match(apiRoute, /process\.env\.GROQ_API_KEY/);
  assert.match(apiRoute, /openai\/gpt-oss-20b/);
  assert.match(apiRoute, /type: "json_schema"/);
  assert.match(apiRoute, /MAX_PROVIDER_ATTEMPTS = 3/);
  assert.match(apiRoute, /retryDelay/);
  assert.match(apiRoute, /providerAttempts/);
  assert.match(apiRoute, /rate_limited/);
  assert.match(apiRoute, /provider_rejected/);
  assert.doesNotMatch(messageModule, /makeDrafts|analyzeMessage/);
  assert.match(layout, /og\.png/);
  assert.match(layout, /GA_MEASUREMENT_ID/);
  assert.match(layout, /googletagmanager\.com\/gtag\/js/);
  assert.match(page, /message_review_completed/);
  assert.match(page, /message_review_error/);
  assert.match(page, /review_started/);
  assert.match(page, /review_retry/);
  assert.match(page, /reviewId \? reviewAttempt \+ 1 : 1/);
  assert.match(page, /provider_attempts/);
  assert.match(page, /result_feedback/);
  assert.match(page, /share_message/);
  assert.match(page, /도움됐어요/);
  assert.match(page, /아쉬워요/);
  assert.match(page, /fetch\("\/api\/events"/);
  assert.match(messageModule, /type RecipientCategory/);
  assert.match(page, /recipientCategoryLabels/);
  assert.match(page, /message_length_bucket/);
  assert.match(page, /output_language/);
  assert.match(page, /traffic_type/);
  assert.match(eventRoute, /usageEvents/);
  assert.match(eventRoute, /allowedEvents/);
  assert.match(eventRoute, /allowedRecipientCategories/);
  assert.match(eventRoute, /allowedTrafficTypes/);
  assert.match(eventRoute, /completionRate/);
  assert.match(eventRoute, /resultUtilizationRate/);
  assert.match(eventRoute, /positiveFeedbackRate/);
  assert.match(eventRoute, /feedbackParticipationRate/);
  assert.match(eventRoute, /averageResponseTimeMs/);
  assert.match(eventRoute, /copyRate/);
  assert.match(eventRoute, /shareRate/);
  assert.match(eventRoute, /finalFailedReviews/);
  assert.match(eventRoute, /reviewsWithAnyError/);
  assert.doesNotMatch(eventRoute, /errorRate:/);
  assert.match(eventRoute, /retryRecoveryRate/);
  assert.match(eventRoute, /allowedErrorCodes/);
  assert.match(eventRoute, /client_attempt/);
  assert.match(eventRoute, /provider_attempts/);
  assert.match(dbSchema, /traffic_type/);
  assert.match(dbSchema, /review_id/);
  assert.match(dbSchema, /feedback/);
  assert.match(dbSchema, /sqliteTable\(\s*"usage_events"/);
  assert.match(hosting, /"d1": "DB"/);
  assert.doesNotMatch(dbSchema, /text\("(recipient|purpose|message|original_message)"\)/);
  const trackCalls = page.match(/track\([\s\S]*?\);/g) ?? [];
  assert.ok(trackCalls.length >= 7);
  for (const call of trackCalls) {
    assert.doesNotMatch(call, /\b(recipient|purpose|message)\s*:/);
  }
  assert.doesNotMatch(page, /전 연인에게 연락|교수님·선배에게 질문/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
