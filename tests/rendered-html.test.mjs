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

test("renders the price-reference list", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Preço de Disco — lista de consulta<\/title>/i);
  assert.match(html, /Quanto vale esse disco\?/);
  assert.match(html, /Preço encontrado/);
  assert.match(html, /Mercado Livre/);
  assert.match(html, /Adornos/);
  assert.match(html, /Próximos leilões/);
  assert.match(html, /Bruce Angeiras/);
  assert.match(html, /E Pluribus Funk/);
  assert.match(html, /Please Please Me/);
  assert.match(html, /Cosmo&#x27;s Factory|Cosmo's Factory/);
  assert.match(html, /The Game/);
  assert.match(html, /<details[^>]*auction-window/i);
  assert.match(html, /<summary>/i);
  assert.doesNotMatch(html, /Explore o catálogo|role="dialog"|cover-art/i);
});

test("keeps all data visible and compares offers inline", async () => {
  const [page, catalog, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/data/catalog.json", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  const parsed = JSON.parse(catalog);
  assert.equal(parsed.records.length, 789);
  assert.equal(parsed.records.filter((record) => record.adornosPrice != null).length, 254);
  assert.match(page, /<table>/);
  assert.match(page, /Muito barato/);
  assert.match(page, /localStorage/);
  assert.doesNotMatch(page, /setSelected|record-card|load-more/);
  assert.match(css, /thead \{ position: relative;/);
  assert.doesNotMatch(css, /thead \{ position: sticky|\.controls \{[^}]*position: sticky/s);
});
