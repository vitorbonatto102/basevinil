"use client";

import { useEffect, useMemo, useState } from "react";
import catalog from "./data/catalog.json";

type MarketObservation = {
  source: string;
  display: string;
  numeric: number | null;
};

type CatalogRecord = {
  id: string;
  sourceRow: number;
  lot: number | null;
  artist: string;
  title: string;
  year: number | null;
  auctionPrice: number | null;
  marketMin: number | null;
  market: MarketObservation[];
  tags: string[];
  adornosPrice?: number | null;
  adornosPrices?: number[];
};

type AuctionWatch = {
  lot: number;
  artist: string;
  title: string;
  date: string;
  condition: string;
  currentBid: number;
  nextBid: number;
  bidLabel?: string;
  ceiling: number;
  priority: string;
  tone: "high" | "medium" | "careful";
  note: string;
  url: string;
};

type AuctionEvent = {
  id: string;
  house: string;
  title: string;
  dates: string;
  costs: string;
  catalogUrl: string;
  updatedAt: string;
  items: AuctionWatch[];
};

const records = catalog.records as CatalogRecord[];

const auctionWatch: AuctionWatch[] = [
  {
    lot: 136,
    artist: "Creedence Clearwater Revival",
    title: "Cosmo's Factory",
    date: "24 ago · 15h",
    condition: "Disco e capa em bom estado",
    currentBid: 20,
    nextBid: 30,
    ceiling: 60,
    priority: "Prioridade alta",
    tone: "high",
    note: "Lance inicial muito baixo; confirmar prensagem antes de ampliar o teto.",
    url: "https://www.bruceangeirasleiloeiro.com.br/peca.asp?ID=31542996",
  },
  {
    lot: 52,
    artist: "INXS",
    title: "Kick",
    date: "24 ago · 15h",
    condition: "Disco e capa em bom estado",
    currentBid: 40,
    nextBid: 50,
    ceiling: 75,
    priority: "Prioridade alta",
    tone: "high",
    note: "Confirmar prensagem e encarte.",
    url: "https://www.bruceangeirasleiloeiro.com.br/peca.asp?ID=31531012",
  },
  {
    lot: 687,
    artist: "The Beatles",
    title: "Love Songs (2LP)",
    date: "26 ago · 15h",
    condition: "Discos em bons estados; capa com leves desgastes",
    currentBid: 30,
    nextBid: 40,
    ceiling: 60,
    priority: "Prioridade alta",
    tone: "high",
    note: "LP duplo; referência Adornos da lista: R$ 109. Edição não confirmada.",
    url: "https://www.bruceangeirasleiloeiro.com.br/peca.asp?ID=31729609",
  },
  {
    lot: 604,
    artist: "Grand Funk",
    title: "Phoenix",
    date: "25 ago · 15h",
    condition: "Leves riscos; capa com desgaste nas extremidades",
    currentBid: 40,
    nextBid: 50,
    ceiling: 50,
    priority: "Cautela",
    tone: "careful",
    note: "Não disputar acima do próximo lance sem rever o mercado.",
    url: "https://www.bruceangeirasleiloeiro.com.br/peca.asp?ID=31719579",
  },
  {
    lot: 608,
    artist: "Queen",
    title: "The Game",
    date: "25 ago · 15h",
    condition: "Leves arranhados; capa com desgastes",
    currentBid: 20,
    nextBid: 30,
    ceiling: 50,
    priority: "Boa aposta",
    tone: "medium",
    note: "Estado segura o teto; referência Adornos da lista: R$ 109.",
    url: "https://www.bruceangeirasleiloeiro.com.br/peca.asp?ID=31720761",
  },
  {
    lot: 643,
    artist: "Grand Funk Railroad",
    title: "Survival",
    date: "26 ago · 15h",
    condition: "Disco e capa em ótimo estado",
    currentBid: 60,
    nextBid: 70,
    ceiling: 110,
    priority: "1ª prioridade",
    tone: "high",
    note: "Melhor relação entre estado, lance e referências atuais.",
    url: "https://www.bruceangeirasleiloeiro.com.br/peca.asp?ID=31726396",
  },
  {
    lot: 644,
    artist: "Grand Funk Railroad",
    title: "E Pluribus Funk",
    date: "26 ago · 15h",
    condition: "Disco bom; capa com leves desgastes",
    currentBid: 70,
    nextBid: 80,
    ceiling: 110,
    priority: "Prioridade alta",
    tone: "medium",
    note: "Piso ativo visto: R$ 185. Confirmar encarte/moeda.",
    url: "https://www.bruceangeirasleiloeiro.com.br/peca.asp?ID=31726422",
  },
];

const rtAuctionWatch: AuctionWatch[] = [
  {
    lot: 198,
    artist: "R.E.M.",
    title: "Out Of Time",
    date: "25 ago",
    condition: "Com encarte; capa com pequenos desgastes; disco com riscos sutis",
    currentBid: 50,
    nextBid: 55,
    ceiling: 110,
    priority: "Melhor do catálogo",
    tone: "high",
    note: "Nacional de 1991. Anúncios ativos comparáveis começam em R$ 139; testar os riscos antes de subir o teto.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32153082",
  },
  {
    lot: 200,
    artist: "Gal Costa",
    title: "Plural",
    date: "25 ago",
    condition: "Com encarte; capa com pequenos desgastes; risco superficial no disco",
    currentBid: 10,
    nextBid: 15,
    ceiling: 40,
    priority: "Garimpo forte",
    tone: "high",
    note: "Edição de 1990. Piso ativo visto em R$ 44–49; várias cópias entre R$ 63 e R$ 90.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152815",
  },
  {
    lot: 64,
    artist: "Finis Africae",
    title: "Finis Africae",
    date: "24 ago",
    condition: "Com encarte; capa com desgastes; risco bem sutil no disco",
    currentBid: 15,
    nextBid: 15,
    bidLabel: "Abertura",
    ceiling: 40,
    priority: "Garimpo forte",
    tone: "high",
    note: "Edição EMI de 1987. Comparáveis ativos aparecem de R$ 50 a R$ 89; não confundir com o mini-LP.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152978",
  },
  {
    lot: 363,
    artist: "Killing Joke",
    title: "Brighter Than A Thousand Suns",
    date: "26 ago",
    condition: "Capa dupla e encarte; desgaste leve; risco superficial sem afetar a reprodução",
    currentBid: 40,
    nextBid: 45,
    ceiling: 90,
    priority: "Boa oportunidade",
    tone: "high",
    note: "Comparável brasileiro localizado a R$ 185,55; confiança média porque a amostra ainda é pequena.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152948",
  },
  {
    lot: 211,
    artist: "Cazuza",
    title: "Burguesia (2LP)",
    date: "25 ago",
    condition: "Com encarte; capa e os dois discos em bom estado",
    currentBid: 35,
    nextBid: 40,
    ceiling: 55,
    priority: "Boa oportunidade",
    tone: "high",
    note: "Original duplo de 1989. Piso comparável ativo em torno de R$ 65–79; cópias completas aparecem acima disso.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152967",
  },
  {
    lot: 118,
    artist: "Zero",
    title: "Passos no Escuro",
    date: "24 ago",
    condition: "Com encarte; capa e disco em bom estado",
    currentBid: 15,
    nextBid: 15,
    bidLabel: "Abertura",
    ceiling: 30,
    priority: "Boa oportunidade",
    tone: "high",
    note: "Comparáveis ativos começam perto de R$ 35–40, com várias cópias entre R$ 58 e R$ 85.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152951",
  },
  {
    lot: 77,
    artist: "The Alan Parsons Project",
    title: "The Turn Of A Friendly Card",
    date: "24 ago",
    condition: "Capa com pequenos desgastes; risco superficial em uma faixa",
    currentBid: 20,
    nextBid: 20,
    bidLabel: "Abertura",
    ceiling: 45,
    priority: "Você marcou",
    tone: "high",
    note: "Comparáveis ativos aparecem por R$ 73–80; o risco em uma faixa segura o teto.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32153078",
  },
  {
    lot: 435,
    artist: "Pink Floyd",
    title: "Animals",
    date: "26 ago",
    condition: "Capa dupla e encarte; capa gasta; muitos riscos, com raros estalos",
    currentBid: 50,
    nextBid: 50,
    bidLabel: "Abertura",
    ceiling: 65,
    priority: "Você marcou · cautela",
    tone: "careful",
    note: "Cópias nacionais melhores passam de R$ 239, mas esta é uma cópia de audição arriscada; não pagar preço de VG.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152847",
  },
  {
    lot: 442,
    artist: "O Têrço",
    title: "Mudança de Tempo",
    date: "26 ago",
    condition: "Reedição de 1991; capa dupla e encarte; capa e disco em bom estado",
    currentBid: 60,
    nextBid: 65,
    ceiling: 65,
    priority: "Só até o teto",
    tone: "medium",
    note: "Há anúncios da mesma reedição por R$ 80–89; a margem desaparece rapidamente com comissão e frete.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152952",
  },
  {
    lot: 14,
    artist: "Jorge Ben",
    title: "Sonsual",
    date: "24 ago",
    condition: "Com encarte; capa com pequenos desgastes; disco em bom estado",
    currentBid: 60,
    nextBid: 65,
    ceiling: 60,
    priority: "Você marcou · passar",
    tone: "careful",
    note: "Já existe cópia equivalente anunciada por R$ 50. Com 5%, o lance atual vira R$ 63 antes do frete.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152938",
  },
];

const auctionEvents: AuctionEvent[] = [
  {
    id: "rt-leiloes-64580",
    house: "RT Leilões",
    title: "LD Colecionismo · Vinis, CDs e DVDs",
    dates: "24, 25 e 26 de agosto",
    costs: "5% de comissão + frete/embalagem",
    catalogUrl: "https://www.rtleiloes.com.br/catalogo.asp?Num=64580&p=on&Dia=&Tipo=&artista=&pesquisa=&Srt=10",
    updatedAt: "20 ago 2026",
    items: rtAuctionWatch,
  },
  {
    id: "bruce-angeiras-63353",
    house: "Bruce Angeiras",
    title: "47º Meier · 8º exclusivo de mídias",
    dates: "24, 25 e 26 de agosto · 15h",
    costs: "5% de comissão + frete",
    catalogUrl: "https://www.bruceangeirasleiloeiro.com.br/catalogo.asp?Num=63353&fav=1&p=on",
    updatedAt: "20 ago 2026",
    items: auctionWatch,
  },
];

const auctionWatchCount = auctionEvents.reduce((total, event) => total + event.items.length, 0);

function auctionGroups(items: AuctionWatch[]) {
  const grouped = new Map<string, AuctionWatch[]>();
  [...items]
    .sort((a, b) => (Number.parseInt(a.date, 10) - Number.parseInt(b.date, 10)) || a.lot - b.lot)
    .forEach((item) => grouped.set(item.date, [...(grouped.get(item.date) ?? []), item]));
  return [...grouped.entries()];
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function money(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function exactMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function source(record: CatalogRecord, name: string) {
  return record.market.find((item) => item.source === name)?.display ?? "—";
}

function adornosValues(record: CatalogRecord) {
  const values = record.adornosPrices?.length
    ? record.adornosPrices
    : record.adornosPrice != null
      ? [record.adornosPrice]
      : [];
  return [...new Set(values.filter((value) => value > 0))];
}

function adornosDisplay(record: CatalogRecord) {
  const values = adornosValues(record);
  if (!values.length) return "—";
  const formatted = values.map((value) => new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0,
  }).format(value));
  return `R$ ${formatted.join("/")}`;
}

function referencePrice(record: CatalogRecord) {
  const values = [record.auctionPrice, record.marketMin, ...adornosValues(record)].filter(
    (value): value is number => value !== null && value > 0,
  );
  return values.length ? Math.min(...values) : null;
}

function assessment(offer: number | null, reference: number | null) {
  if (offer === null) return { label: "—", tone: "neutral", delta: null };
  if (reference === null) return { label: "Sem referência", tone: "unknown", delta: null };
  const delta = Math.round(((offer - reference) / reference) * 100);
  if (offer <= reference * 0.7) return { label: "Muito barato", tone: "great", delta };
  if (offer <= reference * 0.9) return { label: "Barato", tone: "good", delta };
  if (offer <= reference * 1.1) return { label: "Na faixa", tone: "fair", delta };
  return { label: "Caro", tone: "high", delta };
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [decade, setDecade] = useState("todas");
  const [coverage, setCoverage] = useState("todos");
  const [sort, setSort] = useState("artista");
  const [offers, setOffers] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("preco-de-disco-ofertas");
      if (saved) setOffers(JSON.parse(saved));
    } catch { /* preferência local opcional */ }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("preco-de-disco-ofertas", JSON.stringify(offers));
    } catch { /* preferência local opcional */ }
  }, [offers]);

  const decades = useMemo(
    () => [...new Set(records.flatMap((record) => record.year ? [Math.floor(record.year / 10) * 10] : []))].sort(),
    [],
  );

  const filtered = useMemo(() => {
    const needle = normalize(query.trim());
    return records
      .filter((record) => {
        const matchesQuery = !needle || normalize(`${record.artist} ${record.title} ${record.year ?? ""}`).includes(needle);
        const matchesDecade = decade === "todas" || (record.year !== null && Math.floor(record.year / 10) * 10 === Number(decade));
        const reference = referencePrice(record);
        const matchesCoverage = coverage === "todos"
          || (coverage === "com-referencia" && reference !== null)
          || (coverage === "adornos" && adornosValues(record).length > 0)
          || (coverage === "mercado" && record.market.length > 0)
          || (coverage === "sem-referencia" && reference === null)
          || (coverage === "com-oferta" && Boolean(offers[record.id]));
        return matchesQuery && matchesDecade && matchesCoverage;
      })
      .sort((a, b) => {
        if (sort === "planilha") return a.sourceRow - b.sourceRow;
        if (sort === "album") return a.title.localeCompare(b.title, "pt-BR");
        if (sort === "ano") return (b.year ?? 0) - (a.year ?? 0);
        if (sort === "referencia-menor") return (referencePrice(a) ?? Infinity) - (referencePrice(b) ?? Infinity);
        if (sort === "referencia-maior") return (referencePrice(b) ?? -1) - (referencePrice(a) ?? -1);
        if (sort === "melhor-oferta") {
          const scoreA = offers[a.id] && referencePrice(a) ? Number(offers[a.id].replace(",", ".")) / referencePrice(a)! : Infinity;
          const scoreB = offers[b.id] && referencePrice(b) ? Number(offers[b.id].replace(",", ".")) / referencePrice(b)! : Infinity;
          return scoreA - scoreB;
        }
        return a.artist.localeCompare(b.artist, "pt-BR") || a.title.localeCompare(b.title, "pt-BR");
      });
  }, [query, decade, coverage, sort, offers]);

  const comparedCount = Object.values(offers).filter(Boolean).length;

  return (
    <main>
      <header className="topbar">
        <div className="identity">
          <span className="record-dot" aria-hidden="true"><i /></span>
          <div><strong>Preço de Disco</strong><span>lista de consulta</span></div>
        </div>
        <div className="base-status">
          <span><b>{records.length}</b> discos</span>
          <span><b>{records.filter((record) => referencePrice(record) !== null).length}</b> com referência</span>
          <span><b>{records.filter((record) => adornosValues(record).length > 0).length}</b> Adornos</span>
          <span><b>{comparedCount}</b> ofertas comparadas</span>
          <a href="#proximos-leiloes"><b>{auctionWatchCount}</b> em leilão</a>
        </div>
      </header>

      <section className="intro">
        <div>
          <p className="kicker">Consulta rápida de preços de vinil</p>
          <h1>Quanto vale esse disco?</h1>
          <p>Pesquise, compare as referências e digite o preço que encontrou. A lista mostra na hora se está barato.</p>
        </div>
        <div className="legend" aria-label="Legenda da comparação">
          <span><i className="great" /> muito barato</span>
          <span><i className="good" /> barato</span>
          <span><i className="fair" /> na faixa</span>
          <span><i className="high" /> caro</span>
        </div>
      </section>

      <section className="auction-watch" id="proximos-leiloes" aria-labelledby="auction-title">
        <div className="auction-heading">
          <div>
            <p className="kicker">Radar de oportunidades</p>
            <h2 id="auction-title">Próximos leilões</h2>
            <p>Os discos que você escolheu acompanhar, com o custo da comissão e um teto prático para não se empolgar no lance.</p>
          </div>
        </div>

        <div className="auction-windows">
          {auctionEvents.map((event) => (
            <details className="auction-window" key={event.id}>
              <summary>
                <span className="auction-window-status"><i aria-hidden="true" /> Próximo</span>
                <strong>{event.house}<small>{event.title}</small></strong>
                <span className="auction-window-date">{event.dates}</span>
                <span className="auction-window-count"><b>{event.items.length}</b> discos</span>
                <i className="auction-window-arrow" aria-hidden="true" />
              </summary>

              <div className="auction-board">
                <div className="auction-meta">
                  <div><span>Casa</span><strong>{event.house}</strong></div>
                  <div><span>Leilão</span><strong>{event.title}</strong></div>
                  <div><span>Quando</span><strong>{event.dates}</strong></div>
                  <div><span>Custos</span><strong>{event.costs}</strong></div>
                </div>

                <div className="auction-days">
                  {auctionGroups(event.items).map(([date, items]) => (
                    <section className="auction-day" key={date} aria-label={`Lotes de ${date}`}>
                      <header>
                        <strong>{date}</strong>
                        <span>{items.length} {items.length === 1 ? "disco" : "discos"} · por lote</span>
                      </header>
                      <div className="auction-list-head" aria-hidden="true">
                        <span>Lote</span><span>Disco / estado</span>
                        <span className="auction-price-head"><i>Lance</i><i>Próximo</i><i>Com 5%</i><i>Teto</i></span>
                        <span>Leitura</span><span />
                      </div>
                      <div className="auction-list">
                        {items.map((item) => {
                          const withCommission = item.currentBid * 1.05;
                          return (
                            <article className={`auction-row ${item.tone}`} key={item.lot}>
                              <div className="auction-lot"><span>Lote</span><b>{item.lot}</b></div>
                              <div className="auction-record">
                                <h3>{item.artist}<span>{item.title}</span></h3>
                                <p title={item.condition}>{item.condition}</p>
                                <small title={item.note}>{item.note}</small>
                              </div>
                              <dl className="auction-row-prices">
                                <div><dt>{item.bidLabel ?? "Lance"}</dt><dd>{money(item.currentBid)}</dd></div>
                                <div><dt>Próximo</dt><dd>{money(item.nextBid)}</dd></div>
                                <div><dt>Com 5%</dt><dd>{exactMoney(withCommission)}</dd></div>
                                <div className="ceiling"><dt>Teto</dt><dd>{money(item.ceiling)}</dd></div>
                              </dl>
                              <div className="auction-priority"><b>{item.priority}</b></div>
                              <a className="auction-open-lot" href={item.url} target="_blank" rel="noreferrer" aria-label={`Abrir lote ${item.lot}: ${item.artist} — ${item.title}`} title="Conferir lote e lance atual">
                                <span aria-hidden="true">↗</span>
                              </a>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>

                <div className="auction-footnote">
                  <span>Atualizado em {event.updatedAt}</span>
                  <p>Os lances mudam. Antes de ofertar, abra o lote e some comissão, frete e embalagem.</p>
                  <a href={event.catalogUrl} target="_blank" rel="noreferrer">Abrir este leilão <span aria-hidden="true">↗</span></a>
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="controls" aria-label="Busca e filtros">
        <label className="search-box">
          <span className="search-symbol" aria-hidden="true" />
          <span className="sr-only">Buscar disco</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Artista, álbum ou ano..."
            autoFocus
          />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Limpar busca">×</button>}
        </label>
        <label><span>Década</span><select value={decade} onChange={(event) => setDecade(event.target.value)}><option value="todas">Todas</option>{decades.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label><span>Mostrar</span><select value={coverage} onChange={(event) => setCoverage(event.target.value)}><option value="todos">Tudo</option><option value="com-referencia">Com referência</option><option value="adornos">Com preço Adornos</option><option value="mercado">Com pesquisa de mercado</option><option value="sem-referencia">Sem referência</option><option value="com-oferta">Minhas comparações</option></select></label>
        <label><span>Ordenar</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="artista">Artista A–Z</option><option value="album">Álbum A–Z</option><option value="planilha">Ordem original</option><option value="ano">Ano recente</option><option value="referencia-menor">Menor referência</option><option value="referencia-maior">Maior referência</option><option value="melhor-oferta">Melhor negócio</option></select></label>
      </section>

      <div className="result-line">
        <strong>{filtered.length}</strong> {filtered.length === 1 ? "disco encontrado" : "discos encontrados"}
        <span>Referência = menor valor registrado entre leilão, pesquisa e Adornos</span>
      </div>

      <section className="table-shell" aria-label="Lista de preços de discos">
        <table>
          <thead>
            <tr>
              <th className="col-index">#</th>
              <th className="col-artist">Artista</th>
              <th className="col-album">Álbum / edição</th>
              <th>Ano</th>
              <th>Lote</th>
              <th>Mercado Livre</th>
              <th>OLX</th>
              <th>Shopee</th>
              <th>Leilão visto</th>
              <th>Valor leilão</th>
              <th className="adornos-head">Adornos</th>
              <th className="reference-head">Referência</th>
              <th className="offer-head">Preço encontrado</th>
              <th className="verdict-head">Avaliação</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((record, index) => {
              const reference = referencePrice(record);
              const offerText = offers[record.id] ?? "";
              const parsedOffer = offerText ? Number(offerText.replace(",", ".")) : null;
              const validOffer = parsedOffer !== null && Number.isFinite(parsedOffer) && parsedOffer >= 0 ? parsedOffer : null;
              const result = assessment(validOffer, reference);
              return (
                <tr key={record.id} className={offerText ? `compared ${result.tone}` : undefined}>
                  <td className="row-number">{index + 1}</td>
                  <td className="artist-cell">{record.artist}</td>
                  <td className="album-cell">{record.title}{record.tags.length > 0 && <small>{record.tags.join(" · ")}</small>}</td>
                  <td className={record.year === null ? "missing" : ""}>{record.year ?? "n/d"}</td>
                  <td>{record.lot ?? "—"}</td>
                  <td className="price-source">{source(record, "Mercado Livre")}</td>
                  <td className="price-source">{source(record, "OLX")}</td>
                  <td className="price-source">{source(record, "Shopee")}</td>
                  <td className="price-source">{source(record, "Leilão observado")}</td>
                  <td className="money-cell">{money(record.auctionPrice)}</td>
                  <td className="adornos-cell">{adornosDisplay(record)}</td>
                  <td className="reference-cell">{money(reference)}</td>
                  <td className="offer-cell">
                    <span>R$</span>
                    <input
                      inputMode="decimal"
                      aria-label={`Preço encontrado para ${record.artist} — ${record.title}`}
                      value={offerText}
                      onChange={(event) => setOffers((current) => ({ ...current, [record.id]: event.target.value.replace(/[^0-9,.]/g, "") }))}
                      placeholder="0"
                    />
                    {offerText && <button type="button" onClick={() => setOffers((current) => ({ ...current, [record.id]: "" }))} aria-label="Apagar preço">×</button>}
                  </td>
                  <td className={`verdict-cell ${result.tone}`}>
                    <strong>{result.label}</strong>
                    {result.delta !== null && <small>{result.delta > 0 ? "+" : ""}{result.delta}%</small>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty"><strong>Nenhum disco encontrado.</strong><button type="button" onClick={() => { setQuery(""); setDecade("todas"); setCoverage("todos"); }}>Limpar filtros</button></div>}
      </section>

      <footer>
        <span>A lista preserva os dados da planilha original.</span>
        <span>Os preços digitados ficam somente neste navegador.</span>
      </footer>
    </main>
  );
}
