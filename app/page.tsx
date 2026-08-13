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
};

const records = catalog.records as CatalogRecord[];

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

function source(record: CatalogRecord, name: string) {
  return record.market.find((item) => item.source === name)?.display ?? "—";
}

function referencePrice(record: CatalogRecord) {
  const values = [record.auctionPrice, record.marketMin, record.adornosPrice ?? null].filter(
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
          || (coverage === "adornos" && record.adornosPrice != null)
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
          <span><b>{records.filter((record) => record.adornosPrice != null).length}</b> Adornos</span>
          <span><b>{comparedCount}</b> ofertas comparadas</span>
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
                  <td className="adornos-cell">{money(record.adornosPrice ?? null)}</td>
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
