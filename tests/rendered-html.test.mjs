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
  assert.match(html, /Vinyl Social Club/);
  assert.match(html, /Adornos/);
  assert.match(html, /Próximos leilões/);
  assert.match(html, /Bruce Angeiras/);
  assert.match(html, /RT Leilões/);
  assert.match(html, /24, 25 e 26 de agosto · 18h/);
  assert.match(html, /Out Of Time/);
  assert.match(html, /Plural/);
  assert.match(html, /Sonsual/);
  assert.match(html, /The Turn Of A Friendly Card/);
  assert.match(html, /E Pluribus Funk/);
  assert.match(html, /Love Songs \(2LP\)/);
  assert.match(html, /Cosmo&#x27;s Factory|Cosmo's Factory/);
  assert.match(html, /The Game/);
  assert.match(html, /<details[^>]*auction-window/i);
  assert.match(html, /<summary>/i);
  assert.doesNotMatch(html, /<details[^>]*auction-window[^>]*\sopen(?:=|\s|>)/i);
  assert.match(html, /auction-day/i);
  assert.doesNotMatch(html, /auction-card/i);
  assert.doesNotMatch(html, /Explore o catálogo|role="dialog"|cover-art/i);
});

test("keeps all data visible and compares offers inline", async () => {
  const [page, catalog, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/data/catalog.json", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  const parsed = JSON.parse(catalog);
  assert.ok(parsed.records.length >= 980);
  assert.equal(new Set(parsed.records.map((record) => record.id)).size, parsed.records.length);
  const normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const catalogKeys = parsed.records.map((record) => `${normalize(record.artist)}|${normalize(record.title)}`);
  assert.equal(new Set(catalogKeys).size, catalogKeys.length);
  assert.ok(parsed.sources.includes("Vinyl Social Club"));
  const vinylSocialClubRecords = parsed.records.filter((record) =>
    record.market.some((entry) => entry.source === "Vinyl Social Club"),
  );
  assert.ok(vinylSocialClubRecords.length >= 214);
  assert.ok(vinylSocialClubRecords.every((record) =>
    record.market.some((entry) => entry.source === "Vinyl Social Club" && entry.numeric > 0),
  ));
  const researchedMarketplaceRecords = parsed.records.filter((record) =>
    record.market.some((entry) => entry.checkedAt === "2026-08-20"),
  );
  assert.equal(researchedMarketplaceRecords.length, 15);
  assert.ok(researchedMarketplaceRecords.every((record) =>
    record.auctionPrice === 19 && record.auctionPriceStatus === "unverified-copy",
  ));
  assert.ok(researchedMarketplaceRecords.every((record) =>
    record.market.every((entry) => entry.checkedAt !== "2026-08-20" || (entry.url && entry.shipping)),
  ));
  assert.ok(parsed.records.filter((record) => record.adornosPrice != null || record.adornosPrices?.length).length >= 254);
  assert.match(page, /<table>/);
  assert.doesNotMatch(page, /<th>Lote<\/th>/);
  assert.match(page, /Vinyl Social Club/);
  assert.match(page, /Muito barato/);
  assert.match(page, /localStorage/);
  assert.doesNotMatch(page, /setSelected|record-card|load-more/);
  assert.match(css, /thead \{ position: relative;/);
  assert.doesNotMatch(css, /thead \{ position: sticky|\.controls \{[^}]*position: sticky/s);
});
