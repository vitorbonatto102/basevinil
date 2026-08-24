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
  assert.match(html, /Márcio Cândido/);
  assert.match(html, /132 títulos pendentes para encontrar/);
  assert.match(html, /Preços e leilões/);
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /Copiar separados/);
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
  assert.match(html, /Willy and the Poor Boys/);
  assert.match(html, /The Game/);
  assert.match(html, /<details[^>]*auction-window/i);
  assert.match(html, /<summary>/i);
  assert.doesNotMatch(html, /<details[^>]*auction-window[^>]*\sopen(?:=|\s|>)/i);
  assert.match(html, /auction-day/i);
  assert.doesNotMatch(html, /auction-card/i);
  assert.doesNotMatch(html, /Explore o catálogo|role="dialog"|cover-art/i);
});

test("keeps all data visible and compares offers inline", async () => {
  const [page, catalog, wanted, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/data/catalog.json", import.meta.url), "utf8"),
    readFile(new URL("../app/data/wanted.json", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  const parsed = JSON.parse(catalog);
  const wantedItems = JSON.parse(wanted);
  assert.ok(parsed.records.length >= 1056);
  assert.equal(wantedItems.length, 132);
  assert.equal(wantedItems.filter((item) => item.priority === "A+").length, 61);
  assert.equal(wantedItems.filter((item) => item.priority === "A").length, 65);
  assert.equal(wantedItems.filter((item) => item.priority === "B").length, 6);
  assert.equal(new Set(wantedItems.map((item) => item.artist + "|" + item.title)).size, wantedItems.length);
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
  assert.ok(parsed.records.filter((record) => record.adornosPrice != null || record.adornosPrices?.length).length >= 336);
  const backInBlack = parsed.records.find((record) => record.artist === "AC/DC" && record.title === "Back In Black");
  const fireball = parsed.records.find((record) => record.artist === "Deep Purple" && record.title === "Fireball");
  const garotosPodres = parsed.records.find((record) => record.artist === "Garotos Podres" && record.title === "Pisando Na M...");
  const metallicaJustice = parsed.records.find((record) => record.artist === "Metallica" && record.title === "...And Justice For All (2LP)");
  const vanHalen1984 = parsed.records.find((record) => record.artist === "Van Halen" && record.title === "1984");
  assert.equal(backInBlack?.adornosPrice, 189);
  assert.deepEqual(fireball?.adornosPrices, [189, 148]);
  assert.deepEqual(garotosPodres?.adornosPrices, [189, 148]);
  assert.equal(metallicaJustice?.adornosPrice, 189);
  assert.equal(parsed.records.some((record) => record.artist === "Metallica" && record.title === "1989"), false);
  assert.equal(vanHalen1984?.adornosPrice, 189);
  assert.match(page, /<table>/);
  assert.doesNotMatch(page, /<th>Lote<\/th>/);
  assert.match(page, /Vinyl Social Club/);
  assert.match(page, /Muito barato/);
  assert.match(page, /localStorage/);
  assert.match(page, /preco-de-disco-procuras-separadas/);
  assert.match(page, /Procura Márcio/);
  assert.match(page, /wanted-hit/);
  assert.match(page, /activeView === "marcio" && filteredWanted\.map/);
  assert.doesNotMatch(page, /function catalogMatch|function openCatalogMatch|wanted-reference|coverage === "procuras"/);
  assert.doesNotMatch(page, /setSelected|record-card|load-more/);
  assert.match(css, /thead \{ position: relative;/);
  assert.doesNotMatch(css, /thead \{ position: sticky|\.controls \{[^}]*position: sticky/s);
});

test("supports direct protected persistent catalog editing", async () => {
  const [page, route, schema, hosting] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/catalog/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
  ]);
  assert.equal(JSON.parse(hosting).d1, "DB");
  assert.match(schema, /catalog_edits/);
  assert.match(route, /EDITOR_EMAILS/);
  assert.match(route, /Esta conta não pode editar o catálogo/);
  assert.match(route, /ON CONFLICT\(record_id\) DO UPDATE/);
  assert.match(page, /Clique em uma célula para editar/);
  assert.match(page, /function inlineCell/);
  assert.match(page, /inlineCell\(record, "leilao", auctionDisplay/);
  assert.doesNotMatch(page, /<th>Valor leilão<\/th>/);
  assert.match(page, /Salvar online/);
  assert.match(page, /Novo disco/);
  assert.match(page, /status: "deleted"/);
});
