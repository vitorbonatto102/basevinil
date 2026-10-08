import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const inputPath = process.argv[2];
const shouldApply = process.argv.includes("--apply");

if (!inputPath) {
  console.error("Uso: node scripts/import-adornos-list.mjs <lista.txt> [--apply]");
  process.exit(1);
}

const catalogPath = path.resolve("app/data/catalog.json");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const lines = (await readFile(path.resolve(inputPath), "utf8"))
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

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
  .replace(/[^a-z0-9]+/g, " ")
  .trim()
  .replace(/\s+/g, " ");

const titleKey = (value) => normalize(value)
  .replace(/\b(reedicao|lacrado|usado|lp|2lp|duplo|nacional|importado|vinil)\b/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const artistAliases = new Map([
  [normalize("A Split - Second"), normalize("A Split-Second")],
  [normalize("Adoniran Brabosa"), normalize("Adoniran Barbosa")],
  [normalize("BTO"), normalize("Bachman-Turner Overdrive")],
  [normalize("Benata"), normalize("Pat Benatar")],
  [normalize("CC Music Factory"), normalize("C+C Music Factory")],
  [normalize("Cindy Lauper"), normalize("Cyndi Lauper")],
  [normalize("Girl School"), normalize("Girlschool")],
  [normalize("Hamony Cats"), normalize("Harmony Cats")],
  [normalize("Jimmi Hendrix"), normalize("Jimi Hendrix")],
  [normalize("Mettalica"), normalize("Metallica")],
  [normalize("Motorhead"), normalize("Motörhead")],
  [normalize("Motohead"), normalize("Motörhead")],
  [normalize("Motley Crue"), normalize("Mötley Crüe")],
  [normalize("Oscar Perterson"), normalize("Oscar Peterson")],
  [normalize("Reinassance"), normalize("Renaissance")],
  [normalize("The Doobies"), normalize("The Doobie Brothers")],
  [normalize("The Sugar Cubes"), normalize("The Sugarcubes")],
  [normalize("Tlaking Heads"), normalize("Talking Heads")],
]);

const artistDisplayAliases = new Map([
  [normalize("A Split - Second"), "A Split-Second"],
  [normalize("Ac/Dc"), "AC/DC"],
  [normalize("Adoniran Brabosa"), "Adoniran Barbosa"],
  [normalize("Benata"), "Pat Benatar"],
  [normalize("Biquini Cavadao"), "Biquini Cavadão"],
  [normalize("CC Music Factory"), "C+C Music Factory"],
  [normalize("Camisa De Venus"), "Camisa de Vênus"],
  [normalize("Capoeria"), "Capoeira"],
  [normalize("Cindy Lauper"), "Cyndi Lauper"],
  [normalize("Diana Ross, Marvin Gaye"), "Diana Ross, Marvin Gaye"],
  [normalize("Guns´N´Roses"), "Guns N' Roses"],
  [normalize("Girl School"), "Girlschool"],
  [normalize("Freddie Mercury, Monserrat Cabalet"), "Freddie Mercury & Montserrat Caballé"],
  [normalize("Heróis da Resistencia"), "Heróis da Resistência"],
  [normalize("Harry Nilson, Ringo Starr"), "Harry Nilsson & Ringo Starr"],
  [normalize("Jimmi Hendrix"), "Jimi Hendrix"],
  [normalize("Mettalica"), "Metallica"],
  [normalize("Lobao"), "Lobão"],
  [normalize("Maria Bethania"), "Maria Bethânia"],
  [normalize("Miucha"), "Miúcha"],
  [normalize("Miucha & Tom"), "Miúcha & Tom"],
  [normalize("Motohead"), "Motörhead"],
  [normalize("Raíces De America"), "Raíces de América"],
  [normalize("Sá E Guarabyra"), "Sá & Guarabyra"],
  [normalize("The Sugar Cubes"), "The Sugarcubes"],
  [normalize("Tlaking Heads"), "Talking Heads"],
  [normalize("Yngwie J Malmsteen"), "Yngwie J. Malmsteen"],
]);

const artistKey = (value) => artistAliases.get(normalize(value)) ?? normalize(value);
const noContainedMatch = new Set([
  `${normalize("Capoeira")}\u0000${titleKey("Mestre Suassuna E Dirceu - Cordão De Ouro Vol 2")}`,
  `${normalize("Scorpions")}\u0000${titleKey("World")}`,
]);
const canonicalItems = new Map([
  [`${normalize("Chico Buarque")}\u0000${titleKey("A Ópera Do Malandro (2LP)")}`, { artist: "Chico Buarque", title: "Ópera Do Malandro (2LP)" }],
  [`${normalize("Coverdale")}\u0000${titleKey("Page")}`, { artist: "Coverdale/Page", title: "Coverdale/Page" }],
  [`${normalize("Mettalica")}\u0000${titleKey("Black Album (2LP)")}`, { artist: "Metallica", title: "Metallica (Black Album)" }],
  [`${normalize("The Firm")}\u0000${titleKey("Mean Bussiness")}`, { artist: "The Firm", title: "Mean Business" }],
  [`${normalize("Bruce Springsteen")}\u0000${titleKey("Asbury Park")}`, { artist: "Bruce Springsteen", title: "Greetings From Asbury Park, N.J." }],
  [`${normalize("BTO")}\u0000${titleKey("Freeways")}`, { artist: "Bachman-Turner Overdrive", title: "Freeways" }],
  [`${normalize("Márcia, Eduardo Gudin, PC Pinheiro")}\u0000${titleKey("O Imporante É Que Nossa Emoção Sobreviva")}`, { artist: "Márcia, Eduardo Gudin & Paulo César Pinheiro", title: "O Importante É Que Nossa Emoção Sobreviva" }],
  [`${normalize("Márcia, Eduardo Gudin, PC Pinheiro")}\u0000${titleKey("O Imporante É Que Nossa Emoção Sobreviva No2")}`, { artist: "Márcia, Eduardo Gudin & Paulo César Pinheiro", title: "O Importante É Que Nossa Emoção Sobreviva Nº 2" }],
  [`${normalize("Motley Crue")}\u0000${titleKey("Girls Girls Girls")}`, { artist: "Mötley Crüe", title: "Girls, Girls, Girls" }],
  [`${normalize("Motorhead")}\u0000${titleKey("Another Perfect Day")}`, { artist: "Motörhead", title: "Another Perfect Day" }],
  [`${normalize("Oscar Perterson")}\u0000${titleKey("The Way I Really Play")}`, { artist: "Oscar Peterson", title: "The Way I Really Play" }],
  [`${normalize("Elis Regina")}\u0000${titleKey("Saudade Do Brasil")}`, { artist: "Elis Regina", title: "Saudades Do Brasil (Box - 2 LP)" }],
  [`${normalize("Leandro & Leonardo")}\u0000${titleKey("1990")}`, { artist: "Leandro & Leonardo", title: "Leandro & Leonardo" }],
  [`${normalize("Hamony Cats")}\u0000${titleKey("Show")}`, { artist: "Harmony Cats", title: "The Harmony Cats Show" }],
  [`${normalize("Genesis")}\u0000${titleKey("Wind And Whutering")}`, { artist: "Genesis", title: "Winds & Wuthering" }],
  [`${normalize("Led Zeppelin")}\u0000${titleKey("House Of The Holy")}`, { artist: "Led Zeppelin", title: "Houses Of The Holy" }],
  [`${normalize("Lynyrd Skynyrd")}\u0000${titleKey("Seconds Helping")}`, { artist: "Lynyrd Skynyrd", title: "Second Helping" }],
  [`${normalize("Paul Simon")}\u0000${titleKey("The Rhythm Of The Saints")}`, { artist: "Paul Simon", title: "The Rhythm Of The Saints" }],
  [`${normalize("Reinassance")}\u0000${titleKey("Ashes Are Burning")}`, { artist: "Renaissance", title: "Ashes Are Burning" }],
  [`${normalize("Simply Red")}\u0000${titleKey("Man And Woman")}`, { artist: "Simply Red", title: "Men And Women" }],
  [`${normalize("Stevie Wonder")}\u0000${titleKey("In A Square Circle")}`, { artist: "Stevie Wonder", title: "In Square Circle" }],
  [`${normalize("The Beatles")}\u0000${titleKey("Os Reis Do Ie, Ie, Ie")}`, { artist: "The Beatles", title: "Help!" }],
  [`${normalize("The Beatles")}\u0000${titleKey("St Pepper´s")}`, { artist: "The Beatles", title: "Sgt. Pepper's Lonely Hearts Club Band" }],
  [`${normalize("The Cult")}\u0000${titleKey("Eletric")}`, { artist: "The Cult", title: "Electric" }],
  [`${normalize("The Doobies")}\u0000${titleKey("The Best Of")}`, { artist: "The Doobie Brothers", title: "Best Of The Doobies" }],
  [`${normalize("Biquini Cavadao")}\u0000${titleKey("A Era Da Inceteza")}`, { artist: "Biquini Cavadão", title: "A era da incerteza" }],
  [`${normalize("Camisa De Venus")}\u0000${titleKey("Correndo Risco")}`, { artist: "Camisa de Vênus", title: "Correndo o Risco" }],
  [`${normalize("Capital Inicial")}\u0000${titleKey("1986")}`, { artist: "Capital Inicial", title: "Capital Inicial" }],
  [`${normalize("Elton John")}\u0000${titleKey("Spleeping With The Past")}`, { artist: "Elton John", title: "Sleeping with the Past" }],
  [`${normalize("Heróis da Resistencia")}\u0000${titleKey("1986")}`, { artist: "Heróis da Resistência", title: "Heróis da Resistência" }],
  [`${normalize("Iron Maiden")}\u0000${titleKey("Power Slave")}`, { artist: "Iron Maiden", title: "Powerslave" }],
  [`${normalize("Raul Seixas")}\u0000${titleKey("Krig-Ha Bandolo")}`, { artist: "Raul Seixas", title: "Krig-Ha, Bondolo" }],
  [`${normalize("Rick Wakeman")}\u0000${titleKey("Journey To The Center Of The Earth")}`, { artist: "Rick Wakeman", title: "Journey To The Centre Of The Earth" }],
  [`${normalize("Tracy Chapman")}\u0000${titleKey("1988")}`, { artist: "Tracy Chapman", title: "Tracy Chapman" }],
  [`${normalize("A-Ha")}\u0000${titleKey("Scroundel Days")}`, { artist: "A-Ha", title: "Scoundrel Days" }],
  [`${normalize("Adoniran Brabosa")}\u0000${titleKey("1980")}`, { artist: "Adoniran Barbosa", title: "1980" }],
  [`${normalize("Harry Nilson, Ringo Starr")}\u0000${titleKey("Son Of Dracula")}`, { artist: "Harry Nilsson & Ringo Starr", title: "Son of Dracula" }],
  [`${normalize("Herb Alpert´s Tijuana Brass")}\u0000${titleKey("Whiped Cream & Other Delights")}`, { artist: "Herb Alpert's Tijuana Brass", title: "Whipped Cream & Other Delights" }],
  [`${normalize("Janis Joplin")}\u0000${titleKey("Cheao Thrills")}`, { artist: "Janis Joplin", title: "Cheap Thrills" }],
  [`${normalize("João Bosco")}\u0000${titleKey("Gagabiro")}`, { artist: "João Bosco", title: "Gagabirô" }],
  [`${normalize("João Bosco")}\u0000${titleKey("Tiro De Misericórdia")}`, { artist: "João Bosco", title: "Tiro De Misricórdia" }],
  [`${normalize("Joy Division")}\u0000${titleKey("Unknow Pleasures")}`, { artist: "Joy Division", title: "Unknown Pleasures" }],
  [`${normalize("Mano Negra")}\u0000${titleKey("King Of The Bongo")}`, { artist: "Mano Negra", title: "King of Bongo" }],
  [`${normalize("Miucha & Tom")}\u0000${titleKey("Micha & Antonio Carlos Jobim")}`, { artist: "Miúcha & Tom Jobim", title: "Miúcha & Antônio Carlos Jobim" }],
  [`${normalize("Rolling Stones")}\u0000${titleKey("Goat Head Soup")}`, { artist: "Rolling Stones", title: "Goats Head Soup" }],
  [`${normalize("Skyy Light")}\u0000${titleKey("Skyy")}`, { artist: "Skyy", title: "Skyy Light" }],
  [`${normalize("Supertramp")}\u0000${titleKey("Even In The Quiest Moments")}`, { artist: "Supertramp", title: "Even In The Quietest Moments..." }],
  [`${normalize("The Beatles")}\u0000${titleKey("St Peppers")}`, { artist: "The Beatles", title: "Sgt. Pepper's Lonely Hearts Club Band" }],
  [`${normalize("The Cure")}\u0000${titleKey("Kiss Me (2LP)")}`, { artist: "The Cure", title: "Kiss Me, Kiss Me, Kiss Me (2LP)" }],
  [`${normalize("Tlaking Heads")}\u0000${titleKey("Speaking In Toungues")}`, { artist: "Talking Heads", title: "Speaking in Tongues" }],
]);

const input = [];
for (let index = 0; index < lines.length; index += 3) {
  const [artist, title, priceText] = lines.slice(index, index + 3);
  const match = priceText.match(/^R\$\s*([0-9]+)(?:[.,]([0-9]{2}))?$/i);
  if (!match) throw new Error(`Preço inválido para ${artist} — ${title}: ${priceText}`);
  const canonical = canonicalItems.get(`${normalize(artist)}\u0000${titleKey(title)}`) ?? {
    artist: artistDisplayAliases.get(normalize(artist)) ?? artist,
    title,
  };
  input.push({ ...canonical, price: Number(match[1]) + Number(match[2] ?? 0) / 100 });
}

const groups = new Map();
for (const item of input) {
  const key = `${artistKey(item.artist)}\u0000${titleKey(item.title)}`;
  const group = groups.get(key) ?? { artist: item.artist, title: item.title, prices: [] };
  if (!group.prices.includes(item.price)) group.prices.push(item.price);
  groups.set(key, group);
}

const existingAdornos = (record) => record.adornosPrices?.length
  ? record.adornosPrices
  : record.adornosPrice != null ? [record.adornosPrice] : [];
const inferYear = (title) => {
  const match = title.match(/(?:^|\()((?:19|20)\d{2})(?:\)|$)/);
  return match ? Number(match[1]) : null;
};

const records = catalog.records;
const originalRecords = [...records];
const results = [];

for (const item of groups.values()) {
  const exact = records.filter((record) =>
    artistKey(record.artist) === artistKey(item.artist)
    && titleKey(record.title) === titleKey(item.title));
  let matched = exact.sort((a, b) => a.sourceRow - b.sourceRow)[0] ?? null;
  let method = matched ? "exact" : "new";

  if (!matched && !noContainedMatch.has(`${normalize(item.artist)}\u0000${titleKey(item.title)}`)) {
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
  results.push({ item, matched, method });
}

let nextSourceRow = Math.max(...records.map((record) => record.sourceRow)) + 1;
let added = 0;
let updated = 0;
let unchanged = 0;

for (const result of results) {
  const { item, matched } = result;
  if (matched) {
    const previous = existingAdornos(matched);
    const combined = [...previous];
    for (const price of item.prices) if (!combined.includes(price)) combined.push(price);
    if (combined.length === previous.length) {
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

  const prices = [...item.prices];
  records.push({
    id: `adornos-${nextSourceRow}`,
    sourceRow: nextSourceRow,
    lot: null,
    artist: item.artist,
    title: item.title,
    year: inferYear(item.title),
    auctionPrice: null,
    marketMin: null,
    market: [],
    tags: [],
    adornosPrice: prices[0],
    ...(prices.length > 1 ? { adornosPrice: undefined, adornosPrices: prices } : {}),
  });
  nextSourceRow += 1;
  added += 1;
}

if (!catalog.sources.includes("Adornos")) catalog.sources.push("Adornos");
catalog.generatedAt = new Date().toISOString();

console.log(JSON.stringify({
  inputRows: input.length,
  uniqueItems: groups.size,
  exact: results.filter((result) => result.method === "exact").length,
  contained: results.filter((result) => result.method === "contained").length,
  added,
  updated,
  unchanged,
}, null, 2));

console.log("\nCorrespondências por aproximação:");
for (const result of results.filter((entry) => entry.method === "contained")) {
  console.log(`- ${result.item.artist} — ${result.item.title} -> ${result.matched.artist} — ${result.matched.title}`);
}

console.log("\nNovas entradas:");
for (const result of results.filter((entry) => entry.method === "new")) {
  const sameArtist = originalRecords.filter((record) => artistKey(record.artist) === artistKey(result.item.artist));
  const candidates = sameArtist.length
    ? ` [existentes: ${sameArtist.map((record) => `${record.title} (#${record.sourceRow})`).join(" | ")}]`
    : "";
  console.log(`- ${result.item.artist} — ${result.item.title}: R$ ${result.item.prices.join("/")}${candidates}`);
}

if (shouldApply) {
  await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(`\nCatálogo atualizado em ${catalogPath}`);
} else {
  console.log("\nSimulação concluída; use --apply para gravar.");
}
