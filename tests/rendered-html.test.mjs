import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  return readFile(new URL("../.next/server/app/index.html", import.meta.url), "utf8");
}

test("renders the price-reference list", async () => {
  const html = await render();
  assert.match(html, /<title>Preço de Disco — lista de consulta<\/title>/i);
  assert.doesNotMatch(html, /Quanto vale esse disco\?/);
  assert.match(html, /Buscar disco/i);
  assert.match(html, /Preço encontrado/);
  assert.match(html, /Mercado Livre/);
  assert.match(html, /VNN\/VSC\/outras/);
  assert.match(html, /Adornos/);
  assert.match(html, /Carregando catálogo/);
  assert.match(html, /footer-price-legend/);
  assert.match(html, /vendido, esgotado ou anúncio indisponível/);
  assert.match(html, /exemplar com avaria\/estado inferior/);
  assert.match(html, /Márcio Cândido/);
  assert.match(html, /126(?:<!-- -->)? títulos pendentes para encontrar/);
  assert.match(html, /Tabela de preços/);
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /Copiar separados/);
  assert.match(html, /Próximos leilões/);
  const auctionHtml = html.match(/<section class="auction-watch"[\s\S]*?<section class="controls"/)?.[0] ?? "";
  assert.ok(auctionHtml);
  assert.match(auctionHtml, /role="tablist" aria-label="Datas dos próximos leilões"/);
  assert.doesNotMatch(html, /<details[^>]*auction-window/i);
  assert.doesNotMatch(html, /<article[^>]*catalog-row/i);
  assert.doesNotMatch(html, /auction-card/i);
  assert.doesNotMatch(html, /Explore o catálogo|role="dialog"|cover-art/i);
});

test("loads the catalog separately and renders a virtualized editable table", async () => {
  const [page, catalog, auctionResults, wanted, css, syncScript, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/data/catalog.json", import.meta.url), "utf8"),
    readFile(new URL("../app/data/auction-results.json", import.meta.url), "utf8"),
    readFile(new URL("../app/data/wanted.json", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../scripts/sync-public-catalog.mjs", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  const parsed = JSON.parse(catalog);
  const parsedAuctionResults = JSON.parse(auctionResults);
  const wantedItems = JSON.parse(wanted);
  assert.ok(parsed.records.length >= 1300);
  assert.equal(parsedAuctionResults.catavento64681Day1.length, 184);
  assert.equal(parsedAuctionResults.catavento64681Day2TopFive.length, 128);
  assert.equal(wantedItems.length, 142);
  assert.equal(wantedItems.filter((item) => item.priority === "A+").length, 61);
  assert.equal(wantedItems.filter((item) => item.priority === "A").length, 75);
  assert.equal(wantedItems.filter((item) => item.priority === "B").length, 6);
  assert.equal(wantedItems.filter((item) => item.separated).length, 16);
  const separatedWantedKeys = new Set(wantedItems
    .filter((item) => item.separated)
    .map((item) => `${item.artist}|${item.title}`));
  for (const key of [
    "The Doors|L.A. Woman",
    "Dire Straits|Brothers in Arms",
    "Jethro Tull|Aqualung",
    "John Coltrane|A Love Supreme",
    "Al Green|Call Me",
    "Aretha Franklin|Lady Soul",
    "Milt Jackson & John Coltrane|Bags & Trane",
    "Prince|Purple Rain",
    "Supertramp|Breakfast in America",
    "Radiohead|OK Computer",
    "Prince|1999",
    "Ramones|Ramones",
    "Yes|Fragile",
    "The Smashing Pumpkins|Siamese Dream",
    "Pixies|Doolittle",
    "Funkadelic|Maggot Brain",
  ]) assert.ok(separatedWantedKeys.has(key), `${key} deveria estar marcado como separado`);
  assert.equal(new Set(wantedItems.map((item) => item.artist + "|" + item.title)).size, wantedItems.length);
  assert.equal(new Set(parsed.records.map((record) => record.id)).size, parsed.records.length);
  const normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const catalogKeys = parsed.records.map((record) => `${normalize(record.artist)}|${normalize(record.title)}`);
  assert.equal(new Set(catalogKeys).size, catalogKeys.length);
  assert.ok(parsed.sources.includes("Vinyl Social Club"));
  assert.ok(parsed.sources.includes("VNN"));
  const vinylSocialClubRecords = parsed.records.filter((record) =>
    record.market.some((entry) => entry.source === "Vinyl Social Club"),
  );
  assert.ok(vinylSocialClubRecords.length >= 214);
  assert.ok(vinylSocialClubRecords.every((record) =>
    record.market.some((entry) => entry.source === "Vinyl Social Club" && entry.numeric > 0),
  ));
  const vnnRecords = parsed.records.filter((record) =>
    record.market.some((entry) => entry.source === "VNN"),
  );
  assert.equal(vnnRecords.length, 517);
  assert.ok(vnnRecords.every((record) =>
    record.market.some((entry) => entry.source === "VNN" && entry.numeric > 0),
  ));
  const vnnHurting = parsed.records.find((record) => normalize(record.artist) === "tears for fears" && normalize(record.title) === "the hurting");
  assert.equal(vnnHurting?.market.filter((entry) => entry.source === "VNN").length, 1);
  assert.equal(vnnHurting?.market.find((entry) => entry.source === "VNN")?.numeric, 70);
  const remRecords = parsed.records.filter((record) => normalize(record.artist) === "r e m" && normalize(record.title) === "out of time");
  assert.equal(remRecords.length, 1);
  assert.equal(remRecords[0].auctionPrice, 75);
  assert.equal(remRecords[0].market.find((entry) => entry.source === "Mercado Livre")?.numeric, 150);
  assert.equal(remRecords[0].market.find((entry) => entry.source === "VNN")?.numeric, 70);
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
  assert.ok(parsed.records.filter((record) => record.adornosPrice != null || record.adornosPrices?.length).length >= 528);
  const anjoAvesso = parsed.records.find((record) => normalize(record.artist) === "alceu valenca" && normalize(record.title) === "anjo avesso");
  const saudadesDoBrasil = parsed.records.find((record) => normalize(record.artist) === "elis regina" && normalize(record.title).startsWith("saudades do brasil"));
  const rhythmOfTheSaints = parsed.records.find((record) => normalize(record.artist) === "paul simon" && normalize(record.title) === "the rhythm of the saints");
  const cultElectric = parsed.records.find((record) => normalize(record.artist) === "the cult" && normalize(record.title) === "electric");
  assert.deepEqual(anjoAvesso?.adornosPrices, [43, 65]);
  assert.deepEqual(saudadesDoBrasil?.adornosPrices, [148, 65]);
  assert.equal(rhythmOfTheSaints?.adornosPrice, 21);
  assert.equal(cultElectric?.adornosPrice, 87);
  assert.equal(cultElectric?.market.find((entry) => entry.source === "VNN")?.numeric, 70);
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
  assert.match(page, /<table\b/);
  assert.doesNotMatch(page, /<th>Lote<\/th>/);
  assert.match(page, /Vinyl Social Club/);
  assert.match(page, /VNN\/VSC\/outras/);
  assert.match(page, /HIDDEN_SOURCE_TAGS/);
  assert.match(page, /const duplicateIndex = merged\.findIndex/);
  assert.doesNotMatch(page, /import catalog from "\.\/data\/catalog\.json"/);
  assert.match(page, /fetch\("\/catalog\.json"/);
  assert.match(page, /setRecords\(mergeCatalogEdits\(baseRecords, \[\]\)\)/);
  assert.match(page, /if \(editData\.edits\?\.length\) setRecords\(mergeCatalogEdits\(baseRecords, editData\.edits\)\)/);
  assert.match(syncScript, /app\/data\/catalog\.json/);
  assert.match(syncScript, /public\/catalog\.json/);
  assert.equal(JSON.parse(packageJson).scripts.prebuild, "npm run sync:catalog");
  assert.match(page, /auctionWatchPrices/);
  assert.match(page, /currentBidMarkers: "\*-"/);
  assert.match(page, /parseMarkedPriceList/);
  assert.match(page, /avaria ou estado inferior relevante/);
  assert.match(page, /Muito barato/);
  assert.match(page, /localStorage/);
  assert.match(page, /preco-de-disco-procuras-separadas/);
  assert.match(page, /Procura Márcio/);
  assert.match(page, /trem-das-7-64190/);
  assert.match(page, /lot: 164/);
  assert.match(page, /32191198/);
  assert.match(page, /lot: 177/);
  assert.match(page, /32192536/);
  assert.match(page, /Principal seu · Procura Márcio · A\+/);
  const cavernaBlock = page.match(/const cavernaVintageAuctionWatch: AuctionWatch\[\] = \[[\s\S]*?\n\];/)?.[0] ?? "";
  assert.ok(cavernaBlock);
  for (const lot of [4, 6, 19, 74, 85, 91, 101, 113, 114, 121, 129, 139, 164, 177, 185, 189, 203, 204, 211, 223, 231, 238]) {
    assert.match(cavernaBlock, new RegExp(`lot: ${lot},`));
  }
  assert.doesNotMatch(cavernaBlock, /Tape Deck|Receiver Kenwood|Audio-Technica/);
  assert.match(page, /lot: "282C"/);
  assert.match(page, /Speaking In Tongues/);
  assert.match(page, /lot: 341/);
  assert.match(page, /The Rhythm Of The Saints/);
  assert.match(page, /Robertinho de Recife & Emilinha/);
  assert.match(page, /lot: 923/);
  assert.match(page, /Canções De Amor E Liberdade/);
  assert.match(page, /24 a 28 de agosto · 19h30/);
  assert.match(page, /discos-esquecidos-64691/);
  assert.match(page, /catavento-discos-64681/);
  assert.match(page, /const catavento64681AuctionWatch/);
  assert.match(page, /syncCatalog: false/);
  assert.match(page, /event\.syncCatalog !== false/);
  assert.match(page, /settledPrice: 89/);
  assert.match(page, /settledPrice: 28/);
  assert.match(page, /settledPrice: 59/);
  assert.match(page, /settledPrice: 99/);
  assert.match(page, /settledPrice: 90/);
  assert.match(page, /saleStatus: "unsold"/);
  assert.match(page, /catavento64681SettledResults/);
  assert.match(page, /catalogPrice: result\.price/);
  assert.match(page, /lot: 178/);
  assert.match(page, /Paris \(2LP\)/);
  assert.match(page, /lot: 341/);
  assert.match(page, /Stop Making Sense/);
  assert.match(page, /lot: 184/);
  assert.match(page, /The Stonewall Celebration Concert/);
  assert.match(page, /8 de setembro · 19h/);
  assert.match(page, /wanted-hit/);
  assert.match(page, /activeView === "marcio" && filteredWanted\.map/);
  assert.match(page, /activeView === "leiloes" && datedAuctionEvents\.map/);
  assert.doesNotMatch(page, /function catalogMatch|function openCatalogMatch|wanted-reference|coverage === "procuras"/);
  assert.match(page, /availableAuctionDates/);
  assert.match(page, /datedAuctionEvents/);
  assert.doesNotMatch(page, /record-card|load-more/);
  assert.match(page, /const TABLE_OVERSCAN = 12/);
  assert.match(page, /virtualTable\.rows\.map/);
  assert.match(page, /className="virtual-spacer"/);
  assert.match(css, /thead \{ position: sticky;/);
  assert.match(css, /\.table-shell \{[^}]*height: clamp\(440px, 70vh, 760px\)/s);
});

test("supports direct password-protected persistent catalog editing on Vercel", async () => {
  const [page, route, store, proxy, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/catalog/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/catalog-store.ts", import.meta.url), "utf8"),
    readFile(new URL("../proxy.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.equal(JSON.parse(packageJson).scripts.build, "next build");
  assert.match(proxy, /SITE_PASSWORD/);
  assert.match(route, /writeCatalogEdit/);
  assert.match(route, /hasSitePasswordSession/);
  assert.match(store, /@vercel\/blob/);
  assert.match(store, /process\.env\.VERCEL === "1"/);
  assert.match(store, /ifMatch/);
  assert.match(store, /useCache: false/);
  assert.match(page, /Clique em uma célula para editar/);
  assert.match(page, /function inlineCell/);
  assert.match(page, /inlineCell\(record, "leilao", auctionDisplay/);
  assert.match(page, /auctionWatchOverride/);
  assert.match(page, /if \(record\.auctionWatchOverride\) continue/);
  assert.match(page, /auctionWatchPrices: auctionChanged \? undefined/);
  assert.doesNotMatch(page, /<th>Valor leilão<\/th>/);
  assert.match(page, /Salvar online/);
  assert.match(page, /Novo disco/);
  assert.match(page, /status: "deleted"/);
});
