import { readFile, writeFile } from "node:fs/promises";

const catalogUrl = new URL("../app/data/catalog.json", import.meta.url);
const checkedAt = "2026-08-20";

const research = [
  {
    sourceRow: 27,
    observation: {
      source: "OLX", display: "R$ 80/100", numeric: 80,
      url: "https://www.olx.com.br/anuncios/vinil-decorativo",
      status: "anúncios ativos indexados", edition: "LP nacional de época; um comparável identificado como Brasil 1985",
      condition: "um anúncio VG+/EX, sem encarte", shipping: "não informado",
      note: "Faixa de pedidos ativos diretamente identificáveis; frete não incluído.",
    },
  },
  {
    sourceRow: 51,
    observation: {
      source: "Mercado Livre", display: "R$ 90/97,78", numeric: 90,
      url: "https://lista.mercadolivre.com.br/lp-siouxsie-and-the-banshees-once-upon-a-time-the-singles",
      status: "anúncios ativos indexados", edition: "LP usado; anúncio de 1986 com encarte entre os comparáveis",
      condition: "usado; conservação varia por anúncio", shipping: "frete grátis em comparáveis indexados",
      note: "Pedidos ativos; não são vendas concluídas.",
    },
  },
  {
    sourceRow: 86,
    observation: {
      source: "Mercado Livre", display: "R$ 110/180/210", numeric: 110,
      url: "https://lista.mercadolivre.com.br/lp-beatles-beatlemania",
      status: "anúncios ativos indexados", edition: "LP nacional; R$ 180 inclui prensagem mono de 1973",
      condition: "usado; conservação varia por anúncio", shipping: "frete grátis em parte dos comparáveis",
      note: "O anúncio de R$ 110 não informa a prensagem no resultado; confirmar edição antes de comparar.",
    },
  },
  {
    sourceRow: 101,
    observation: {
      source: "Mercado Livre", display: "R$ 109/249,90", numeric: 109,
      url: "https://lista.mercadolivre.com.br/santana-abraxas-lp-vinil",
      status: "anúncios ativos indexados", edition: "LP nacional usado; comparável de R$ 249,90 descrito como CBS mono 1970",
      condition: "usado; conservação varia por anúncio", shipping: "frete grátis no comparável de R$ 109",
      note: "Faixa mistura prensagens nacionais; confirmar selo/ano do exemplar.",
    },
  },
  {
    sourceRow: 109,
    observation: {
      source: "OLX", display: "R$ 100", numeric: 100,
      url: "https://sp.olx.com.br/sao-paulo-e-regiao/cds-dvds/lp-vinil-raul-seixas-rock-vol-2-1986-vg-vg-1498757813",
      status: "anúncio ativo", edition: "LP Brasil 1986",
      condition: "disco VG+ / capa VG", shipping: "não informado",
      note: "Preço pedido; anúncio indicava redução de R$ 170 para R$ 100.",
    },
  },
  {
    sourceRow: 127,
    observation: {
      source: "OLX", display: "R$ 120/140/279", numeric: 120,
      url: "https://www.olx.com.br/anuncios/rita-lee-lp",
      status: "anúncios ativos indexados", edition: "LP Brasil 1981; comparáveis de R$ 140 e R$ 279 com encarte e fan card",
      condition: "R$ 279 descrito como EX; demais variam", shipping: "não informado",
      note: "Acessórios explicam parte da dispersão; confirmar se o exemplar está completo.",
    },
  },
  {
    sourceRow: 132,
    observation: {
      source: "OLX", display: "R$ 18/25/120", numeric: 18,
      url: "https://www.olx.com.br/cds-dvds/discos-de-vinil/estado-al",
      status: "anúncios ativos indexados", edition: "LP de época; edição não detalhada nos resultados mais baratos",
      condition: "não informada nos resultados", shipping: "não informado",
      note: "Grande dispersão; os preços baixos exigem checagem de estado e disponibilidade.",
    },
  },
  {
    sourceRow: 141,
    observation: {
      source: "Mercado Livre", display: "R$ 35/39/56/65", numeric: 35,
      url: "https://lista.mercadolivre.com.br/lp-vinil-plebe-rude-nunca-fomos-tao-brasileiros-novissimo",
      status: "anúncios ativos indexados", edition: "LP Brasil 1987; comparável de R$ 56 com encarte",
      condition: "usado; conservação varia por anúncio", shipping: "não informado",
      note: "Pedidos ativos; conferir encarte e estado nos exemplares mais baratos.",
    },
  },
  {
    sourceRow: 305,
    observation: {
      source: "OLX", display: "R$ 60/62", numeric: 60,
      url: "https://www.olx.com.br/anuncios/david-bowie",
      status: "anúncios ativos indexados", edition: "LP da trilha Labyrinth; prensagem não informada no resultado",
      condition: "não informada", shipping: "não informado",
      note: "Confirmar se é o LP completo de 1986 e não reedição ou item decorativo.",
    },
  },
  {
    sourceRow: 351,
    observation: {
      source: "OLX", display: "R$ 150/195", numeric: 150,
      url: "https://www.olx.com.br/musica-e-hobbies/estado-pb/paraiba",
      status: "anúncios ativos indexados", edition: "LP Janet Jackson — Control",
      condition: "não informada", shipping: "não informado",
      note: "Dois pedidos ativos indexados; confirmar prensagem e encarte.",
    },
  },
  {
    sourceRow: 397,
    observation: {
      source: "OLX", display: "R$ 329", numeric: 329,
      url: "https://www.olx.com.br/cds-dvds/discos-de-vinil/estado-al/alagoas/maceio",
      status: "anúncio ativo indexado", edition: "LP original 1992 com encarte",
      condition: "não graduada no resultado", shipping: "frete grátis anunciado",
      note: "Preço pedido; sem venda concluída verificada.",
    },
  },
  {
    sourceRow: 464,
    observation: {
      source: "OLX", display: "R$ 120", numeric: 120,
      url: "https://www.olx.com.br/cds-dvds/estado-sp/sao-paulo-e-regiao/mogi-das-cruzes/jardim-piata-b",
      status: "anúncio ativo indexado", edition: "LP Talking Heads — Naked, 1988",
      condition: "não informada", shipping: "não informado",
      note: "Preço pedido; confirmar prensagem e conservação.",
    },
  },
  {
    sourceRow: 489,
    observation: {
      source: "OLX", display: "R$ 100/120", numeric: 100,
      url: "https://www.olx.com.br/anuncios/deep-purple",
      status: "anúncios ativos indexados", edition: "LP; comparável de R$ 120 descrito como importado",
      condition: "não informada", shipping: "não informado",
      note: "Confirmar a prensagem do exemplar de R$ 100 antes de comparar.",
    },
  },
  {
    sourceRow: 492,
    observation: {
      source: "OLX", display: "R$ 80/140", numeric: 80,
      url: "https://www.olx.com.br/cds-dvds/estado-sp/grande-campinas/sumare/vila-juliana",
      status: "anúncios ativos indexados", edition: "LP de estreia 1988; comparável de R$ 140 original com encarte",
      condition: "varia; R$ 140 anunciado como completo", shipping: "não informado",
      note: "O anúncio de R$ 80 não detalha encarte no resultado.",
    },
  },
  {
    sourceRow: 497,
    observation: {
      source: "Mercado Livre", display: "R$ 108,13/119,95/123", numeric: 108.13,
      url: "https://lista.mercadolivre.com.br/the-smiths-singles",
      status: "anúncios ativos indexados", edition: "single/12 polegadas Panic, Rough Trade, 1987",
      condition: "usado; conservação varia por anúncio", shipping: "frete grátis nos comparáveis indexados",
      note: "Comparado como single, não como LP de estúdio.",
    },
  },
];

const catalog = JSON.parse(await readFile(catalogUrl, "utf8"));
const changed = [];

for (const item of research) {
  const record = catalog.records.find((candidate) => candidate.sourceRow === item.sourceRow);
  if (!record) throw new Error(`Linha ${item.sourceRow} não encontrada.`);
  if (record.market.length > 0 || record.adornosPrice != null || record.adornosPrices?.length) {
    throw new Error(`Linha ${item.sourceRow} já possui dados; importação interrompida para preservá-los.`);
  }

  const observation = { ...item.observation, checkedAt };
  record.market.push(observation);
  record.marketMin = observation.numeric;
  if (record.auctionPrice === 19) record.auctionPriceStatus = "unverified-copy";
  changed.push(`${record.artist} — ${record.title}: ${observation.source} ${observation.display}`);
}

for (const source of ["Mercado Livre", "OLX"]) {
  if (!catalog.sources.includes(source)) catalog.sources.push(source);
}
catalog.generatedAt = new Date().toISOString();

await writeFile(catalogUrl, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(`Importados ${changed.length} registros sem sobrescrever dados existentes.`);
for (const line of changed) console.log(`- ${line}`);
