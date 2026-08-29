import fs from "node:fs";
import path from "node:path";

const sourceArgument = process.argv.find((argument) => argument.startsWith("--source="));
const SOURCE = sourceArgument?.slice("--source=".length).trim() || "Vinyl Social Club";
const inputPath = process.argv[2];
const shouldApply = process.argv.includes("--apply");

if (!inputPath) {
  console.error("Uso: node scripts/import-vinyl-social-club.mjs <lista.txt> [--source=VNN] [--apply]");
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
  [normalize("Cor do Som"), normalize("A Cor do Som")],
  [normalize("Emerson Lake and Palmer"), normalize("Emerson, Lake & Palmer")],
  [normalize("New Kids From the Block"), normalize("New Kids on the Block")],
  [normalize("Rolling Stones"), normalize("The Rolling Stones")],
  [normalize("Marina"), normalize("Marina Lima")],
  [normalize("Beatles"), normalize("The Beatles")],
  [normalize("Cure"), normalize("The Cure")],
  [normalize("Smiths"), normalize("The Smiths")],
  [normalize("Motorhead"), normalize("Motörhead")],
  [normalize("Morrisey"), normalize("Morrissey")],
  [normalize("Lloyd and the Commotions"), normalize("Lloyd Cole and the Commotions")],
  [normalize("Emilio Santioago"), normalize("Emílio Santiago")],
  [normalize("Red Hot Chilli Peppers"), normalize("Red Hot Chili Peppers")],
]);

const artistKey = (value) => artistAliases.get(normalize(value)) ?? normalize(value);
const canonicalItems = new Map([
  [`${normalize("Amy Winehouse")}\u0000${titleKey("Back in Black")}`, { artist: "Amy Winehouse", title: "Back to Black" }],
  [`${normalize("Beatles")}\u0000${titleKey("Please Please")}`, { artist: "The Beatles", title: "Please Please Me" }],
  [`${normalize("Black Sabbath")}\u0000${titleKey("Black Sabbath 304.1060")}`, { artist: "Black Sabbath", title: "Black Sabbath" }],
  [`${normalize("Bon Iver")}\u0000${titleKey("For Emma Forever a go")}`, { artist: "Bon Iver", title: "For Emma, Forever Ago" }],
  [`${normalize("Casa das Maquinas")}\u0000${titleKey("1974")}`, { artist: "Casa das Máquinas", title: "Casa das Máquinas (1974)" }],
  [`${normalize("Clube da Esquina: Milton Nascimento e Lo Borges")}\u0000${titleKey("Reedição Capa Simples Importado")}`, { artist: "Milton Nascimento & Lô Borges", title: "Clube da Esquina" }],
  [`${normalize("Cor do Som")}\u0000${titleKey("Intuição")}`, { artist: "A Cor do Som", title: "Intuição" }],
  [`${normalize("Dead kennedys")}\u0000${titleKey("Fresh Fruit For Roting Veagetables")}`, { artist: "Dead Kennedys", title: "Fresh Fruit for Rotting Vegetables" }],
  [`${normalize("Deee Lite")}\u0000${titleKey("World Clique")}`, { artist: "Deee-Lite", title: "World Clique" }],
  [`${normalize("Emilio Santioago")}\u0000${titleKey("Mais que Um Momento")}`, { artist: "Emílio Santiago", title: "Mais que Um Momento" }],
  [`${normalize("Foo Fighters")}\u0000${titleKey("1995 (Reedição")}`, { artist: "Foo Fighters", title: "Foo Fighters (1995, reedição)" }],
  [`${normalize("Jorge Ben")}\u0000${titleKey("A Tabua de Esmeralda (Reedição)")}`, { artist: "Jorge Ben", title: "A Tábua De Esmeralda" }],
  [`${normalize("Metallica")}\u0000${titleKey("Ride the Lighting")}`, { artist: "Metallica", title: "Ride the Lightning" }],
  [`${normalize("Metallica")}\u0000${titleKey("Black Album")}`, { artist: "Metallica", title: "Metallica (Black Album)" }],
  [`${normalize("Morrisey")}\u0000${titleKey("Van Hate")}`, { artist: "Morrissey", title: "Viva Hate" }],
  [`${normalize("New Order")}\u0000${titleKey("FACT. 50 1981 movement (Reedição)")}`, { artist: "New Order", title: "Movement (FACT 50, 1981, reedição)" }],
  [`${normalize("Pink Floyd")}\u0000${titleKey("Momentary Lapse of Reason")}`, { artist: "Pink Floyd", title: "A Momentary Lapse of Reason" }],
  [`${normalize("Rainbow")}\u0000${titleKey("Ritchie Blackmore's")}`, { artist: "Rainbow", title: "Ritchie Blackmore's Rainbow" }],
  [`${normalize("Red Hot Chilli Peppers")}\u0000${titleKey("Blood Sugar Sex Magik")}`, { artist: "Red Hot Chili Peppers", title: "Blood Sugar Sex Magik" }],
  [`${normalize("Sarah Vaughan & Billy Ecstine")}\u0000${titleKey("The Irving Berlin Songbook")}`, { artist: "Sarah Vaughan & Billy Eckstine", title: "The Irving Berlin Songbook" }],
  [`${normalize("Secos e Molhados")}\u0000${titleKey("Primeiro 1973 (Reedição)")}`, { artist: "Secos & Molhados", title: "1973" }],
  [`${normalize("Smiths")}\u0000${titleKey("The Best I")}`, { artist: "The Smiths", title: "Best... I" }],
  [`${normalize("System of a Down")}\u0000${titleKey("1998")}`, { artist: "System of a Down", title: "System of a Down (1998)" }],
  [`${normalize("Talking Heads")}\u0000${titleKey(":77 (Reedição")}`, { artist: "Talking Heads", title: "Talking Heads: 77 (reedição)" }],
  [`${normalize("The Cult")}\u0000${titleKey("Eletric")}`, { artist: "The Cult", title: "Electric" }],
  [`${normalize("Tim Maia")}\u0000${titleKey("1970 (Reedição)")}`, { artist: "Tim Maia", title: "Tim Maia" }],
  [`${normalize("Tropicalia ou Panis et Circencis")}\u0000${titleKey("Serie Reprise")}`, { artist: "Vários Artistas", title: "Tropicália ou Panis et Circencis (Série Reprise)" }],
]);
const inferYear = (title) => {
  const match = title.match(/(?:^|\()((?:19|20)\d{2})(?:\)|$)/);
  return match ? Number(match[1]) : null;
};
const input = [];
for (let index = 0; index < lines.length; index += 3) {
  const [artist, title, priceText] = lines.slice(index, index + 3);
  const match = priceText.match(/^R\$\s*([0-9]+)(?:[.,]([0-9]{2}))?$/i);
  if (!match) throw new Error(`Preço inválido para ${artist} — ${title}: ${priceText}`);
  const canonical = canonicalItems.get(`${normalize(artist)}\u0000${titleKey(title)}`) ?? { artist, title };
  input.push({ ...canonical, price: Number(match[1]) + Number(match[2] ?? 0) / 100 });
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
      id: `${normalize(SOURCE).replace(/\s+/g, "-")}-${nextSourceRow}`,
      sourceRow: nextSourceRow,
      lot: null,
      artist: item.artist,
      title: item.title,
      year: inferYear(item.title),
      auctionPrice: null,
      marketMin: numeric,
      market: [{ source: SOURCE, display, numeric }],
      tags: [],
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
