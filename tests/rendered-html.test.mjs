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
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /type MessageChannel = "kakao" \| "instagram" \| "email"/);
  assert.match(page, /type OutputLanguage = "ko" \| "en"/);
  assert.match(page, /Professor Kim/);
  assert.match(page, /Subject:/);
  assert.match(page, /comparison-grid/);
  assert.match(page, /navigator\.share/);
  assert.match(page, /입력한 문장은 저장하지 않아요/);
  assert.match(layout, /og\.png/);
  assert.doesNotMatch(page, /전 연인에게 연락|교수님·선배에게 질문/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
