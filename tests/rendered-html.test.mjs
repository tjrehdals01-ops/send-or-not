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

test("server-renders the send-or-hold experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="ko">/);
  assert.match(html, /<title>보내도 돼\? — 전송 전 30초<\/title>/);
  assert.match(html, /그 말,/);
  assert.match(html, /누구에게 보내는 말인가요\?/);
  assert.match(html, /원문 미저장/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/);
});

test("keeps all four scenarios and privacy copy in source", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  for (const label of ["전 연인", "교수님 · 선배", "거절", "어려운 대답"]) {
    assert.match(page, new RegExp(label.replace("·", "\\·")));
  }
  assert.match(page, /입력한 원문은 저장하지 않습니다/);
  assert.match(page, /choose_hold/);
  assert.match(layout, /og-card\.png/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
