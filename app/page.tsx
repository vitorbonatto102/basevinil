"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
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
};

const records = catalog.records as CatalogRecord[];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function currency(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function palette(record: CatalogRecord) {
  const seed = [...`${record.artist}${record.title}`].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return {
    "--cover-hue": `${seed % 360}`,
    "--cover-turn": `${(seed % 9) - 4}deg`,
  } as CSSProperties;
}

function median(values: number[]) {
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2
    ? ordered[middle]
    : Math.round((ordered[middle - 1] + ordered[middle]) / 2);
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [decade, setDecade] = useState("todas");
  const [priceFilter, setPriceFilter] = useState("todos");
  const [sort, setSort] = useState("planilha");
  const [visible, setVisible] = useState(36);
  const [selected, setSelected] = useState<CatalogRecord | null>(null);

  const decades = useMemo(
    () =>
      [...new Set(records.flatMap((record) => record.year ? [Math.floor(record.year / 10) * 10] : []))]
        .sort((a, b) => a - b),
    [],
  );

  const stats = useMemo(() => {
    const auctionValues = records.flatMap((record) =>
      record.auctionPrice === null ? [] : [record.auctionPrice],
    );
    return {
      auction: auctionValues.length,
      market: records.filter((record) => record.market.length > 0).length,
      dated: records.filter((record) => record.year !== null).length,
      median: median(auctionValues),
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = normalize(query.trim());
    const result = records.filter((record) => {
      const matchesQuery = !needle || normalize(
        `${record.artist} ${record.title} ${record.year ?? ""} ${record.tags.join(" ")}`,
      ).includes(needle);
      const matchesDecade = decade === "todas"
        || (record.year !== null && Math.floor(record.year / 10) * 10 === Number(decade));
      const matchesPrice = priceFilter === "todos"
        || (priceFilter === "leilao" && record.auctionPrice !== null)
        || (priceFilter === "mercado" && record.market.length > 0)
        || (priceFilter === "sem-ano" && record.year === null);
      return matchesQuery && matchesDecade && matchesPrice;
    });

    result.sort((a, b) => {
      if (sort === "artista") return a.artist.localeCompare(b.artist, "pt-BR");
      if (sort === "ano") return (b.year ?? 0) - (a.year ?? 0);
      if (sort === "preco-menor") return (a.auctionPrice ?? Number.MAX_VALUE) - (b.auctionPrice ?? Number.MAX_VALUE);
      if (sort === "preco-maior") return (b.auctionPrice ?? -1) - (a.auctionPrice ?? -1);
      return a.sourceRow - b.sourceRow;
    });
    return result;
  }, [query, decade, priceFilter, sort]);

  useEffect(() => {
    setVisible(36);
  }, [query, decade, priceFilter, sort]);

  useEffect(() => {
    if (!selected) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selected]);

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Acervo 33 — início">
          <span className="brand-mark" aria-hidden="true"><i /></span>
          <span>Acervo <strong>33</strong></span>
        </a>
        <nav aria-label="Navegação principal">
          <a href="#catalogo">Catálogo</a>
          <a href="#sobre">Sobre a base</a>
        </nav>
        <span className="edition-label">Edição 01 · 2026</span>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Arquivo independente de vinil</p>
          <h1>Discos, histórias<br />e preços <em>na mesma estante.</em></h1>
          <p className="hero-intro">
            Um catálogo vivo construído a partir de pesquisas, lotes e leilões.
            Procure um título, atravesse décadas e acompanhe os valores já observados.
          </p>
          <a className="primary-action" href="#catalogo">
            Explorar o acervo <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div className="hero-object" aria-hidden="true">
          <div className="sleeve sleeve-back" />
          <div className="sleeve sleeve-front">
            <span className="sleeve-kicker">Arquivo sonoro</span>
            <span className="sleeve-number">556</span>
            <span className="sleeve-caption">registros<br />catalogados</span>
            <i className="sleeve-cutout" />
          </div>
          <div className="vinyl"><span /></div>
        </div>
      </section>

      <section className="stat-strip" aria-label="Resumo do acervo">
        <div><strong>{records.length}</strong><span>discos na base</span></div>
        <div><strong>{stats.auction}</strong><span>valores de leilão</span></div>
        <div><strong>{stats.dated}</strong><span>anos identificados</span></div>
        <div><strong>{currency(stats.median)}</strong><span>mediana em leilão</span></div>
      </section>

      <section className="catalog-section" id="catalogo">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><span /> Pesquisa de prateleira</p>
            <h2>Explore o catálogo</h2>
          </div>
          <p>{filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}</p>
        </div>

        <div className="search-panel">
          <label className="search-field">
            <span className="search-icon" aria-hidden="true" />
            <span className="sr-only">Buscar por artista ou álbum</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Busque por artista, álbum ou ano..."
            />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="Limpar busca">×</button>}
          </label>
          <div className="filter-row">
            <label>
              <span>Década</span>
              <select value={decade} onChange={(event) => setDecade(event.target.value)}>
                <option value="todas">Todas</option>
                {decades.map((value) => <option key={value} value={value}>Anos {value}</option>)}
              </select>
            </label>
            <label>
              <span>Dados disponíveis</span>
              <select value={priceFilter} onChange={(event) => setPriceFilter(event.target.value)}>
                <option value="todos">Todos os registros</option>
                <option value="leilao">Com preço de leilão</option>
                <option value="mercado">Com pesquisa de mercado</option>
                <option value="sem-ano">Precisam de ano</option>
              </select>
            </label>
            <label>
              <span>Ordenar por</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="planilha">Ordem da planilha</option>
                <option value="artista">Artista, A–Z</option>
                <option value="ano">Ano, mais recente</option>
                <option value="preco-menor">Menor preço de leilão</option>
                <option value="preco-maior">Maior preço de leilão</option>
              </select>
            </label>
          </div>
        </div>

        {filtered.length ? (
          <>
            <div className="record-grid">
              {filtered.slice(0, visible).map((record) => (
                <button
                  className="record-card"
                  key={record.id}
                  type="button"
                  onClick={() => setSelected(record)}
                  aria-label={`Ver detalhes de ${record.title}, de ${record.artist}`}
                >
                  <span className="cover-art" style={palette(record)}>
                    <span className="cover-index">{String(record.sourceRow).padStart(3, "0")}</span>
                    <span className="cover-monogram">{record.artist.charAt(0)}</span>
                    <span className="cover-record"><i /></span>
                  </span>
                  <span className="record-meta">
                    <span className="record-topline">
                      <span>{record.year ?? "Ano n/d"}</span>
                      {record.lot !== null && <span>Lote {record.lot}</span>}
                    </span>
                    <strong>{record.title}</strong>
                    <span className="artist-name">{record.artist}</span>
                    <span className="record-bottom">
                      <span>{record.auctionPrice !== null ? "Leilão" : record.market.length ? "Mercado" : "Em pesquisa"}</span>
                      <b>{currency(record.auctionPrice ?? record.marketMin)}</b>
                    </span>
                  </span>
                </button>
              ))}
            </div>
            {visible < filtered.length && (
              <button className="load-more" type="button" onClick={() => setVisible((count) => count + 36)}>
                Mostrar mais <span>{Math.min(36, filtered.length - visible)} discos</span>
              </button>
            )}
          </>
        ) : (
          <div className="empty-state">
            <span className="brand-mark" aria-hidden="true"><i /></span>
            <h3>Nenhum disco nessa busca</h3>
            <p>Tente outro artista, álbum ou remova algum filtro.</p>
            <button type="button" onClick={() => { setQuery(""); setDecade("todas"); setPriceFilter("todos"); }}>
              Limpar filtros
            </button>
          </div>
        )}
      </section>

      <section className="about-section" id="sobre">
        <p className="eyebrow"><span /> Em construção permanente</p>
        <div className="about-grid">
          <h2>Uma base que melhora<br /><em>a cada audição.</em></h2>
          <div>
            <p>
              Este primeiro acervo reúne registros de leilões e pesquisas de preço
              feitas ao longo do tempo. Alguns discos ainda pedem ano, edição ou origem —
              e isso agora aparece como parte do processo, não como obstáculo.
            </p>
            <div className="progress-note">
              <span><i style={{ width: `${Math.round((stats.dated / records.length) * 100)}%` }} /></span>
              <small>{Math.round((stats.dated / records.length) * 100)}% dos registros já possuem ano identificado</small>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="brand"><span className="brand-mark" aria-hidden="true"><i /></span><span>Acervo <strong>33</strong></span></div>
        <p>Catálogo independente · preços em reais · base em evolução</p>
        <a href="#inicio">Voltar ao topo ↑</a>
      </footer>

      {selected && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelected(null)}>
          <section
            className="record-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="record-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="dialog-close" type="button" onClick={() => setSelected(null)} aria-label="Fechar detalhes">×</button>
            <div className="dialog-cover cover-art" style={palette(selected)}>
              <span className="cover-index">FICHA {String(selected.sourceRow).padStart(3, "0")}</span>
              <span className="cover-monogram">{selected.artist.charAt(0)}</span>
              <span className="cover-record"><i /></span>
            </div>
            <div className="dialog-content">
              <p className="eyebrow"><span /> Registro do acervo</p>
              <h2 id="record-title">{selected.title}</h2>
              <p className="dialog-artist">{selected.artist}</p>
              <div className="detail-list">
                <div><span>Ano</span><strong>{selected.year ?? "Não identificado"}</strong></div>
                <div><span>Lote</span><strong>{selected.lot ?? "—"}</strong></div>
                <div><span>Valor de leilão</span><strong>{currency(selected.auctionPrice)}</strong></div>
                <div><span>Menor preço pesquisado</span><strong>{currency(selected.marketMin)}</strong></div>
              </div>
              {selected.tags.length > 0 && (
                <div className="tag-list">{selected.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              )}
              {selected.market.length > 0 ? (
                <div className="market-list">
                  <h3>Pesquisa de mercado</h3>
                  {selected.market.map((item, index) => (
                    <div key={`${item.source}-${index}`}><span>{item.source}</span><strong>{item.display}</strong></div>
                  ))}
                </div>
              ) : (
                <p className="no-market">Ainda não há pesquisa de marketplace para este disco.</p>
              )}
              <small className="source-note">Origem: linha {selected.sourceRow} da planilha</small>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
