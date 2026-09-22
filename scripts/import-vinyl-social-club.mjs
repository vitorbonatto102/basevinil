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
  .replace(/\b(usado|lp|2lp|3lp|4lp|duplo|nacional|importado|importada|vinil|reedicao|picture|180g)\b/g, " ")
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
  [normalize("Adriana Calcanhoto"), normalize("Adriana Calcanhotto")],
  [normalize("Beach Boys"), normalize("The Beach Boys")],
  [normalize("Big Brother Holding and the Company (Janis Joplin)"), normalize("Big Brother & The Holding Company")],
  [normalize("Cleedence Clearwater Revival"), normalize("Creedence Clearwater Revival")],
  [normalize("Clube da Esquina - Milton Nascimento/ Lo Borges"), normalize("Milton Nascimento & Lô Borges")],
  [normalize("Eletric Light Orchestra"), normalize("Electric Light Orchestra")],
  [normalize("Fagner (Raimundo Fagner)"), normalize("Fagner")],
  [normalize("Gangstaar"), normalize("Gang Starr")],
  [normalize("Nothing Hillbillies"), normalize("The Notting Hillbillies")],
  [normalize("Queen Of the Stone Age"), normalize("Queens of the Stone Age")],
  [normalize("Spryro Gyra"), normalize("Spyro Gyra")],
  [normalize("Temple of the Dogs"), normalize("Temple of the Dog")],
  [normalize("Type o Negative"), normalize("Type O Negative")],
  [normalize("Krafterwerk"), normalize("Kraftwerk")],
  [normalize("Led Zepellin"), normalize("Led Zeppelin")],
  [normalize("Replicantes"), normalize("Os Replicantes")],
]);

const artistKey = (value) => artistAliases.get(normalize(value)) ?? normalize(value);
const artistDisplayAliases = new Map([
  [normalize("Adriana Calcanhoto"), "Adriana Calcanhotto"],
  [normalize("Beach Boys"), "The Beach Boys"],
  [normalize("Beatles"), "The Beatles"],
  [normalize("Big Brother Holding and the Company (Janis Joplin)"), "Big Brother & The Holding Company"],
  [normalize("Cassia Eller"), "Cássia Eller"],
  [normalize("Cleedence Clearwater Revival"), "Creedence Clearwater Revival"],
  [normalize("Clube da Esquina - Milton Nascimento/ Lo Borges"), "Milton Nascimento & Lô Borges"],
  [normalize("Eletric Light Orchestra"), "Electric Light Orchestra"],
  [normalize("Fagner (Raimundo Fagner)"), "Fagner"],
  [normalize("Gangstaar"), "Gang Starr"],
  [normalize("Milionarios e Jose Rico"), "Milionários & José Rico"],
  [normalize("Nene Capitão e Messias de Jesus"), "Nenê Capitão & Messias de Jesus"],
  [normalize("Nona Hendrix"), "Nona Hendryx"],
  [normalize("Nothing Hillbillies"), "The Notting Hillbillies"],
  [normalize("Queen Of the Stone Age"), "Queens of the Stone Age"],
  [normalize("Rpm"), "RPM"],
  [normalize("Som Imaginario"), "Som Imaginário"],
  [normalize("Spryro Gyra"), "Spyro Gyra"],
  [normalize("Temple of the Dogs"), "Temple of the Dog"],
  [normalize("The Marias"), "The Marías"],
  [normalize("Type o Negative"), "Type O Negative"],
  [normalize("Krafterwerk"), "Kraftwerk"],
  [normalize("Led Zepellin"), "Led Zeppelin"],
  [normalize("Replicantes"), "Os Replicantes"],
  [normalize("Wasp"), "W.A.S.P."],
  [normalize("Vania Bastos"), "Vânia Bastos"],
  [normalize("Who"), "The Who"],
]);
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
  [`${normalize("Barão Vermelho")}\u0000${titleKey("Primeiro")}`, { artist: "Barão Vermelho", title: "Barão" }],
  [`${normalize("Big Brother Holding and the Company (Janis Joplin)")}\u0000${titleKey("Cheaper Thrills")}`, { artist: "Big Brother & The Holding Company", title: "Cheap Thrills" }],
  [`${normalize("Clube da Esquina - Milton Nascimento/ Lo Borges")}\u0000${titleKey("cod 164 422902")}`, { artist: "Milton Nascimento & Lô Borges", title: "Clube da Esquina" }],
  [`${normalize("Clube da Esquina - Milton Nascimento/ Lo Borges")}\u0000${titleKey("Reedição Importada Capa Simples")}`, { artist: "Milton Nascimento & Lô Borges", title: "Clube da Esquina" }],
  [`${normalize("Cyndi Lauper")}\u0000${titleKey("Twelve Deadly Cyns and then Some")}`, { artist: "Cyndi Lauper", title: "Twelve Deadly Guns" }],
  [`${normalize("Elvis Presley")}\u0000${titleKey("Now")}`, { artist: "Elvis Presley", title: "Elvis Now" }],
  [`${normalize("Jorge Ben")}\u0000${titleKey("Tabua de Esmeralda (Reedição)")}`, { artist: "Jorge Ben", title: "A Tábua De Esmeralda" }],
  [`${normalize("Milt Jackson")}\u0000${titleKey("Be Bop")}`, { artist: "Milt Jackson", title: "Bob Bop" }],
  [`${normalize("Renaissance")}\u0000${titleKey("Ashes Are Buring")}`, { artist: "Renaissance", title: "Ashes Are Burning" }],
  [`${normalize("Rolling Stones")}\u0000${titleKey("Thought the Past Darkly (Big Hits Vol.2) (Reedição)")}`, { artist: "The Rolling Stones", title: "Throgh The Past, Darkly" }],
  [`${normalize("Sepultura")}\u0000${titleKey("Beneath the Remais")}`, { artist: "Sepultura", title: "Beneath The Remains" }],
  [`${normalize("Secos e Molhados")}\u0000${titleKey("Primeiro Album (Reedição)")}`, { artist: "Secos & Molhados", title: "1973" }],
  [`${normalize("Tim Maia")}\u0000${titleKey("(Contém Não Quero Dinheiro)")}`, { artist: "Tim Maia", title: "Tim Maia" }],
  [`${normalize("Al Jarreau")}\u0000${titleKey("Is For Love")}`, { artist: "Al Jarreau", title: "L Is for Lover" }],
  [`${normalize("Carly Simon")}\u0000${titleKey("The Best")}`, { artist: "Carly Simon", title: "The Best Of" }],
  [`${normalize("Cyndi Lauper")}\u0000${titleKey("Night to Remeber")}`, { artist: "Cyndi Lauper", title: "A Night to Remember" }],
  [`${normalize("Dad")}\u0000${titleKey("No Fuel Left For")}`, { artist: "D-A-D", title: "No Fuel Left for the Pilgrims" }],
  [`${normalize("Dio")}\u0000${titleKey("Angay Machines")}`, { artist: "Dio", title: "Angry Machines" }],
  [`${normalize("DMM")}\u0000${titleKey("Born Like This")}`, { artist: "DOOM", title: "Born Like This" }],
  [`${normalize("Genesis")}\u0000${titleKey("Invisible TOuch")}`, { artist: "Genesis", title: "Invisible Touch" }],
  [`${normalize("Judas Priest")}\u0000${titleKey("British Steel (Reedição")}`, { artist: "Judas Priest", title: "British Steel (reedição)" }],
  [`${normalize("Malevolant Assault of TOmorrow")}\u0000${titleKey("Violent Force")}`, { artist: "Violent Force", title: "Malevolent Assault of Tomorrow" }],
  [`${normalize("Nothing Hillbillies")}\u0000${titleKey("Missing")}`, { artist: "The Notting Hillbillies", title: "Missing... Presumed Having a Good Time" }],
  [`${normalize("Rush")}\u0000${titleKey("Roll the Bonus")}`, { artist: "Rush", title: "Roll the Bones" }],
  [`${normalize("Sepultura")}\u0000${titleKey("Morbid e Visions")}`, { artist: "Sepultura", title: "Morbid Visions" }],
  [`${normalize("Temple of the Dogs")}\u0000${titleKey("1991")}`, { artist: "Temple of the Dog", title: "Temple of the Dog (1991)" }],
  [`${normalize("Tent")}\u0000${titleKey("Intuition")}`, { artist: "TNT", title: "Intuition" }],
  [`${normalize("Toto")}\u0000${titleKey("Past to Presence")}`, { artist: "Toto", title: "Past to Present 1977–1990" }],
  [`${normalize("Weather Report")}\u0000${titleKey("Sportin Life")}`, { artist: "Weather Report", title: "Sportin' Life" }],
  [`${normalize("Big Audio Dynamite")}\u0000${titleKey("This is/ New Rock Collection")}`, { artist: "Big Audio Dynamite", title: "This Is Big Audio Dynamite" }],
  [`${normalize("Chico Science & Nação Zumbi")}\u0000${titleKey("Afrociderbelia (reedição)")}`, { artist: "Chico Science & Nação Zumbi", title: "Afrociberdelia" }],
  [`${normalize("Clube da Esquina")}\u0000${titleKey("Milton Nascimento e Lô Borges")}`, { artist: "Milton Nascimento & Lô Borges", title: "Clube da Esquina" }],
  [`${normalize("Depeche Mode")}\u0000${titleKey("Music fot the Masses")}`, { artist: "Depeche Mode", title: "Music for the Masses" }],
  [`${normalize("Duran Duran")}\u0000${titleKey("Notorius")}`, { artist: "Duran Duran", title: "Notorious" }],
  [`${normalize("Elis Regina")}\u0000${titleKey("Trem Azul")}`, { artist: "Elis Regina", title: "Trem Azul (2LP)" }],
  [`${normalize("Elvis Presley")}\u0000${titleKey("Sing the Blues")}`, { artist: "Elvis Presley", title: "Sings the Blues" }],
  [`${normalize("Ira!")}\u0000${titleKey("Psicoacustica")}`, { artist: "Ira!", title: "Psicoacústica" }],
  [`${normalize("João Mineiro e Marciano")}\u0000${titleKey("Tarde Para Esquecer")}`, { artist: "João Mineiro & Marciano", title: "Tarde Demais Para Esquecer" }],
  [`${normalize("Krafterwerk")}\u0000${titleKey("Computer World")}`, { artist: "Kraftwerk", title: "Computer World" }],
  [`${normalize("Led Zepellin")}\u0000${titleKey("House of the Holy")}`, { artist: "Led Zeppelin", title: "Houses Of The Holy" }],
  [`${normalize("Legião Urbana")}\u0000${titleKey("Música P/ Acampamento")}`, { artist: "Legião Urbana", title: "Música para Acampamentos" }],
  [`${normalize("Lo Borges")}\u0000${titleKey("Tenis (Reedição)")}`, { artist: "Lô Borges", title: "Lô Borges (Disco do Tênis)" }],
  [`${normalize("Milionario e José Rico")}\u0000${titleKey("Vol. 14")}`, { artist: "Milionário & José Rico", title: "Vol. 14" }],
  [`${normalize("Planet Hemp")}\u0000${titleKey("Os Cães Ladram mas a Caravana não Pará (reedição)")}`, { artist: "Planet Hemp", title: "Os Cães Ladram mas a Caravana Não Para" }],
  [`${normalize("Pink Floyd")}\u0000${titleKey("Atom Heart")}`, { artist: "Pink Floyd", title: "Atom Heart Mother" }],
  [`${normalize("Replicantes")}\u0000${titleKey("O Futuro é Vortwx")}`, { artist: "Os Replicantes", title: "O Futuro É Vortex" }],
  [`${normalize("Rob Zombie")}\u0000${titleKey("Helbilly Deluxe")}`, { artist: "Rob Zombie", title: "Hellbilly Deluxe" }],
  [`${normalize("Rolling Stones")}\u0000${titleKey("Voodo Lounge")}`, { artist: "The Rolling Stones", title: "Voodoo Lounge" }],
  [`${normalize("Scorpions")}\u0000${titleKey("Face the Heart")}`, { artist: "Scorpions", title: "Face the Heat" }],
  [`${normalize("Secos e Molhados")}\u0000${titleKey("Primeiro (Reedição)")}`, { artist: "Secos & Molhados", title: "1973" }],
  [`${normalize("Secos e Molhados")}\u0000${titleKey("II (Reedição)")}`, { artist: "Secos & Molhados", title: "2" }],
  [`${normalize("Titãs")}\u0000${titleKey("Tudo Ao Mesmo Tempos Agora")}`, { artist: "Titãs", title: "Tudo Ao Mesmo Tempo Agora" }],
  [`${normalize("Titãs")}\u0000${titleKey("Cabeça Dinossauro (Reediçõ)")}`, { artist: "Titãs", title: "Cabeça Dinossauro" }],
  [`${normalize("Tribalistas")}\u0000${titleKey("Primeiro 2002")}`, { artist: "Tribalistas", title: "Tribalistas (2002)" }],
  [`${normalize("Wasp")}\u0000${titleKey("Inside theE Eletric Circus")}`, { artist: "W.A.S.P.", title: "Inside the Electric Circus" }],
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

const records = catalog.records;
const originalRecords = [...records];
const results = [];
for (const item of groups.values()) {
  const exact = records.filter((record) => artistKey(record.artist) === artistKey(item.artist) && titleKey(record.title) === titleKey(item.title));
  let matched = exact.length >= 1 ? exact.sort((a, b) => a.sourceRow - b.sourceRow)[0] : null;
  let method = matched ? "exact" : "new";

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
  catalog.generatedAt = new Date().toISOString();
  fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`\nCatálogo atualizado em ${catalogPath}`);
} else {
  console.log("\nSimulação concluída; use --apply para gravar.");
}
