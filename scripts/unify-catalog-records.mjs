import { readFile, writeFile } from "node:fs/promises";

const catalogUrl = new URL("../app/data/catalog.json", import.meta.url);
const catalog = JSON.parse(await readFile(catalogUrl, "utf8"));

function normalize(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function unique(values) {
  return [...new Set(values.filter((value) => value != null))];
}

function adornosValues(record) {
  return record.adornosPrices?.length
    ? record.adornosPrices
    : record.adornosPrice != null
      ? [record.adornosPrice]
      : [];
}

const groups = new Map();
for (const record of catalog.records) {
  const key = `${normalize(record.artist)}|${normalize(record.title)}`;
  const group = groups.get(key) ?? [];
  group.push(record);
  groups.set(key, group);
}

const merged = [];
let removed = 0;

for (const group of groups.values()) {
  const record = structuredClone(group[0]);
  if (group.length === 1) {
    merged.push(record);
    continue;
  }

  removed += group.length - 1;
  const years = unique(group.flatMap((item) => item.years?.length ? item.years : [item.year])).sort((a, b) => a - b);
  const lots = unique(group.flatMap((item) => item.sourceLots?.length ? item.sourceLots : [item.lot])).sort((a, b) => a - b);
  const auctionPrices = unique(group.flatMap((item) => item.auctionPrices?.length ? item.auctionPrices : [item.auctionPrice])).sort((a, b) => a - b);
  const market = [];
  const marketSignatures = new Set();

  for (const observation of group.flatMap((item) => item.market)) {
    const signature = JSON.stringify(observation);
    if (!marketSignatures.has(signature)) {
      marketSignatures.add(signature);
      market.push(observation);
    }
  }

  const adornos = unique(group.flatMap(adornosValues)).sort((a, b) => a - b);
  record.year = years[0] ?? null;
  if (years.length > 1) record.years = years;
  record.lot = lots[0] ?? null;
  record.sourceLots = lots;
  record.auctionPrice = auctionPrices[0] ?? null;
  if (auctionPrices.length > 1) record.auctionPrices = auctionPrices;
  record.market = market;
  record.marketMin = market.length
    ? Math.min(...market.map((item) => item.numeric).filter((value) => value != null && value > 0))
    : null;
  if (!Number.isFinite(record.marketMin)) record.marketMin = null;
  record.tags = unique(group.flatMap((item) => item.tags));
  delete record.adornosPrice;
  delete record.adornosPrices;
  if (adornos.length === 1) record.adornosPrice = adornos[0];
  if (adornos.length > 1) record.adornosPrices = adornos;
  if (!group.every((item) => item.auctionPriceStatus === "unverified-copy")) delete record.auctionPriceStatus;
  merged.push(record);
}

catalog.records = merged;
catalog.generatedAt = new Date().toISOString();
await writeFile(catalogUrl, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(`Unificados ${removed} registros duplicados; catálogo agora tem ${merged.length} discos.`);
