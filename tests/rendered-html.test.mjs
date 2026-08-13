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

test("renders the Acervo 33 catalog", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Acervo 33 — catálogo e preços de discos<\/title>/i);
  assert.match(html, /Acervo/);
  assert.match(html, /Explore o catálogo/);
  assert.match(html, /556/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("ships real catalog data and interactive controls", async () => {
  const [page, catalog] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/data/catalog.json", import.meta.url), "utf8"),
  ]);
  const parsed = JSON.parse(catalog);

  assert.equal(parsed.records.length, 556);
  assert.match(page, /type="search"/);
  assert.match(page, /Com preço de leilão/);
  assert.match(page, /role="dialog"/);
  assert.match(page, /prefers-reduced-motion|setSelected/);
});
