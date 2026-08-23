import { readFile, writeFile } from "node:fs/promises";

const catalogUrl = new URL("../app/data/catalog.json", import.meta.url);
const shouldApply = process.argv.includes("--apply");
const catalog = JSON.parse(await readFile(catalogUrl, "utf8"));

const input = [
  ["AC/DC", "Back In Black", 189],
  ["AC/DC", "For Those About To Rock", 189],
  ["Accept", "Metal Heart", 148],
  ["Aerosmith", "Done With Mirrors", 189],
  ["Al Green", "The Power", 109],
  ["Alaíde Costa", "E O Tempo Agora Quer Voar", 148],
  ["Baden Powell & Vinicius de Moraes", "Os Afro-Sambas (Re - Lacrado)", 189],
  ["Banda Black Rio", "Maria Fumaça", 189],
  ["Belchior", "Projeto Fanzine", 148],
  ["Black Sabbath", "Born Again", 189],
  ["Black Sabbath", "Vol. 4", 189],
  ["Blue Öyster Cult", "Cultösaurus Erectus", 189],
  ["Bon Jovi", "New Jersey", 148],
  ["Buddy Holly", "Rocks", 109],
  ["David Bowie", "Hunky Dory", 189],
  ["Deep Purple", "The Battle Rages On", 189],
  ["Deep Purple", "Fireball", 148],
  ["Deep Purple", "Shades Of Deep Purple", 148],
  ["Dio", "Intermission", 189],
  ["Dio", "Hungry For Heaven", 148],
  ["Djavan", "Luz", 109],
  ["Echo & The Bunnymen", "Porcupine", 148],
  ["Elvis Presley", "From Elvis In Memphis", 189],
  ["Elvis Presley", "For LP Fans Only", 109],
  ["Emerson, Lake & Palmer", "Black Moon", 148],
  ["Eric Clapton", "Journeyman", 109],
  ["Garotos Podres", "Pisando Na M...", 148],
  ["Genesis", "Seconds Out (2LP)", 189],
  ["Golpe De Estado", "Nem Polícia, Nem Bandido", 148],
  ["Golpe De Estado", "Quarto Golpe", 109],
  ["Guns N' Roses", "Appetite For Destruction", 148],
  ["Hiatus Kaiyote", "Mood Valiant", 148],
  ["Iggy Pop", "Brick By Brick", 109],
  ["INXS", "X", 109],
  ["Iron Maiden", "Live After Death (2LP)", 189],
  ["Iron Maiden", "The Number Of The Beast", 189],
  ["Janis Joplin", "Cheap Thrills", 189],
  ["Janis Joplin", "Farewell Song", 109],
  ["Jimi Hendrix", "Johnny B. Goode", 109],
  ["Jorge Ben", "A Tábua De Esmeralda (OG)", 148],
  ["Joy Division", "Closer", 189],
  ["Kiss", "Rock And Roll Over", 148],
  ["Led Zeppelin", "Led Zeppelin III", 189],
  ["Led Zeppelin", "Physical Graffiti (2LP)", 189],
  ["Legião Urbana", "O Descobrimento Do Brasil", 148],
  ["Letieres Leite", "Moacir De Todos Os Santos", 148],
  ["Manowar", "Battle Hymns", 189],
  ["Mariah Carey", "Music Box", 109],
  ["Marillion", "Misplaced Childhood", 109],
  ["Marisa Monte", "Memórias, Crônicas E Declarações De Amor", 148],
  ["Marisa Monte", "Mais", 109],
  ["Mart'nália", "Pagode Da Mart'nália", 189],
  ["Metallica", "...And Justice For All (2LP)", 189],
  ["Metallica", "Kill 'Em All", 189],
  ["Milton Nascimento", "Clube Da Esquina 2 (2LP)", 148],
  ["Motörhead", "Ace Of Spades", 189],
  ["Motörhead", "No Remorse (2LP)", 189],
  ["Neutral Milk Hotel", "In The Aeroplane Over The Sea", 189],
  ["New Order", "Brotherhood", 148],
  ["Nina Simone", "Don't Let Me Be Misunderstood", 189],
  ["Ozzy Osbourne", "Bark At The Moon", 189],
  ["Pantera", "Cowboys From Hell", 189],
  ["Patife", "Corredor Polonês", 189],
  ["Paul McCartney", "Waterfalls", 148],
  ["Peter Tosh", "Mama Africa", 148],
  ["Pink Floyd", "Animals", 148],
  ["Pink Floyd", "The Dark Side Of The Moon", 148],
  ["Raimundos", "Raimundos (1994)", 189],
  ["Ramones", "End Of The Century", 189],
  ["Rush", "Caress Of Steel", 189],
  ["Santana", "Moonflower (2LP)", 148],
  ["Saxon", "Wheels Of Steel", 189],
  ["Secos & Molhados", "Secos & Molhados (1973)", 109],
  ["Tássia Reis", "Topo Da Minha Cabeça", 148],
  ["The Beatles", "Sgt. Pepper's Lonely Hearts Club Band", 148],
  ["The Clash", "London Calling (2LP)", 189],
  ["The Doors", "The Best Of (2LP)", 189],
  ["The Jesus And Mary Chain", "Honey's Dead", 189],
  ["The Smiths", "Meat Is Murder", 189],
  ["The Stone Roses", "The Stone Roses (1989)", 189],
  ["Tim Maia", "Tim Maia (1972)", 189],
  ["Trilha Do Filme", "O Agente Secreto (2LP)", 189],
  ["Trilha Do Filme", "De Volta Para O Futuro", 109],
  ["Van Halen", "MCMLXXXIV", 189],
  ["Whitesnake", "Slip Of The Tongue", 148],
  ["Xênia França", "Em Nome Da Estrela", 109],
].map(([artist, title, price]) => ({ artist, title, price }));

const normalize = (value) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/&/g, " e ")
  .replace(/\band\b/g, " e ")
  .replace(/\bthe\b/g, " ")
  .replace(/[^a-z0-9]+/g, " ")
  .trim()
  .replace(/\s+/g, " ");

const titleKey = (value) => normalize(value)
  .replace(/\b(2lp|og|re|lacrado|usado|lp|duplo|nacional|importado|vinil)\b/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const artistKey = (value) => normalize(value);
const legacyAliases = new Map([
  [
    artistKey("Van Halen") + "|" + titleKey("MCMLXXXIV"),
    { artist: "Van Halen", title: "1984", canonicalTitle: "1984", year: 1984 },
  ],
  [
    artistKey("Metallica") + "|" + titleKey("...And Justice For All (2LP)"),
    { artist: "Metallica", title: "1989", canonicalTitle: "...And Justice For All (2LP)", year: 1989 },
  ],
]);
const priceOrderOverrides = new Map([
  [artistKey("Deep Purple") + "|" + titleKey("Fireball"), [189, 148]],
]);

const inferYear = (title) => {
  const match = title.match(/(?:^|\()((?:19|20)\d{2})(?:\)|$)/);
  return match ? Number(match[1]) : null;
};

const existingAdornos = (record) => record.adornosPrices?.length
  ? record.adornosPrices
  : record.adornosPrice != null
    ? [record.adornosPrice]
    : [];

const records = catalog.records;
const originalRecords = [...records];
const results = [];

for (const item of input) {
  const alias = legacyAliases.get(artistKey(item.artist) + "|" + titleKey(item.title));
  const aliasMatch = alias
    ? records.find((record) =>
      artistKey(record.artist) === artistKey(alias.artist)
      && titleKey(record.title) === titleKey(alias.title))
    : null;
  const exact = records.filter((record) =>
    artistKey(record.artist) === artistKey(item.artist)
    && titleKey(record.title) === titleKey(item.title));
  let matched = aliasMatch ?? exact.sort((a, b) => a.sourceRow - b.sourceRow)[0] ?? null;
  let method = aliasMatch ? "alias" : matched ? "exact" : "new";

  if (!matched) {
    const sameArtist = records.filter((record) => artistKey(record.artist) === artistKey(item.artist));
    const contained = sameArtist.filter((record) => {
      const existing = titleKey(record.title);
      const incoming = titleKey(item.title);
      return existing.length >= 5 && incoming.length >= 5
        && (existing.includes(incoming) || incoming.includes(existing));
    });
    if (contained.length === 1) {
      matched = contained[0];
      method = "contained";
    }
  }

  results.push({ item, matched, method, alias });
}

let nextSourceRow = Math.max(...records.map((record) => record.sourceRow)) + 1;
let added = 0;
let updated = 0;
let unchanged = 0;

for (const result of results) {
  const { item, matched } = result;
  if (matched) {
    if (result.alias?.canonicalTitle) {
      matched.title = result.alias.canonicalTitle;
      matched.year = result.alias.year;
    }
    const previous = existingAdornos(matched);
    const override = priceOrderOverrides.get(artistKey(item.artist) + "|" + titleKey(item.title));
    const combined = override ? [...override] : [...previous];
    if (!combined.includes(item.price)) combined.push(item.price);
    const sameOrder = combined.length === previous.length
      && combined.every((price, index) => price === previous[index]);
    const normalizedShape = combined.length > 1
      ? matched.adornosPrice == null && Array.isArray(matched.adornosPrices)
      : matched.adornosPrices == null;
    if (sameOrder && normalizedShape) {
      unchanged += 1;
      continue;
    }
    delete matched.adornosPrice;
    delete matched.adornosPrices;
    if (combined.length === 1) matched.adornosPrice = combined[0];
    if (combined.length > 1) matched.adornosPrices = combined;
    updated += 1;
    continue;
  }

  records.push({
    id: "adornos-" + nextSourceRow,
    sourceRow: nextSourceRow,
    lot: null,
    artist: item.artist,
    title: item.title,
    year: inferYear(item.title),
    auctionPrice: null,
    marketMin: null,
    market: [],
    tags: ["Adornos"],
    adornosPrice: item.price,
  });
  nextSourceRow += 1;
  added += 1;
}

if (!catalog.sources.includes("Adornos")) catalog.sources.push("Adornos");
catalog.generatedAt = new Date().toISOString();

console.log(JSON.stringify({
  inputRows: input.length,
  exact: results.filter((result) => result.method === "exact").length,
  alias: results.filter((result) => result.method === "alias").length,
  contained: results.filter((result) => result.method === "contained").length,
  added,
  updated,
  unchanged,
}, null, 2));

console.log("\nCorrespondências por aproximação:");
for (const result of results.filter((entry) => entry.method === "contained")) {
  console.log("- " + result.item.artist + " — " + result.item.title + " -> " + result.matched.artist + " — " + result.matched.title);
}

console.log("\nNovas entradas:");
for (const result of results.filter((entry) => entry.method === "new")) {
  const sameArtist = originalRecords.filter((record) => artistKey(record.artist) === artistKey(result.item.artist));
  const candidates = sameArtist.length
    ? " [existentes: " + sameArtist.map((record) => record.title + " (#" + record.sourceRow + ")").join(" | ") + "]"
    : "";
  console.log("- " + result.item.artist + " — " + result.item.title + ": R$ " + result.item.price + candidates);
}

if (shouldApply) {
  await writeFile(catalogUrl, JSON.stringify(catalog, null, 2) + "\n", "utf8");
  console.log("\nCatálogo atualizado.");
} else {
  console.log("\nSimulação concluída; use --apply para gravar.");
}