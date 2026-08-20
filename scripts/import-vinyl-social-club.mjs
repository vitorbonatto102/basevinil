import fs from "node:fs";
import path from "node:path";

const SOURCE = "Vinyl Social Club";
const inputPath = process.argv[2];
const shouldApply = process.argv.includes("--apply");

if (!inputPath) {
  console.error("Uso: node scripts/import-vinyl-social-club.mjs <lista.txt> [--apply]");
  process.exit(1);
}

const catalogPath = path.resolve("app/data/catalog.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const lines = fs.readFileSync(inputPath, "utf8").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

if (lines.length % 3 !== 0) {
  throw new Error(`A lista tem ${lines.length} linhas úteis; esperava grupos de artista, título e preço.`);
}

const normalize = (value) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/&/g, " e ")
  .replace(/\band\b/g, " e ")
  .replace(/\bthe\b/g, " ")
  .replace(/\bde\b|\bda\b|\bdo\b|\bdas\b|\bdos\b/g, " ")
  .replace(/[^a-z0-9]+/g, " ")
  .trim()
  .replace(/\s+/g, " ");

const titleKey = (value) => normalize(value)
  .replace(/\b(usado|lp|duplo|nacional|importado|vinil)\b/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const artistAliases = new Map([
  [normalize("A cor do som"), normalize("A Cor do Som")],
  [normalize("Emerson Lake and Palmer"), normalize("Emerson, Lake & Palmer")],
  [normalize("New Kids From the Block"), normalize("New Kids on the Block")],
  [normalize("Rolling Stones"), normalize("The Rolling Stones")],
  [normalize("Marina"), normalize("Marina Lima")],
]);

const artistKey = (value) => artistAliases.get(normalize(value)) ?? normalize(value);
const inferYear = (title) => {
  const match = title.match(/(?:^|\()((?:19|20)\d{2})(?:\)|$)/);
  return match ? Number(match[1]) : null;
};
const input = [];
for (let index = 0; index < lines.length; index += 3) {
  const [artist, title, priceText] = lines.slice(index, index + 3);
  const match = priceText.match(/^R\$\s*([0-9]+)(?:[.,]([0-9]{2}))?$/i);
  if (!match) throw new Error(`Preço inválido para ${artist} — ${title}: ${priceText}`);
  input.push({ artist, title, price: Number(match[1]) + Number(match[2] ?? 0) / 100 });
}

const groups = new Map();
for (const item of input) {
  const key = `${artistKey(item.artist)}\u0000${titleKey(item.title)}`;
  const group = groups.get(key) ?? { artist: item.artist, title: item.title, prices: [] };
  if (!group.prices.includes(item.price)) group.prices.push(item.price);
  groups.set(key, group);
}

const records = catalog.records;
const originalRecords = [...records];
const results = [];
for (const item of groups.values()) {
  const exact = records.filter((record) => artistKey(record.artist) === artistKey(item.artist) && titleKey(record.title) === titleKey(item.title));
  let matched = exact.length >= 1 ? exact.sort((a, b) => a.sourceRow - b.sourceRow)[0] : null;
  let method = matched ? "exact" : "new";

  if (!matched) {
    const sameArtist = records.filter((record) => artistKey(record.artist) === artistKey(item.artist));
    const contained = sameArtist.filter((record) => {
      const a = titleKey(record.title);
      const b = titleKey(item.title);
      return a.length >= 5 && b.length >= 5 && (a.includes(b) || b.includes(a));
    });
    if (contained.length === 1 && !/\bvivo\b/i.test(contained[0].title.replace(item.title, ""))) {
      matched = contained[0];
      method = "contained";
    }
  }

  results.push({ item, matched, method });
}

const maxSourceRow = Math.max(...records.map((record) => record.sourceRow));
let nextSourceRow = maxSourceRow + 1;
let added = 0;
let updated = 0;

for (const result of results) {
  const { item } = result;
  const prices = [...item.prices].sort((a, b) => a - b);
  const display = `R$ ${prices.map((price) => Number.isInteger(price) ? String(price) : price.toFixed(2).replace(".", ",")).join("/")}`;
  const numeric = prices[0];

  if (result.matched) {
    const record = result.matched;
    const observation = record.market.find((entry) => entry.source === SOURCE);
    const previous = observation?.display.split("/").map((value) => Number(value.replace(/[^0-9,.-]/g, "").replace(",", "."))).filter(Number.isFinite) ?? [];
    const combined = [...new Set([...previous, ...prices])].sort((a, b) => a - b);
    const combinedDisplay = `R$ ${combined.map((price) => Number.isInteger(price) ? String(price) : price.toFixed(2).replace(".", ",")).join("/")}`;
    if (observation) {
      observation.display = combinedDisplay;
      observation.numeric = combined[0];
    } else {
      record.market.push({ source: SOURCE, display, numeric });
    }
    const marketValues = record.market.map((entry) => entry.numeric).filter((value) => typeof value === "number" && value > 0);
    record.marketMin = marketValues.length ? Math.min(...marketValues) : null;
    updated += 1;
  } else {
    records.push({
      id: `vinyl-social-club-${nextSourceRow}`,
      sourceRow: nextSourceRow,
      lot: null,
      artist: item.artist,
      title: item.title,
      year: inferYear(item.title),
      auctionPrice: null,
      marketMin: numeric,
      market: [{ source: SOURCE, display, numeric }],
      tags: [SOURCE],
    });
    nextSourceRow += 1;
    added += 1;
  }
}

if (!catalog.sources.includes(SOURCE)) catalog.sources.push(SOURCE);

console.log(JSON.stringify({
  inputRows: input.length,
  uniqueItems: groups.size,
  exact: results.filter((result) => result.method === "exact").length,
  contained: results.filter((result) => result.method === "contained").length,
  added,
  updated,
}, null, 2));

console.log("\nCorrespondências por aproximação:");
for (const result of results.filter((entry) => entry.method === "contained")) {
  console.log(`- ${result.item.artist} — ${result.item.title} -> ${result.matched.artist} — ${result.matched.title}`);
}

console.log("\nCorrespondências exatas:");
for (const result of results.filter((entry) => entry.method === "exact")) {
  console.log(`- ${result.item.artist} — ${result.item.title} -> #${result.matched.sourceRow} ${result.matched.artist} — ${result.matched.title}`);
}

console.log("\nNovas entradas:");
for (const result of results.filter((entry) => entry.method === "new")) {
  const sameArtist = originalRecords.filter((record) => artistKey(record.artist) === artistKey(result.item.artist));
  const candidates = sameArtist.length ? ` [existentes: ${sameArtist.map((record) => `${record.title} (#${record.sourceRow})`).join(" | ")}]` : "";
  console.log(`- ${result.item.artist} — ${result.item.title}: R$ ${result.item.prices.join("/")}${candidates}`);
}

if (shouldApply) {
  fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`\nCatálogo atualizado em ${catalogPath}`);
} else {
  console.log("\nSimulação concluída; use --apply para gravar.");
}
