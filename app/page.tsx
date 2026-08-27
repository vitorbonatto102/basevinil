"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import catalog from "./data/catalog.json";
import wantedData from "./data/wanted.json";

type MarketObservation = {
  source: string;
  display: string;
  numeric: number | null;
  url?: string;
  checkedAt?: string;
  status?: string;
  edition?: string;
  condition?: string;
  shipping?: string;
  note?: string;
};

type CatalogRecord = {
  id: string;
  sourceRow: number;
  lot: number | null;
  artist: string;
  title: string;
  year: number | null;
  years?: number[];
  auctionPrice: number | null;
  auctionPrices?: number[];
  auctionWatchPrices?: number[];
  auctionPriceMarkers?: Record<string, string>;
  auctionWatchOverride?: boolean;
  auctionPriceStatus?: "unverified-copy";
  marketMin: number | null;
  market: MarketObservation[];
  tags: string[];
  adornosPrice?: number | null;
  adornosPrices?: number[];
  adornosPriceMarkers?: Record<string, string>;
};

type CatalogEdit = {
  id: string;
  status: "upserted" | "deleted";
  record: CatalogRecord | null;
};

type EditorSession = {
  signedIn: boolean;
  canEdit: boolean;
  email: string | null;
};

type CatalogDraft = {
  id: string;
  artist: string;
  title: string;
  year: string;
  mercadoLivre: string;
  olx: string;
  shopee: string;
  leilao: string;
  vinylSocialClub: string;
  adornos: string;
};

type EditableCatalogField = Exclude<keyof CatalogDraft, "id">;

type EditingCell = {
  recordId: string;
  field: EditableCatalogField;
};

type AuctionWatch = {
  lot: number | string;
  artist: string;
  title: string;
  date: string;
  condition: string;
  currentBid: number;
  nextBid: number;
  currentBidMarkers?: string;
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
  expiresAt: string;
  costs: string;
  catalogUrl: string;
  updatedAt: string;
  items: AuctionWatch[];
};

const auctionMonths: Record<string, number> = {
  jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6,
  jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12,
};

type WantedPriority = "A+" | "A" | "B";

type WantedItem = {
  id: string;
  artist: string;
  title: string;
  priority: WantedPriority;
};

type SiteView = "catalogo" | "marcio";

const baseRecords = catalog.records as CatalogRecord[];
const wantedItems = wantedData as WantedItem[];
const preparedWanted = wantedItems.map((item) => ({
  item,
  artistKey: lookupText(item.artist),
  titleKey: lookupText(item.title),
}));

const auctionWatch: AuctionWatch[] = [
  {
    lot: 134,
    artist: "Creedence Clearwater Revival",
    title: "Willy and the Poor Boys",
    date: "24 ago · 15h",
    condition: "Disco e capa em bom estado",
    currentBid: 60,
    nextBid: 70,
    ceiling: 100,
    priority: "Procura Márcio · A",
    tone: "high",
    note: "Boa oportunidade no lance atual; confirmar selo e contracapa. Teto de R$ 100 sem confirmação da primeira edição brasileira Liberty FLP-35080.",
    url: "https://www.bruceangeirasleiloeiro.com.br/peca.asp?ID=31542976",
  },  {
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
  {
    lot: 616,
    artist: "Supertramp",
    title: "Free As A Bird",
    date: "25 ago · 15h",
    condition: "Disco em bom estado; capa com leves desgastes; encarte não confirmado",
    currentBid: 10,
    nextBid: 20,
    ceiling: 35,
    priority: "Melhor Supertramp",
    tone: "high",
    note: "Ativos equivalentes começam em R$ 50; várias cópias completas aparecem entre R$ 60 e R$ 80. Não ampliar sem confirmar o encarte.",
    url: "https://www.bruceangeirasleiloeiro.com.br/peca.asp?ID=31721801",
  },
  {
    lot: 418,
    artist: "Supertramp",
    title: "The Autobiography Of Supertramp",
    date: "25 ago · 15h",
    condition: "Disco bom; capa com leves desgastes; encarte não confirmado",
    currentBid: 30,
    nextBid: 40,
    ceiling: 50,
    priority: "Boa compra",
    tone: "medium",
    note: "Mercado ativo muito espalhado: piso isolado perto de R$ 39 e faixa recorrente de R$ 79–115. Encarte muda o teto.",
    url: "https://www.bruceangeirasleiloeiro.com.br/peca.asp?ID=31690009",
  },
  {
    lot: 442,
    artist: "Supertramp",
    title: "Breakfast In America",
    date: "25 ago · 15h",
    condition: "Disco com riscos; capa com desgastes nas extremidades",
    currentBid: 30,
    nextBid: 40,
    ceiling: 40,
    priority: "Estado limita",
    tone: "careful",
    note: "Cópia VG+/VG+ localizada por R$ 95. O título é procurado, mas os riscos eliminam boa parte da margem.",
    url: "https://www.bruceangeirasleiloeiro.com.br/peca.asp?ID=31695055",
  },
];

const rtAuctionWatch: AuctionWatch[] = [
  {
    lot: 235,
    artist: "Sinéad O’Connor",
    title: "I Do Not Want What I Haven’t Got",
    date: "25 ago · 18h",
    condition: "Com encarte; capa e disco em bom estado",
    currentBid: 25,
    nextBid: 30,
    ceiling: 55,
    priority: "Melhor achado novo",
    tone: "high",
    note: "Comparáveis ativos diretamente equivalentes começam em R$ 62,90–67 e passam de R$ 80. A R$ 25, ainda há margem mesmo com 5%; frete não informado.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152965",
  },
  {
    lot: 338,
    artist: "Blues Etílicos",
    title: "IV",
    date: "25 ago · 18h",
    condition: "Com encarte; capa com desgaste leve; risco superficial no disco",
    currentBid: 40,
    nextBid: 40,
    bidLabel: "Abertura",
    ceiling: 70,
    priority: "Garimpo forte",
    tone: "high",
    note: "Cópias ativas com encarte aparecem por R$ 92–110; o risco superficial impede tratar como cópia de loja.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32153073",
  },
  {
    lot: 347,
    artist: "Picassos Falsos",
    title: "Picassos Falsos",
    date: "25 ago · 18h",
    condition: "Com encarte; capa boa; risco leve no disco",
    currentBid: 55,
    nextBid: 60,
    ceiling: 85,
    priority: "Boa oportunidade",
    tone: "high",
    note: "Primeiro LP, RCA 1987. Comparáveis ativos ficam perto de R$ 101–130; conferir se o risco é apenas visual.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152953",
  },
  {
    lot: 99,
    artist: "Raça Negra",
    title: "Banda Raça Negra",
    date: "24 ago · 18h",
    condition: "Capa com desgaste leve; disco com alguns riscos superficiais",
    currentBid: 15,
    nextBid: 20,
    ceiling: 30,
    priority: "Barato com cautela",
    tone: "medium",
    note: "Há anúncios ativos desde R$ 35 e cópias de loja por R$ 60. Bom só com lance baixo porque o estado aproxima a cópia do piso.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152850",
  },
  {
    lot: 333,
    artist: "Supertramp",
    title: "Breakfast In America",
    date: "25 ago · 18h",
    condition: "Com encarte; capa com pequenos desgastes; risco superficial no disco",
    currentBid: 30,
    nextBid: 35,
    ceiling: 50,
    priority: "Preço bom · estado limita",
    tone: "medium",
    note: "O catálogo registra referência de R$ 79 e há cópias VG+/VG+ por R$ 95–120. Não perseguir: o risco e a capa tiram a margem acima de R$ 50.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32153081",
  },
  {
    lot: 485,
    artist: "The Rolling Stones",
    title: "Steel Wheels",
    date: "26 ago · 18h",
    condition: "Com encarte; capa com desgaste leve; disco em bom estado",
    currentBid: 45,
    nextBid: 50,
    ceiling: 60,
    priority: "Só até o teto",
    tone: "medium",
    note: "O piso ativo diretamente comparável está perto de R$ 70. É interessante, mas a vantagem some rápido com comissão e frete.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152932",
  },
  {
    lot: 198,
    artist: "R.E.M.",
    title: "Out Of Time",
    date: "25 ago · 18h",
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
    date: "25 ago · 18h",
    condition: "Com encarte; capa com pequenos desgastes; risco superficial no disco",
    currentBid: 33,
    nextBid: 38,
    ceiling: 40,
    priority: "Só até o teto",
    tone: "medium",
    note: "Edição de 1990. Para entrar no próximo lance de R$ 38, o custo fica em R$ 39,90 com 5%, antes do frete. Piso ativo visto em R$ 44–49.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152815",
  },
  {
    lot: 64,
    artist: "Finis Africae",
    title: "Finis Africae",
    date: "24 ago · 18h",
    condition: "Com encarte; capa com desgastes; risco bem sutil no disco",
    currentBid: 20,
    nextBid: 25,
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
    date: "26 ago · 18h",
    condition: "Capa dupla e encarte; desgaste leve; risco superficial sem afetar a reprodução",
    currentBid: 50,
    nextBid: 55,
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
    date: "25 ago · 18h",
    condition: "Com encarte; capa e os dois discos em bom estado",
    currentBid: 40,
    nextBid: 45,
    ceiling: 55,
    priority: "Só até o teto",
    tone: "high",
    note: "Original duplo de 1989. Piso comparável ativo em torno de R$ 65–79; cópias completas aparecem acima disso.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152967",
  },
  {
    lot: 118,
    artist: "Zero",
    title: "Passos no Escuro",
    date: "24 ago · 18h",
    condition: "Com encarte; capa e disco em bom estado",
    currentBid: 25,
    nextBid: 30,
    ceiling: 30,
    priority: "No teto",
    tone: "high",
    note: "Comparáveis ativos começam perto de R$ 35–40, com várias cópias entre R$ 58 e R$ 85.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152951",
  },
  {
    lot: 8,
    artist: "The Alan Parsons Project",
    title: "The Turn Of A Friendly Card",
    date: "24 ago · 18h",
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
    lot: 356,
    artist: "Pink Floyd",
    title: "Animals",
    date: "26 ago · 18h",
    condition: "Capa dupla e encarte; capa gasta; muitos riscos, com raros estalos",
    currentBid: 75,
    nextBid: 80,
    ceiling: 65,
    priority: "Teto ultrapassado · passar",
    tone: "careful",
    note: "O lance já passou do teto de R$ 65. Esta é uma cópia de audição arriscada, com muitos riscos; não pagar preço de VG.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152847",
  },
  {
    lot: 442,
    artist: "O Têrço",
    title: "Mudança de Tempo",
    date: "26 ago · 18h",
    condition: "Reedição de 1991; capa dupla e encarte; capa e disco em bom estado",
    currentBid: 65,
    nextBid: 70,
    ceiling: 65,
    priority: "No teto · passar se subir",
    tone: "medium",
    note: "Há anúncios da mesma reedição por R$ 80–89; a margem desaparece rapidamente com comissão e frete.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152952",
  },
  {
    lot: 1,
    artist: "Jorge Ben",
    title: "Sonsual",
    date: "24 ago · 18h",
    condition: "Com encarte; capa com pequenos desgastes; disco em bom estado",
    currentBid: 121,
    nextBid: 126,
    ceiling: 60,
    priority: "Teto estourado · passar",
    tone: "careful",
    note: "Já existe cópia equivalente anunciada por R$ 50. Para entrar no próximo lance de R$ 126, o custo fica em R$ 132,30 com a comissão, antes do frete.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152938",
  },
];

const tremDasSeteAuctionWatch: AuctionWatch[] = [
  {
    lot: "282C",
    artist: "Talking Heads",
    title: "Speaking In Tongues",
    date: "25 ago · 19h30",
    condition: "Edição nacional de 1988; LP e capa em ótimo estado; encarte não informado",
    currentBid: 60,
    nextBid: 70,
    ceiling: 120,
    priority: "Melhor achado · 8,5/10",
    tone: "high",
    note: "Anúncios ativos diretamente comparáveis aparecem perto de R$ 222–230. Sem venda concluída confirmada e sem encarte descrito, o teto fica conservador.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=32046356",
  },
  {
    lot: "282H",
    artist: "The Police",
    title: "Ghost In The Machine",
    date: "25 ago · 19h30",
    condition: "Nacional de 1982, catálogo 412.003; com encarte; LP muito bom e capa com desgaste leve",
    currentBid: 30,
    nextBid: 30,
    bidLabel: "Abertura",
    ceiling: 55,
    priority: "Garimpo forte · 8/10",
    tone: "high",
    note: "Cópias ativas comparáveis com encarte aparecem por cerca de R$ 81–119. O estado usado impede subir demais.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=32046390",
  },
  {
    lot: "282N",
    artist: "The Alan Parsons Project",
    title: "The Turn Of A Friendly Card",
    date: "25 ago · 19h30",
    condition: "Nacional Arista 203.000, 1980; LP ótimo; capa com desgaste leve",
    currentBid: 25,
    nextBid: 25,
    bidLabel: "Abertura",
    ceiling: 55,
    priority: "Garimpo forte · 8/10",
    tone: "high",
    note: "Anúncios ativos da edição usada aparecem em R$ 73–94, com pedidos maiores chegando a R$ 130.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=32046370",
  },
  {
    lot: "282L",
    artist: "The Alan Parsons Project",
    title: "Vulture Culture",
    date: "25 ago · 19h30",
    condition: "Nacional Arista/RCA 104.8315, 1985; LP ótimo; capa com desgaste leve",
    currentBid: 20,
    nextBid: 20,
    bidLabel: "Abertura",
    ceiling: 45,
    priority: "Boa oportunidade · 7,5/10",
    tone: "high",
    note: "Há anúncios ativos entre R$ 50,99 e R$ 95; é comum, mas a abertura ainda deixa margem.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=32046406",
  },
  {
    lot: "282E",
    artist: "Tom Waits",
    title: "Franks Wild Years",
    date: "25 ago · 19h30",
    condition: "Nacional Island 670.8009, 1987; LP ótimo; capa dupla com desgaste leve",
    currentBid: 50,
    nextBid: 50,
    bidLabel: "Abertura",
    ceiling: 70,
    priority: "Boa oportunidade · 7,5/10",
    tone: "high",
    note: "Comparáveis nacionais aparecem em R$ 80–99,75; anúncios ativos mais altos chegam a R$ 150–175. A liquidez é menor.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=32046366",
  },
  {
    lot: "281A",
    artist: "The Cure",
    title: "Standing On A Beach — The Singles",
    date: "25 ago · 19h30",
    condition: "Nacional Polydor/Fiction 829 239-1, 1986; com encarte; disco ótimo e capa muito boa",
    currentBid: 80,
    nextBid: 90,
    ceiling: 125,
    priority: "Boa oportunidade · 7,5/10",
    tone: "high",
    note: "Cópia brasileira VG+/NM com encarte está ativa por R$ 188,10; ainda há margem, mas não é lance para perseguir sem frete.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=32046056",
  },
  {
    lot: "281H",
    artist: "Tears For Fears",
    title: "The Seeds Of Love",
    date: "25 ago · 19h30",
    condition: "Nacional 1989 com encarte; disco ótimo, mas capa com danos fortes atrás",
    currentBid: 45,
    nextBid: 50,
    ceiling: 45,
    priority: "No teto · passar se subir",
    tone: "careful",
    note: "Cópias melhores aparecem de R$ 79 a R$ 185. O dano forte da capa derruba a margem e exige teto baixo.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=32046341",
  },
  {
    lot: "281F",
    artist: "Talking Heads",
    title: "Naked",
    date: "25 ago · 19h30",
    condition: "Nacional EMI 066 790156 1, 1988; LP e capa ótimos; com encarte",
    currentBid: 60,
    nextBid: 70,
    ceiling: 65,
    priority: "Preço normal · não perseguir",
    tone: "careful",
    note: "Há anúncios ativos diretamente comparáveis por R$ 61,75–64,90, alguns com frete grátis. Para entrar no próximo lance de R$ 70, o custo fica em R$ 73,50 com 5%, antes do frete.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=32046335",
  },
  {
    lot: "281D",
    artist: "Terence Trent D'Arby",
    title: "Introducing The Hardline According To Terence Trent D'Arby",
    date: "25 ago · 19h30",
    condition: "Edição brasileira CBS; com encarte; LP ótimo; capa com leve desgaste",
    currentBid: 30,
    nextBid: 30,
    bidLabel: "Abertura",
    ceiling: 55,
    priority: "Bom escondido · 7,5/10",
    tone: "high",
    note: "Com encarte, enquanto anúncios ativos variam de R$ 35 sem detalhamento a R$ 80–123,99 nas cópias anunciadas como completas. Boa compra até R$ 55, não raridade.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=32046326",
  },
  {
    lot: "282F",
    artist: "The Kinsey Report",
    title: "Edge Of The City",
    date: "25 ago · 19h30",
    condition: "Nacional Alligator 670.9230, 1987; capa e LP ótimos",
    currentBid: 30,
    nextBid: 30,
    bidLabel: "Abertura",
    ceiling: 40,
    priority: "Bom nicho · 7/10",
    tone: "medium",
    note: "Há anúncio ativo diretamente comparável por R$ 60 na Shopee. O desconto é real, mas a liquidez de blues rock é menor e o frete pode consumir a margem.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=32046359",
  },
  {
    lot: "282K",
    artist: "U2",
    title: "The Unforgettable Fire",
    date: "25 ago · 19h30",
    condition: "Nacional Island 610.7042, 1985; LP com sinais de uso; capa desgastada; encarte não informado",
    currentBid: 25,
    nextBid: 30,
    ceiling: 45,
    priority: "Boa compra · 7/10",
    tone: "medium",
    note: "Anúncios ativos usados começam em R$ 50–70 e sobem quando há encarte. Como este exemplar tem desgaste e não confirma encarte, o teto precisa ficar curto.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=32046400",
  },
  {
    lot: "301K",
    artist: "Vários Artistas",
    title: "Rap Revolucion",
    date: "25 ago · 19h30",
    condition: "Nacional Mag Masterson EWS X GR 009, 1990; LP ótimo; capa com fita, rasgos, vincos e escrita",
    currentBid: 12,
    nextBid: 17,
    ceiling: 25,
    priority: "Curiosidade · sem mercado",
    tone: "careful",
    note: "Coletânea para DJ com Tairrie B, Poison Clan e Asher D. Nenhum comparável verificável foi localizado; a capa está muito danificada, então o preço baixo não prova raridade.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=32064330",
  },
  {
    lot: 341,
    artist: "Paul Simon",
    title: "The Rhythm Of The Saints",
    date: "25 ago · 19h30",
    condition: "Nacional Warner 670.8204, 1990; LP ótimo; capa com leve desgaste; encarte não informado",
    currentBid: 20,
    nextBid: 20,
    bidLabel: "Abertura",
    ceiling: 40,
    priority: "Bom custo · 7,5/10",
    tone: "high",
    note: "Comparáveis nacionais ativos aparecem por R$ 60, R$ 71,10 e R$ 79. Há referências antigas da Shopee abaixo disso, por isso o teto fica em R$ 40.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=31942717",
  },
  {
    lot: 401,
    artist: "Robertinho de Recife & Emilinha",
    title: "Robertinho de Recife & Emilinha",
    date: "25 ago · 19h30",
    condition: "Original nacional Ariola 201.646, 1982; LP e capa ótimos; com encarte",
    currentBid: 40,
    nextBid: 40,
    bidLabel: "Abertura",
    ceiling: 70,
    priority: "Melhor novo achado · 8/10",
    tone: "high",
    note: "Cópias ativas aparecem por R$ 85–109,90, e no Mercado Livre por R$ 100–160,78. O exemplar completo e bem descrito sustenta o melhor novo teto do dia.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=31942976",
  },
  {
    lot: 513,
    artist: "Laurie Anderson",
    title: "Home Of The Brave",
    date: "25 ago · 19h30",
    condition: "Nacional de 1986; capa, LP e encarte em ótimo estado",
    currentBid: 20,
    nextBid: 20,
    bidLabel: "Abertura",
    ceiling: 30,
    priority: "Boa abertura · 7/10",
    tone: "medium",
    note: "Cópias nacionais ativas com encarte aparecem por R$ 40–50. A abertura é boa, mas o título é comum e a margem termina rapidamente com comissão e frete.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=31942975",
  },
  {
    lot: 534,
    artist: "Tetê Espíndola",
    title: "Ouvir",
    date: "25 ago · 19h30",
    condition: "Original independente de 1991; LP e capa ótimos; com encarte",
    currentBid: 200,
    nextBid: 200,
    bidLabel: "Abertura",
    ceiling: 220,
    priority: "Raro, mas preço só bom · 6,5/10",
    tone: "medium",
    note: "Cópia VG+/VG+ com encarte autografado apareceu esgotada por R$ 319. Sem venda concluída e já partindo de R$ 200, é interessante apenas perto da abertura.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=31943472",
  },
  {
    lot: 147, artist: "Grupo Nós", title: "Estranho Lugar", date: "24 ago · 19h30",
    condition: "Edição nacional Estúdio Eldorado; com encarte; LP ótimo; capa com desgaste e leves avarias",
    currentBid: 12, nextBid: 12, bidLabel: "Abertura", ceiling: 35, priority: "Melhor do dia 1 · 8/10", tone: "high",
    note: "A abertura é baixa frente a anúncios ativos localizados em R$ 40 e R$ 79,99. Ainda falta confirmar venda concluída e o frete.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=31942935",
  },
  {
    lot: 38, artist: "Pena Branca & Xavantinho", title: "Cantadô De Mundo Afora", date: "24 ago · 19h30",
    condition: "Original nacional Continental de 1990; disco ótimo; capa com leve desgaste",
    currentBid: 30, nextBid: 30, bidLabel: "Abertura", ceiling: 50, priority: "Interessante · conferir mercado", tone: "medium",
    note: "Título menos comum e exemplar bem descrito, mas a passada rápida não encontrou comparáveis brasileiros atuais suficientes para sustentar nota alta.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=31943173",
  },
  {
    lot: "580D", artist: "Tom Waits", title: "Big Time", date: "26 ago · 19h30",
    condition: "Nacional Island 670.4250, 1989; LP ótimo; capa com leve desgaste",
    currentBid: 30, nextBid: 35, ceiling: 50, priority: "Melhor do dia · 8,5/10", tone: "high",
    note: "Para entrar no próximo lance de R$ 35, o custo fica em R$ 36,75 com 5%, antes do frete. Comparáveis nacionais ativos aparecem em R$ 69,99–70, R$ 98 e R$ 110; sem venda concluída confirmada.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=32067506",
  },
  {
    lot: "580E", artist: "The Bolshoi", title: "Friends", date: "26 ago · 19h30",
    condition: "Nacional Beggars Banquet 670.0032, 1987; com encarte; LP muito bom; grande rasgo frontal na capa",
    currentBid: 25, nextBid: 25, bidLabel: "Abertura", ceiling: 30, priority: "Só se aceitar a capa · 6/10", tone: "careful",
    note: "Há cópia ativa por R$ 45 + R$ 8,39 de frete e ofertas melhores a partir de cerca de R$ 50. O grande rasgo frontal elimina boa parte da vantagem.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=32067509",
  },
  {
    lot: "580H", artist: "The Cure", title: "The Top", date: "26 ago · 19h30",
    condition: "Nacional Polydor 821 136-1, 1987; LP ótimo; capa com leve desgaste; encarte não informado",
    currentBid: 90, nextBid: 100, ceiling: 95, priority: "Passar — acima do teto", tone: "careful",
    note: "Para entrar no próximo lance de R$ 100, o custo fica em R$ 105 com comissão, antes do frete. Há ofertas ativas a R$ 100–110, então a margem acabou.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=32067512",
  },
  {
    lot: "586A", artist: "a-ha", title: "Scoundrel Days", date: "26 ago · 19h30",
    condition: "Nacional Warner de 1987; com encarte; LP ótimo; capa com leve desgaste e sujidades",
    currentBid: 20, nextBid: 20, bidLabel: "Abertura", ceiling: 30, priority: "Boa compra, não achado · 6,5/10", tone: "medium",
    note: "A abertura de R$ 20 fica em R$ 21 com comissão, mas há cópia ativa com encarte por R$ 25 e anúncios no Mercado Livre a R$ 38–39,90. Vantagem real, porém pequena.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=32084248",
  },
  {
    lot: "593F", artist: "Beto Guedes", title: "Lumiar", date: "26 ago · 19h30",
    condition: "Nacional de 1981; LP e capa em ótimo estado",
    currentBid: 25, nextBid: 25, bidLabel: "Abertura", ceiling: 40, priority: "Melhor novo achado · 8,5/10", tone: "high",
    note: "Com 5%, a abertura fica em R$ 26,25 antes do frete. Comparáveis ativos aparecem em R$ 50 na OLX e R$ 54,90–79 no Mercado Livre; nossa VSC registra R$ 89.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=32084269",
  },
  {
    lot: "725", artist: "Odair José", title: "Luz Acesa", date: "26 ago · 19h30",
    condition: "Original nacional de 1994; LP novo, sem uso; encarte como novo; capa ótima",
    currentBid: 30, nextBid: 30, bidLabel: "Abertura", ceiling: 35, priority: "Boa compra pela condição · 7/10", tone: "medium",
    note: "A abertura de R$ 30 fica em R$ 31,50 com comissão. A cópia ativa mais barata encontrada está em R$ 40 com encarte; as demais se concentram em R$ 63–79.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=31943178",
  },
  {
    lot: "769", artist: "Vários Artistas", title: "As Melhores Cordas do Brasil", date: "26 ago · 19h30",
    condition: "Discos Marcus Pereira, 1980; LP e capa em ótimo estado",
    currentBid: 20, nextBid: 20, bidLabel: "Abertura", ceiling: 30, priority: "Curiosidade · confiança baixa", tone: "medium",
    note: "Não encontrei comparável brasileiro ativo diretamente equivalente. Vale olhar pelo repertório e selo, mas sem tratar escassez como valor comprovado.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=31944287",
  },
  {
    lot: "851S", artist: "Simon & Garfunkel", title: "Bridge Over Troubled Water", date: "27 ago · 19h30",
    condition: "Edição brasileira CBS 37665, 1970, mono; disco com sinais de uso e riscos superficiais; capa com leve desgaste",
    currentBid: 15, nextBid: 15, bidLabel: "Abertura", ceiling: 35, priority: "Procura Márcio · A+", tone: "high",
    note: "Correspondência da lista do Márcio. A edição mono merece atenção, mas os riscos e a falta de comparável exato pedem teto baixo.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=32107073",
  },
  {
    lot: "849A", artist: "Maria Bethânia", title: "Recital Na Boite Barroco", date: "27 ago · 19h30",
    condition: "Nacional Odeon BFB 3545, 1968, estéreo; LP ótimo; capa com desgaste e avarias nas bordas",
    currentBid: 20, nextBid: 20, bidLabel: "Abertura", ceiling: 55, priority: "Melhor MPB · 8/10", tone: "high",
    note: "Anúncios ativos começam em torno de R$ 42,50–58,40 e avançam para R$ 79–140. A capa avariada impede um teto maior.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=32106789",
  },
  {
    lot: 923, artist: "Taiguara", title: "Canções De Amor E Liberdade", date: "27 ago · 19h30",
    condition: "Original nacional Moviola, 1983; com encarte; capa com desgaste; estado do disco não detalhado",
    currentBid: 12, nextBid: 12, bidLabel: "Abertura", ceiling: 50, priority: "Melhor custo · 8,5/10", tone: "high",
    note: "Há referência ativa por R$ 69 e cópia de estoque antigo por R$ 130; uma cópia comparável já esgotada aparecia por R$ 70.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=31944346",
  },
  {
    lot: 1215, artist: "Moraes Moreira", title: "Agradeça Ao Pelô", date: "28 ago · 19h30",
    condition: "Mix promocional de 1993; LP ótimo; capa com sujidades",
    currentBid: 20, nextBid: 30, ceiling: 30, priority: "Curiosidade · pouca referência", tone: "medium",
    note: "Formato promocional interessante, mas sem comparáveis brasileiros atuais suficientes. Promo não é prova de raridade; ficar perto do lance atual.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=31944273",
  },
  {
    lot: 1342, artist: "The Masqueraders", title: "Love Anonymous", date: "28 ago · 19h30",
    condition: "Edição brasileira Phonodisc/ABC de 1977; LP com sinais de uso; capa com anotações e desgaste",
    currentBid: 12, nextBid: 12, bidLabel: "Abertura", ceiling: 25, priority: "Barato, não raro", tone: "medium",
    note: "Referências estrangeiras do título são baixas, em geral entre US$ 5 e US$ 15. Vale como curiosidade pela prensagem brasileira, não para disputar.",
    url: "https://www.tremdas7.com.br/peca.asp?ID=31942684",
  },

];

const cataventoAuctionWatch: AuctionWatch[] = [
  {
    lot: 276,
    artist: "Midge Ure",
    title: "Pure",
    date: "21 ago · 20h",
    condition: "Edição de 1991, com encarte; capa boa; disco não testado",
    currentBid: 18,
    nextBid: 18,
    bidLabel: "Abertura",
    ceiling: 50,
    priority: "Aposta especulativa · 6,5/10",
    tone: "medium",
    note: "Sem comparável brasileiro localizado; referências estrangeiras variam bastante. Não subir sem confirmar a prensagem.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32015448",
  },
  {
    lot: 310,
    artist: "Enigma",
    title: "MCMXC a.D.",
    date: "21 ago · 20h",
    condition: "Virgin, 1991; capa regular, sem encarte mencionado; disco não testado",
    currentBid: 28,
    nextBid: 28,
    bidLabel: "Abertura",
    ceiling: 28,
    priority: "Só no valor inicial · 5/10",
    tone: "careful",
    note: "Há anúncios ativos desde R$ 40–70; sem encarte e com frete separado, a margem desaparece rapidamente.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32019505",
  },
  {
    lot: 316,
    artist: "Dead Or Alive",
    title: "Nude",
    date: "21 ago · 20h",
    condition: "Epic; capa regular, sem encarte mencionado; disco não testado",
    currentBid: 31,
    nextBid: 41,
    ceiling: 31,
    priority: "Não aumentar · 4,5/10",
    tone: "careful",
    note: "Existe anúncio ativo com encarte por R$ 49 e frete grátis; só compensa no lance atual e com envio combinado.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32019537",
  },
  {
    lot: 321,
    artist: "Faith No More",
    title: "The Real Thing",
    date: "21 ago · 20h",
    condition: "London, 1990; capa regular com rasuras; disco não testado",
    currentBid: 89,
    nextBid: 99,
    ceiling: 69,
    priority: "Teto ultrapassado · passar",
    tone: "careful",
    note: "Para entrar no próximo lance de R$ 99, o custo fica em R$ 103,95 com comissão, antes do frete; há anúncios ativos entre R$ 60 e R$ 100.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32025535",
  },
  {
    lot: 327,
    artist: "Madonna",
    title: "Like a Prayer",
    date: "21 ago · 20h",
    condition: "Sire, 1989, com encarte; capa boa com anotações; disco não testado",
    currentBid: 69,
    nextBid: 79,
    ceiling: 85,
    priority: "Prioridade alta · 8/10",
    tone: "high",
    note: "Pedidos ativos vistos entre R$ 120 e R$ 266; manter o teto por causa do estado e da falta de teste.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32025576",
  },
  {
    lot: 328,
    artist: "English Dogs",
    title: "Where Legend Began",
    date: "21 ago · 20h",
    condition: "Woodstock, 1987; capa gatefold boa, com encarte; disco não testado",
    currentBid: 59,
    nextBid: 69,
    ceiling: 80,
    priority: "Boa compra controlada · 6,5/10",
    tone: "medium",
    note: "Comparáveis ativos começam em R$ 78–99, com várias cópias entre R$ 140 e R$ 190; não entrar em guerra.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32025578",
  },
  {
    lot: 329,
    artist: "Vulcano",
    title: "Anthropophagy",
    date: "21 ago · 20h",
    condition: "Rock Brigade, 1987, com encarte; capa boa; disco não testado",
    currentBid: 119,
    nextBid: 139,
    ceiling: 250,
    priority: "Garimpo principal · 8,5/10",
    tone: "high",
    note: "Originais com encarte aparecem pedidos a R$ 560–570. Confirmar matriz RBR-140/87; não comparar com reedições.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32025580",
  },
  {
    lot: 387,
    artist: "Força Rap do Litoral",
    title: "Força Rap do Litoral",
    date: "21 ago · 20h",
    condition: "Edição original; capa regular; disco não testado",
    currentBid: 29,
    nextBid: 39,
    bidLabel: "Abertura",
    ceiling: 50,
    priority: "Lote mistério · 6,5/10",
    tone: "medium",
    note: "Pouco documentado e sem comparáveis suficientes; escassez ainda não prova valor.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32056203",
  },
  {
    lot: 396,
    artist: "Manassas / Stephen Stills",
    title: "The Raven · álbum duplo de 1972",
    date: "21 ago · 20h",
    condition: "Atlantic, 1972, LP duplo; capa regular; discos não testados",
    currentBid: 69,
    nextBid: 79,
    ceiling: 100,
    priority: "Prioridade alta · 8/10",
    tone: "high",
    note: "Pedidos vistos entre R$ 200 e R$ 300; confirmar nas fotos qual é a edição, pois o título do lote parece impreciso.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32056359",
  },
  {
    lot: 397,
    artist: "Lord Finesse & DJ Mike Smooth",
    title: "Funky Technician",
    date: "21 ago · 20h",
    condition: "Wild Pitch WPL 2003, 1990; capa regular; disco não testado",
    currentBid: 79,
    nextBid: 79,
    bidLabel: "Abertura",
    ceiling: 180,
    priority: "Garimpo principal · 8/10",
    tone: "high",
    note: "A capa dourada é compatível com o original americano; confirmar endereço e matriz DCHARLES HuB antes de ampliar o lance.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32056372",
  },
  {
    lot: 405,
    artist: "Legião Urbana",
    title: "Legião Urbana",
    date: "21 ago · 20h",
    condition: "EMI, com encarte; capa regular; disco não testado",
    currentBid: 69,
    nextBid: 79,
    ceiling: 90,
    priority: "Boa oportunidade · 7,5/10",
    tone: "high",
    note: "O lote informa 1984, embora o álbum seja de 1985; conferir selo e edição antes de disputar.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32056448",
  },
  {
    lot: 419,
    artist: "Vários artistas",
    title: "Rap Brasil 2",
    date: "21 ago · 20h",
    condition: "Som Livre, 1995; capa regular; disco não testado",
    currentBid: 58,
    nextBid: 68,
    ceiling: 120,
    priority: "Garimpo forte · 8/10",
    tone: "high",
    note: "Comparáveis ativos aparecem a R$ 179 no Mercado Livre e R$ 200 na OLX; o risco é a falta de teste.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32056508",
  },
  {
    lot: 438,
    artist: "Língua de Trapo",
    title: "Língua de Trapo",
    date: "21 ago · 20h",
    condition: "Lira Paulistana, 1982; capa regular; disco não testado",
    currentBid: 18,
    nextBid: 28,
    ceiling: 40,
    priority: "Bom complemento · 7/10",
    tone: "high",
    note: "Comparáveis ativos começam em R$ 60–75; fica melhor se o frete puder ser combinado com outro lote.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32056601",
  },
  {
    lot: 490,
    artist: "Fausto Fawcett e os Robôs Efêmeros",
    title: "Fausto Fawcett e os Robôs Efêmeros",
    date: "21 ago · 20h",
    condition: "Original WEA de 1987, com encarte; capa regular; disco não testado",
    currentBid: 39,
    nextBid: 49,
    ceiling: 90,
    priority: "Melhor garimpo · 8,5/10",
    tone: "high",
    note: "Pedidos ativos vistos entre R$ 160 e R$ 299; o risco principal é o disco não testado.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32060268",
  },
];

const credanAuctionWatch: AuctionWatch[] = [
  {
    lot: 126,
    artist: "Live",
    title: "Mental Jewelry",
    date: "27 ago · 18h",
    condition: "Brasil 1992; capa EX+, encarte NM e disco EX",
    currentBid: 90,
    nextBid: 100,
    ceiling: 140,
    priority: "Garimpo forte · 8,5/10",
    tone: "high",
    note: "Com 5% de comissão e R$ 6 de embalagem, o lance de R$ 100 totaliza R$ 111 antes do frete. Mesmo catálogo com encarte aparece ativo a partir de R$ 230; há venda internacional concluída por € 89. Não passar do teto.",
    url: "https://www.credanceleiloes.com.br/peca.asp?ID=32122211",
  },
  {
    lot: 237,
    artist: "Temple of the Dog",
    title: "Temple of the Dog",
    date: "27 ago · 18h",
    condition: "Brasil 1992; capa VG+, encarte EX e disco M",
    currentBid: 180,
    nextBid: 200,
    ceiling: 300,
    priority: "Garimpo forte · 8,5/10",
    tone: "high",
    note: "Com 5% de comissão e R$ 6 de embalagem, o lance de R$ 200 totaliza R$ 216 antes do frete. Há pedido ativo diretamente comparável a R$ 450 e outros a R$ 800–850; faltou venda brasileira recente, então não perseguir acima de R$ 300.",
    url: "https://www.credanceleiloes.com.br/peca.asp?ID=32122322",
  },
  {
    lot: 245,
    artist: "U2",
    title: "Achtung Baby",
    date: "27 ago · 18h",
    condition: "Brasil 1991; capa VG+, contracapa EX, encarte VG e disco VG",
    currentBid: 40,
    nextBid: 45,
    ceiling: 90,
    priority: "Márcio A+ · 9/10",
    tone: "high",
    note: "Com 5% de comissão e R$ 6 de embalagem, o lance de R$ 45 totaliza R$ 53,25 antes do frete. Comparáveis nacionais aparecem entre R$ 120 e R$ 215; teto de R$ 90 segue conservador mesmo com o disco VG.",
    url: "https://www.credanceleiloes.com.br/peca.asp?ID=32122330",
  },
  {
    lot: 9,
    artist: "Art Popular",
    title: "Nova Era",
    date: "27 ago · 18h",
    condition: "Brasil 1995; capa VG+; confirmar mídia",
    currentBid: 15,
    nextBid: 20,
    ceiling: 50,
    priority: "Boa oportunidade",
    tone: "high",
    note: "Pedidos ativos vistos de R$ 80 a R$ 200, mas a liquidez é incerta. Comprar pelo preço, não pelo topo dos anúncios.",
    url: "https://www.credanceleiloes.com.br/peca.asp?ID=32122094",
  },
  {
    lot: 8,
    artist: "Art Popular",
    title: "O Canto da Razão",
    date: "27 ago · 18h",
    condition: "Brasil 1993; capa VG; confirmar mídia",
    currentBid: 15,
    nextBid: 20,
    ceiling: 40,
    priority: "Boa oportunidade",
    tone: "medium",
    note: "Comparáveis ativos aparecem por R$ 60–80. O estado VG e a amostra pequena seguram o teto.",
    url: "https://www.credanceleiloes.com.br/peca.asp?ID=32122093",
  },
  {
    lot: 14,
    artist: "The Beatles",
    title: "Os Reis do Iê Iê Iê",
    date: "27 ago · 18h",
    condition: "Brasil 1964 mono; capa VG+, disco VG e sem encarte",
    currentBid: 30,
    nextBid: 40,
    ceiling: 60,
    priority: "Boa oportunidade",
    tone: "medium",
    note: "Mesmo número de catálogo está anunciado por R$ 100 e R$ 180; houve oferta esgotada perto de R$ 60. Estado impede nota maior.",
    url: "https://www.credanceleiloes.com.br/peca.asp?ID=32122099",
  },
  {
    lot: 239,
    artist: "Titãs",
    title: "Go Back",
    date: "27 ago · 18h",
    condition: "Brasil 1988; capa M, encarte NM e disco M",
    currentBid: 35,
    nextBid: 40,
    ceiling: 65,
    priority: "Boa compra · 8/10",
    tone: "medium",
    note: "Com 5% de comissão e R$ 6 de embalagem, o lance de R$ 40 totaliza R$ 48 antes do frete. Conservação muito acima da média; ativos com encarte aparecem de R$ 115 a R$ 229 e há esgotados de R$ 45 a R$ 59.",
    url: "https://www.credanceleiloes.com.br/peca.asp?ID=32122324",
  },
  {
    lot: 177,
    artist: "Queen",
    title: "A Day at the Races",
    date: "27 ago · 18h",
    condition: "Brasil 1994; capa EX, encarte NM e disco EX",
    currentBid: 80,
    nextBid: 90,
    ceiling: 110,
    priority: "Opção secundária · 6,5/10",
    tone: "careful",
    note: "Com 5% de comissão e R$ 6 de embalagem, o lance de R$ 90 totaliza R$ 100,50 antes do frete. Pedidos ativos de edições brasileiras começam perto de R$ 130, mas faltou venda concluída equivalente da reedição de 1994.",
    url: "https://www.credanceleiloes.com.br/peca.asp?ID=32122262",
  },
  {
    lot: 25,
    artist: "The Bolshoi",
    title: "Friends",
    date: "27 ago · 18h",
    condition: "Brasil 1987; capa VG+; confirmar encarte e mídia",
    currentBid: 20,
    nextBid: 30,
    ceiling: 40,
    priority: "Preço interessante",
    tone: "medium",
    note: "Há cópia sem encarte por R$ 30 e várias entre R$ 50 e R$ 80. Só elevar o teto se estiver completo.",
    url: "https://www.credanceleiloes.com.br/peca.asp?ID=32122110",
  },
  {
    lot: 246,
    artist: "Ugly Kid Joe",
    title: "America's Least Wanted",
    date: "27 ago · 18h",
    condition: "Brasil 1992; capa NM, disco VG e sem encarte",
    currentBid: 80,
    nextBid: 90,
    ceiling: 110,
    priority: "Cautela",
    tone: "careful",
    note: "Pedidos ativos começam em R$ 150, mas disco VG e ausência de encarte eliminam boa parte da margem.",
    url: "https://www.credanceleiloes.com.br/peca.asp?ID=32122331",
  },
  {
    lot: 180,
    artist: "Red Hot Chili Peppers",
    title: "Blood Sugar Sex Magik (2LP)",
    date: "27 ago · 18h",
    condition: "Brasil 1991; capa e internos NM; discos NM/M",
    currentBid: 240,
    nextBid: 260,
    ceiling: 300,
    priority: "Monitorar sem perseguir",
    tone: "careful",
    note: "Pedidos ativos equivalentes começam perto de R$ 349, mas existe referência de loja bem menor sem disponibilidade confirmada.",
    url: "https://www.credanceleiloes.com.br/peca.asp?ID=32122265",
  },
  {
    lot: 3,
    artist: "The Alan Parsons Project",
    title: "Vulture Culture",
    date: "27 ago · 18h",
    condition: "Brasil 1985; capa e disco VG+; sem encarte; precisa limpeza",
    currentBid: 20,
    nextBid: 20,
    bidLabel: "Abertura",
    ceiling: 40,
    priority: "Boa oportunidade",
    tone: "high",
    note: "Ativos equivalentes começam em R$ 65; existe referência esgotada a R$ 20. Bom somente enquanto permanecer baixo.",
    url: "https://www.credanceleiloes.com.br/peca.asp?ID=32122088",
  },
  {
    lot: 231,
    artist: "Supertramp",
    title: "Even In The Quietest Moments",
    date: "27 ago · 18h",
    condition: "Brasil 1977; capa VG+, contracapa EX e disco NM; precisa limpeza",
    currentBid: 25,
    nextBid: 30,
    ceiling: 45,
    priority: "Monitorar",
    tone: "medium",
    note: "Há oferta ativa sem estado detalhado por R$ 37 e cópias completas entre R$ 65 e R$ 135. O disco NM sustenta o teto.",
    url: "https://www.credanceleiloes.com.br/peca.asp?ID=32122316",
  },
  {
    lot: 232,
    artist: "Supertramp",
    title: "Famous Last Words",
    date: "27 ago · 18h",
    condition: "Brasil 1982; capa VG+, contracapa EX e disco NM; encarte não informado",
    currentBid: 20,
    nextBid: 25,
    ceiling: 30,
    priority: "Preço normal",
    tone: "careful",
    note: "Já existem anúncios ativos por R$ 25–30, inclusive com encarte. Não vale transformar em disputa.",
    url: "https://www.credanceleiloes.com.br/peca.asp?ID=32122317",
  },
];
const acioliAuctionWatch: AuctionWatch[] = [
  {
    lot: 20,
    artist: "Big Country",
    title: "Steeltown",
    date: "27 ago · 19h",
    condition: "Brasil 1984; capa e disco VG+",
    currentBid: 20,
    nextBid: 20,
    bidLabel: "Abertura",
    ceiling: 30,
    priority: "Curinga barato · 7/10",
    tone: "medium",
    note: "Uma cópia brasileira ativa apareceu por R$ 50 (R$ 48,50 no Pix). Margem boa na abertura, mas confiança média pela amostra curta; não perseguir.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=31973020",
  },
  {
    lot: 61,
    artist: "Damnation",
    title: "The Second Damnation",
    date: "27 ago · 19h",
    condition: "Original brasileira de 1970; capa VG e disco VG+; matriz informada S-UA-6773",
    currentBid: 150,
    nextBid: 150,
    bidLabel: "Abertura",
    ceiling: 120,
    priority: "Teto ultrapassado · passar",
    tone: "careful",
    note: "Há anúncio nacional aparentemente equivalente por R$ 120 com frete grátis. Confirmar matriz, mas não entrar no valor atual.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=31983926",
  },
  {
    lot: 63,
    artist: "Deep Purple",
    title: "Fireball",
    date: "27 ago · 19h",
    condition: "Capa gatefold e disco VG+; confirmar ano, selo e matriz nas fotos",
    currentBid: 30,
    nextBid: 32,
    ceiling: 75,
    priority: "Garimpo principal · 9,4/10",
    tone: "high",
    note: "Próximo lance custa R$ 33,60 com 5%. OLX comparável aparece a R$ 100 e Mercado Livre parte de cerca de R$ 130; nossa Adornos registra R$ 148/189.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=31984083",
  },
  {
    lot: 73,
    artist: "Dire Straits",
    title: "On Every Street",
    date: "27 ago · 19h",
    condition: "Brasil 1991; capa, encarte e disco VG+",
    currentBid: 60,
    nextBid: 65,
    ceiling: 60,
    priority: "Teto ultrapassado · passar",
    tone: "careful",
    note: "O próximo lance custa R$ 68,25 com 5%, antes do frete. Com piso ativo perto de R$ 79,60, a margem ficou pequena demais.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=31984923",
  },
  {
    lot: 79,
    artist: "Duran Duran",
    title: "Duran Duran",
    date: "27 ago · 19h",
    condition: "Brasil 1981; capa, encarte e disco VG+",
    currentBid: 40,
    nextBid: 42,
    ceiling: 60,
    priority: "Garimpo forte · 8,7/10",
    tone: "high",
    note: "Próximo lance custa R$ 44,10 com 5%. Cópias nacionais com encarte aparecem por R$ 79,90, R$ 100, R$ 120 e acima.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=31989898",
  },
  {
    lot: 83,
    artist: "Electric Light Orchestra",
    title: "Time",
    date: "27 ago · 19h",
    condition: "Brasil 1981; capa, encarte e disco VG+",
    currentBid: 20,
    nextBid: 20,
    bidLabel: "Abertura",
    ceiling: 50,
    priority: "Garimpo principal · 9,2/10",
    tone: "high",
    note: "Abertura custa R$ 21 com 5%. Comparável nacional VG+ aparece por R$ 79 e outras cópias ativas ficam perto de R$ 90–100.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=31996098",
  },
  {
    lot: 99,
    artist: "4 Non Blondes",
    title: "Bigger, Better, Faster, More!",
    date: "27 ago · 19h",
    condition: "Brasil 1992; capa, encarte e disco VG+",
    currentBid: 70,
    nextBid: 75,
    ceiling: 105,
    priority: "Garimpo principal · 9,3/10",
    tone: "high",
    note: "Próximo lance custa R$ 78,75 com 5%. Comparáveis ativos: OLX R$ 150–200 e Mercado Livre R$ 189–230. Confirmar a prensagem nas fotos.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=32009060",
  },
  {
    lot: 117,
    artist: "Jethro Tull",
    title: "Live — Bursting Out",
    date: "27 ago · 19h",
    condition: "Brasil 1978; capa gatefold e vinil duplo VG+",
    currentBid: 50,
    nextBid: 55,
    ceiling: 90,
    priority: "Garimpo principal · 9,4/10",
    tone: "high",
    note: "Próximo lance custa R$ 57,75 com 5%. Nossa Adornos registra R$ 148; anúncios nacionais ativos localizados ficam perto de R$ 200.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=32014511",
  },
  {
    lot: 119,
    artist: "Jimmy Cliff",
    title: "Breakout",
    date: "27 ago · 19h",
    condition: "Brasil 1991; capa, encarte e disco VG+",
    currentBid: 30,
    nextBid: 32,
    ceiling: 55,
    priority: "Garimpo forte · 8,8/10",
    tone: "high",
    note: "Próximo lance custa R$ 33,60 com 5%. Comparável com encarte aparece por R$ 80; cópia sem encarte, R$ 70,09, e OLX comparável, R$ 99.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=32014763",
  },
  {
    lot: 128,
    artist: "Judas Priest",
    title: "Point of Entry",
    date: "27 ago · 19h",
    condition: "Brasil 1981, CBS 138501; capa e disco VG+",
    currentBid: 42,
    nextBid: 44,
    ceiling: 75,
    priority: "Garimpo principal · 9,2/10",
    tone: "high",
    note: "Próximo lance custa R$ 46,20 com 5%. Mercado Livre começa em R$ 100–105 e concentra cópias equivalentes perto de R$ 155–190.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=32015301",
  },
  {
    lot: 138,
    artist: "Legião Urbana",
    title: "Legião Urbana",
    date: "27 ago · 19h",
    condition: "Brasil 1985; capa, encarte e disco VG+",
    currentBid: 32,
    nextBid: 34,
    ceiling: 70,
    priority: "Garimpo principal · 8,9/10",
    tone: "high",
    note: "Próximo lance custa R$ 35,70 com 5%. Anúncios ativos com encarte ficam em R$ 140–160 ou mais; nossa tabela já viu outro exemplar em leilão por R$ 29.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=32019020",
  },
  {
    lot: 145,
    artist: "Marillion",
    title: "Seasons End",
    date: "27 ago · 19h",
    condition: "Brasil 1989; capa gatefold e disco VG+",
    currentBid: 20,
    nextBid: 22,
    ceiling: 50,
    priority: "Garimpo principal · 9,2/10",
    tone: "high",
    note: "Próximo lance custa R$ 23,10 com 5%. Comparáveis ativos começam em R$ 80 e se concentram perto de R$ 90–146.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=32019441",
  },
  {
    lot: 209,
    artist: "The Cult",
    title: "Sonic Temple",
    date: "28 ago · 19h",
    condition: "1ª brasileira 068 427007 1; capa e encarte VG, disco VG+",
    currentBid: 40,
    nextBid: 40,
    bidLabel: "Abertura",
    ceiling: 60,
    priority: "Prioridade alta · 9/10",
    tone: "high",
    note: "Piso ativo isolado em R$ 85; faixa mais recorrente de R$ 120–189. O encarte ajuda, mas o teto continua controlado.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=32033153",
  },
  {
    lot: 217,
    artist: "Titãs",
    title: "Jesus Não Tem Dentes no País dos Banguelas",
    date: "28 ago · 19h",
    condition: "Brasil 1987; capa, encarte e disco VG",
    currentBid: 20,
    nextBid: 20,
    bidLabel: "Abertura",
    ceiling: 50,
    priority: "Garimpo forte · 8,7/10",
    tone: "high",
    note: "Comparáveis ativos aparecem de R$ 79 a R$ 149. Estado VG impede perseguir o lote acima do teto.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=32053645",
  },
  {
    lot: 236,
    artist: "Alcione",
    title: "Não Deixe o Samba Morrer",
    date: "28 ago · 19h",
    condition: "Globo/Polydor, 1995; capa e disco VG",
    currentBid: 2,
    nextBid: 4,
    ceiling: 75,
    priority: "Melhor oportunidade · 9,7/10",
    tone: "high",
    note: "Comparáveis ativos da edição de 1995 aparecem de R$ 120 a R$ 240. Melhor relação entre lance e mercado do catálogo.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=32095908",
  },
  {
    lot: 246,
    artist: "Carlinhos Félix",
    title: "Basta Querer",
    date: "28 ago · 19h",
    condition: "MK, 1993; capa e disco VG; encarte não informado",
    currentBid: 2,
    nextBid: 4,
    ceiling: 65,
    priority: "Prioridade alta · 9,5/10",
    tone: "high",
    note: "Comparáveis ativos aparecem por R$ 110, R$ 150 e R$ 249,95. Liquidez de nicho segura o teto.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=32097061",
  },
  {
    lot: 259,
    artist: "Ed Motta & Conexão Japeri",
    title: "Ed Motta & Conexão Japeri",
    date: "28 ago · 19h",
    condition: "WEA, 1988; capa e disco VG",
    currentBid: 22,
    nextBid: 24,
    ceiling: 50,
    priority: "Garimpo forte · 8,8/10",
    tone: "high",
    note: "Há cópia com capa pior por R$ 79; as demais referências ativas começam em R$ 106–150.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=32099648",
  },
  {
    lot: 285,
    artist: "Michel Petrucciani",
    title: "Power of Three",
    date: "28 ago · 19h",
    condition: "Blue Note; capa, encarte e disco VG",
    currentBid: 2,
    nextBid: 4,
    ceiling: 45,
    priority: "Garimpo forte · 8,5/10",
    tone: "high",
    note: "Dois comparáveis brasileiros localizados por R$ 89,05 e R$ 110; confiança média pela amostra pequena.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=32103966",
  },
  {
    lot: 318,
    artist: "Wayne Shorter",
    title: "Joy Ryder",
    date: "28 ago · 19h",
    condition: "Columbia, 1988; capa e disco VG+",
    currentBid: 5,
    nextBid: 7,
    ceiling: 50,
    priority: "Curinga jazz · 8,3/10",
    tone: "medium",
    note: "Comparável brasileiro localizado por R$ 119,90, mas sem amostra suficiente para uma nota de confiança alta.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=32104613",
  },
  {
    lot: 319,
    artist: "Zbigniew Namysłowski Quintet",
    title: "Winobranie · Polish Jazz Vol. 33",
    date: "28 ago · 19h",
    condition: "Muza, 1973; capa e disco VG+; confirmar selo e matriz",
    currentBid: 6,
    nextBid: 8,
    ceiling: 45,
    priority: "Curinga importado · 7,8/10",
    tone: "medium",
    note: "Referências polonesas aparecem por 45–100 zł antes do frete. Interessante, mas com liquidez local incerta.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=32104625",
  },
];

const albertoLopesAuctionWatch: AuctionWatch[] = [
  {
    lot: 19,
    artist: "Paulinho da Viola",
    title: "Eu Canto Samba",
    date: "26 ago · 19h",
    condition: "Capa VG; disco VG+; com encarte",
    currentBid: 15,
    nextBid: 25,
    ceiling: 30,
    priority: "Ótima abertura · 8/10",
    tone: "high",
    note: "Para entrar no próximo lance de R$ 25, o custo fica em R$ 26,25 com 5%, antes do frete. Cópias ativas com encarte começam em R$ 39–45 e nossa Adornos registra R$ 65.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32104981",
  },
  {
    lot: 29,
    artist: "Impacto V",
    title: "Rio Potengi",
    date: "26 ago · 19h",
    condition: "Capa VG; disco NM; com encarte",
    currentBid: 25,
    nextBid: 35,
    ceiling: 50,
    priority: "Aposta documental · confiança baixa",
    tone: "careful",
    note: "Edição independente do Projeto Memória/UFRN, de 1983, com encarte. Não encontrei anúncio ativo nem venda concluída equivalente; escassez não comprova valor.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32104991",
  },
  {
    lot: 35,
    artist: "Diana Pequeno",
    title: "Sinal de Amor",
    date: "26 ago · 19h",
    condition: "Capa VG+; disco NM; encarte não informado",
    currentBid: 15,
    nextBid: 25,
    ceiling: 30,
    priority: "Boa compra · 7/10",
    tone: "medium",
    note: "Para entrar no próximo lance de R$ 25, o custo fica em R$ 26,25 com 5%. Há cópia ativa na Shopee por R$ 40 + R$ 8,39 de frete; sem venda concluída confirmada.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32104997",
  },
  {
    lot: 41,
    artist: "Alice in Chains",
    title: "Facelift",
    date: "26 ago · 19h",
    condition: "Capa VG+; disco NM; com encarte; confirmar país e ano",
    currentBid: 340,
    nextBid: 360,
    ceiling: 330,
    priority: "Passar — margem acabou",
    tone: "careful",
    note: "Para entrar no próximo lance de R$ 360, o custo fica em R$ 378 com comissão, antes do frete. Reedição ativa aparece por R$ 349,90 e nacionais usados a partir de cerca de R$ 375; a edição do lote ainda não está confirmada.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32105003",
  },
  {
    lot: 45,
    artist: "Milton Nascimento",
    title: "Anima",
    date: "26 ago · 19h",
    condition: "Capa VG; disco VG; com encarte",
    currentBid: 15,
    nextBid: 25,
    ceiling: 25,
    priority: "Boa compra · 7/10",
    tone: "medium",
    note: "Para entrar no próximo lance de R$ 25, o custo fica em R$ 26,25 com comissão. Há cópias ativas por R$ 30–40 e nossa Adornos registra R$ 43; o estado VG limita o teto.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32105007",
  },
  {
    lot: 109,
    artist: "Chet Baker",
    title: "Chet on Poetry",
    date: "26 ago · 19h",
    condition: "Disco em bom estado; capa em mau estado; edição ainda não identificada",
    currentBid: 15,
    nextBid: 25,
    ceiling: 35,
    priority: "Confirmar edição · 6,5/10",
    tone: "careful",
    note: "O original de 1989 e a reedição de 2022 não são equivalentes. A capa ruim e a edição não confirmada impedem nota alta; vale conferir os selos antes do lance.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32105071",
  },
  {
    lot: 161,
    artist: "Keith Jarrett",
    title: "Concerts",
    date: "26 ago · 19h",
    condition: "Disco NM; capa em mau estado; edição nacional",
    currentBid: 15,
    nextBid: 15,
    bidLabel: "Abertura",
    ceiling: 25,
    priority: "Boa curiosidade · 6,5/10",
    tone: "medium",
    note: "Anúncios ativos da edição nacional aparecem em R$ 39–43,90 e sobem a R$ 69–139. A capa ruim reduz muito a vantagem.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32105123",
  },
  {
    lot: 185,
    artist: "Iron Maiden",
    title: "A Real Live One",
    date: "26 ago · 19h",
    condition: "Capa e disco VG+; encarte não informado",
    currentBid: 122,
    nextBid: 142,
    ceiling: 180,
    priority: "Garimpo principal · 8/10",
    tone: "high",
    note: "Para entrar no próximo lance de R$ 142, o custo fica em R$ 149,10 com 5%. Anúncios ativos brasileiros aparecem em R$ 300–365 e sobem a R$ 480; uma cópia com encarte a R$ 225 está esgotada. Teto de R$ 180 sem encarte confirmado.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32105147",
  },
  {
    lot: 273,
    artist: "Antonio Adolfo",
    title: "Encontro Musical",
    date: "26 ago · 19h",
    condition: "Aparenta ser a edição independente de 1978; capa VG+; disco NM; confirmar selo Artezanal LP-A-002",
    currentBid: 25,
    nextBid: 35,
    ceiling: 45,
    priority: "Melhor achado · 8,5/10",
    tone: "high",
    note: "Para entrar no próximo lance de R$ 35, o custo fica em R$ 36,75 com 5%. Comparáveis ativos aparecem em R$ 60 numa cópia inferior, R$ 82,56, R$ 129 e R$ 149–159; sem venda concluída confirmada.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32105235",
  },
  {
    lot: 385,
    artist: "Supertramp",
    title: "The Autobiography of Supertramp",
    date: "27 ago · 19h",
    condition: "Capa e disco NM; com encarte",
    currentBid: 25,
    nextBid: 35,
    ceiling: 55,
    priority: "Preço normal · 6/10",
    tone: "careful",
    note: "Existe comparável ativo a R$ 38,99. O excelente estado ajuda, mas não vale transformar em disputa.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32105347",
  },
  {
    lot: 449,
    artist: "Santana",
    title: "Abraxas",
    date: "27 ago · 19h",
    condition: "Capa e disco VG+; confirmar selo e ano",
    currentBid: 25,
    nextBid: 35,
    ceiling: 75,
    priority: "Garimpo principal · 8,5/10",
    tone: "high",
    note: "Procura do Márcio. Comparáveis nacionais começam em R$ 109; teto de R$ 90 só se for prensagem antiga.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32105411",
  },
  {
    lot: 453,
    artist: "Kiss",
    title: "Revenge",
    date: "27 ago · 19h",
    condition: "Disco perfeito; capa em mau estado; edição não confirmada",
    currentBid: 55,
    nextBid: 55,
    currentBidMarkers: "*-",
    bidLabel: "Final",
    ceiling: 110,
    priority: "Vendido por R$ 55",
    tone: "high",
    note: "Venda encerrada em R$ 55. A capa em mau estado torna este exemplar uma referência inferior de conservação.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32105415",
  },
  {
    lot: 455,
    artist: "Muddy Waters",
    title: "Hard Again",
    date: "27 ago · 19h",
    condition: "Capa e disco VG+; encarte não informado",
    currentBid: 71,
    nextBid: 81,
    ceiling: 120,
    priority: "Muito bom · 7,5/10",
    tone: "medium",
    note: "Comparáveis ativos em R$ 180–280. Manter teto conservador sem confirmar edição e encarte.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32105417",
  },
  {
    lot: 473,
    artist: "Hermeto Paschoal e Grupo",
    title: "Brasil Universo",
    date: "27 ago · 19h",
    condition: "Disco NM; capa em mau estado; encarte não informado",
    currentBid: 35,
    nextBid: 45,
    ceiling: 80,
    priority: "Muito bom · 7,5/10",
    tone: "medium",
    note: "Comparáveis completos em R$ 160–285. A capa ruim e a falta do encarte limitam o teto.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32105435",
  },
  {
    lot: 528,
    artist: "Wings",
    title: "Wild Life",
    date: "27 ago · 19h",
    condition: "Capa VG, descrita também como em mau estado; disco VG; edição e encarte não informados",
    currentBid: 25,
    nextBid: 35,
    ceiling: 45,
    priority: "Monitorar · 6,5/10",
    tone: "careful",
    note: "O lance de R$ 35 totaliza R$ 36,75 com 5%, antes do frete. Anúncios ativos começam perto de R$ 50 e uma cópia VG/G+ aparece por R$ 99; a capa castigada segura o teto.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32105489",
  },
  {
    lot: 534,
    artist: "Mike Oldfield",
    title: "Tubular Bells",
    date: "27 ago · 19h",
    condition: "Capa VG+ e disco VG+; edição e encarte não informados",
    currentBid: 25,
    nextBid: 35,
    ceiling: 55,
    priority: "Boa compra · 7,5/10",
    tone: "medium",
    note: "O lance de R$ 35 totaliza R$ 36,75 com 5%, antes do frete. Anúncios usados de época aparecem de R$ 59 a R$ 125; manter o teto enquanto a edição não estiver confirmada.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32105495",
  },
  {
    lot: 545,
    artist: "Beto Guedes",
    title: "Amor de Índio",
    date: "27 ago · 19h",
    condition: "Capa e disco NM; com encarte",
    currentBid: 35,
    nextBid: 45,
    ceiling: 70,
    priority: "Boa compra · 8/10",
    tone: "high",
    note: "Procura do Márcio. Comparáveis em R$ 68–125; estado NM e encarte tornam o lance atraente.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32105507",
  },
  {
    lot: 575,
    artist: "Rumo",
    title: "Rumo",
    date: "27 ago · 19h",
    condition: "Capa e disco VG; encarte não informado",
    currentBid: 15,
    nextBid: 25,
    ceiling: 45,
    priority: "Bom · 7/10",
    tone: "medium",
    note: "Anúncios ativos perto de R$ 90–96. O estado VG reduz a margem.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32105537",
  },
  {
    lot: 583,
    artist: "Aguilar e Banda Performática",
    title: "Aguilar e Banda Performática",
    date: "27 ago · 19h",
    condition: "Capa VG+; disco VG",
    currentBid: 75,
    nextBid: 85,
    ceiling: 120,
    priority: "Bom · 7,5/10",
    tone: "medium",
    note: "Comparável ativo por R$ 229 em estado superior. A condição VG pede teto mais baixo.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32105545",
  },
];

const cavernaVintageAuctionWatch: AuctionWatch[] = [
  {
    lot: 130,
    artist: "Genesis",
    title: "Foxtrot",
    date: "31 ago · 18h30",
    condition: "Capa simples; edição, selo e ano não informados; disco não testado; riscos e danos de capa possíveis",
    currentBid: 40,
    nextBid: 50,
    ceiling: 90,
    priority: "Garimpo condicional · 8/10",
    tone: "high",
    note: "Próximo lance custa R$ 52,50 com 5%. Cópia nacional ativa aparece por R$ 230,86, mas a edição do lote precisa ser confirmada antes de usar o teto cheio.",
    url: "https://www.cavernavintage.com.br/peca.asp?ID=32192531",
  },
  {
    lot: 139,
    artist: "Hermeto Pascoal e Grupo",
    title: "Brasil Universo",
    date: "31 ago · 18h30",
    condition: "Capa simples; encarte não informado; disco não testado; riscos e danos de capa possíveis",
    currentBid: 40,
    nextBid: 50,
    ceiling: 90,
    priority: "Garimpo forte · 8,5/10",
    tone: "high",
    note: "Próximo lance custa R$ 52,50 com 5%. Anúncios ativos completos ficam em R$ 250–285; sem foto detalhada, teste ou encarte confirmado, o teto fica bem abaixo dessa faixa.",
    url: "https://www.cavernavintage.com.br/peca.asp?ID=32191742",
  },
  {
    lot: 198,
    artist: "Titãs",
    title: "Cabeça Dinossauro",
    date: "31 ago · 18h30",
    condition: "Capa gatefold; disco não testado; encarte não informado; riscos e danos de capa possíveis",
    currentBid: 30,
    nextBid: 40,
    ceiling: 80,
    priority: "Procura Márcio · A+ · 8,5/10",
    tone: "high",
    note: "Próximo lance custa R$ 42 com 5%. A tabela já viu outro exemplar por R$ 49 e o piso ativo diretamente comparável está perto de R$ 155.",
    url: "https://www.cavernavintage.com.br/peca.asp?ID=32191443",
  },
  {
    lot: 200,
    artist: "New Order",
    title: "Technique",
    date: "31 ago · 18h30",
    condition: "Capa simples; disco não testado; encarte não informado; riscos e danos de capa possíveis",
    currentBid: 20,
    nextBid: 30,
    ceiling: 50,
    priority: "Melhor relação preço/mercado · 8,5/10",
    tone: "high",
    note: "Próximo lance custa R$ 31,50 com 5%. Há cópias nacionais ativas de R$ 70 a R$ 120; confirmar fotos e encarte, pois o lote 30 do mesmo leilão está bem mais caro.",
    url: "https://www.cavernavintage.com.br/peca.asp?ID=32189276",
  },
  {
    lot: 204,
    artist: "AC/DC",
    title: "If You Want Blood",
    date: "31 ago · 18h30",
    condition: "Capa simples; disco não testado; edição e encarte não informados; riscos e danos de capa possíveis",
    currentBid: 45,
    nextBid: 55,
    ceiling: 75,
    priority: "Boa compra · 7,5/10",
    tone: "medium",
    note: "Próximo lance custa R$ 57,75 com 5%. A tabela registra R$ 60 em leilão; anúncios nacionais usados aparecem por R$ 114–200. A condição desconhecida impede perseguir.",
    url: "https://www.cavernavintage.com.br/peca.asp?ID=32190029",
  },
  {
    lot: 210,
    artist: "The Cult",
    title: "Love",
    date: "31 ago · 18h30",
    condition: "Capa gatefold; disco não testado; encarte não informado; riscos e danos de capa possíveis",
    currentBid: 35,
    nextBid: 45,
    ceiling: 75,
    priority: "Garimpo forte · 8,5/10",
    tone: "high",
    note: "Próximo lance custa R$ 47,25 com 5%. Comparáveis usados ativos aparecem por R$ 132–200; a ausência de encarte e graduação segura o teto.",
    url: "https://www.cavernavintage.com.br/peca.asp?ID=32192528",
  },
];

const discosEsquecidosAuctionWatch: AuctionWatch[] = [
  {
    lot: 50,
    artist: "Milton Nascimento",
    title: "Minas",
    date: "8 set · 19h",
    condition: "Capa e disco VG+; marcas mínimas; avaliação apenas visual; encarte não confirmado",
    currentBid: 100,
    nextBid: 110,
    ceiling: 85,
    priority: "Acima da referência · passar",
    tone: "careful",
    note: "Procura A+ do Márcio, mas o lance já supera os R$ 87 da Adornos registrados na tabela. Sem teste e sem encarte confirmado, não há motivo para aumentar.",
    url: "https://www.discosesquecidosleilao.com.br/peca.asp?ID=32205257",
  },
  {
    lot: 52,
    artist: "Milton Nascimento",
    title: "Geraes",
    date: "8 set · 19h",
    condition: "Capa VG/VG+ e disco VG+; marcas mínimas; avaliação apenas visual; encarte não confirmado",
    currentBid: 50,
    nextBid: 60,
    ceiling: 60,
    priority: "Boa faixa · não perseguir",
    tone: "medium",
    note: "Procura A do Márcio. Há cópia ativa desde R$ 33,50 e exemplar com encarte a R$ 95 com duas vendas; a falta de teste e encarte segura o teto.",
    url: "https://www.discosesquecidosleilao.com.br/peca.asp?ID=32205259",
  },
  {
    lot: 76,
    artist: "Rita Lee & Tutti Frutti",
    title: "Fruto Proibido",
    date: "8 set · 19h",
    condition: "Capa G+/VG e disco G+; lado 2, faixa 1, com muitos pulos; restante toca razoavelmente",
    currentBid: 50,
    nextBid: 60,
    ceiling: 50,
    priority: "No teto · não aumentar",
    tone: "careful",
    note: "Procura A+ do Márcio, mas esta é uma cópia de audição incompleta. Os anúncios de R$ 230–450 são de exemplares muito melhores e não justificam perseguir este lote.",
    url: "https://www.discosesquecidosleilao.com.br/peca.asp?ID=32205283",
  },
  {
    lot: 90,
    artist: "Gilberto Gil",
    title: "Expresso 2222",
    date: "8 set · 19h",
    condition: "Original; capa G+ colada com fita; disco VG testado, com chiado e estalos",
    currentBid: 120,
    nextBid: 130,
    ceiling: 140,
    priority: "Estado crítico · teto curto",
    tone: "careful",
    note: "Procura A+ do Márcio. Referências de loja em melhor estado aparecem por R$ 220–360; a capa remendada e o ruído retiram boa parte da margem.",
    url: "https://www.discosesquecidosleilao.com.br/peca.asp?ID=32205297",
  },
  {
    lot: 91,
    artist: "Os Mutantes",
    title: "A Divina Comédia ou Ando Meio Desligado",
    date: "8 set · 19h",
    condition: "Original; capa e disco G+; chiado constante, estalos e um ou outro pulo no lado 1",
    currentBid: 80,
    nextBid: 90,
    ceiling: 110,
    priority: "Raro, mas cópia ruim",
    tone: "careful",
    note: "Procura A do Márcio. Pedidos ativos de cópias melhores começam perto de R$ 390, mas o estado G+ não é equivalente; comprar apenas como cópia de audição.",
    url: "https://www.discosesquecidosleilao.com.br/peca.asp?ID=32205298",
  },
  {
    lot: 92,
    artist: "Titãs",
    title: "Cabeça Dinossauro",
    date: "8 set · 19h",
    condition: "Capa e disco VG+; marcas mínimas; avaliação apenas visual; encarte não confirmado",
    currentBid: 40,
    nextBid: 50,
    ceiling: 90,
    priority: "Garimpo principal · 8/10",
    tone: "high",
    note: "Procura A+ do Márcio. O catálogo já registra R$ 49 em leilão, enquanto anúncios ativos usados partem de cerca de R$ 155; o teto considera falta de teste e encarte.",
    url: "https://www.discosesquecidosleilao.com.br/peca.asp?ID=32205299",
  },
  {
    lot: 94,
    artist: "Legião Urbana",
    title: "Que País É Este",
    date: "8 set · 19h",
    condition: "Capa VG+/NM e disco VG+; avaliação apenas visual; encarte não confirmado",
    currentBid: 40,
    nextBid: 50,
    ceiling: 80,
    priority: "Garimpo principal · 8/10",
    tone: "high",
    note: "Procura A do Márcio. Anúncios ativos usados começam em R$ 90 e exemplares VG/com encarte ficam em R$ 159–250; sem teste, convém ficar abaixo da faixa baixa.",
    url: "https://www.discosesquecidosleilao.com.br/peca.asp?ID=32205301",
  },
  {
    lot: 97,
    artist: "Legião Urbana",
    title: "Dois",
    date: "8 set · 19h",
    condition: "Capa VG+ e disco VG; algumas marcas; avaliação apenas visual; encarte não confirmado",
    currentBid: 30,
    nextBid: 40,
    ceiling: 60,
    priority: "Boa oportunidade · 7,5/10",
    tone: "high",
    note: "Procura A+ do Márcio. A tabela tem Adornos a R$ 87 e anúncios ativos vão de R$ 59 com defeitos a R$ 120–239; o estado não testado limita o teto.",
    url: "https://www.discosesquecidosleilao.com.br/peca.asp?ID=32205304",
  },
  {
    lot: 100,
    artist: "Golpe de Estado",
    title: "Quarto Golpe",
    date: "8 set · 19h",
    condition: "Capa VG+ e disco VG+/NM; marcas mínimas; avaliação apenas visual; encarte não confirmado",
    currentBid: 20,
    nextBid: 30,
    ceiling: 70,
    priority: "Garimpo principal · 8,5/10",
    tone: "high",
    note: "A tabela registra R$ 109 na Adornos e anúncios ativos aparecem por R$ 99–131. É a melhor relação preço/estado do leilão, ainda sem venda concluída confirmada.",
    url: "https://www.discosesquecidosleilao.com.br/peca.asp?ID=32205307",
  },
  {
    lot: 138,
    artist: "Judas Priest",
    title: "British Steel",
    date: "8 set · 19h",
    condition: "Capa e disco VG+; marcas mínimas; avaliação apenas visual",
    currentBid: 70,
    nextBid: 80,
    ceiling: 105,
    priority: "Boa faixa · 7/10",
    tone: "medium",
    note: "Procura A do Márcio. Um anúncio finalizado de cópia excelente estava em R$ 170; sem teste e sem venda concluída confirmada, o desconto é bom, não excepcional.",
    url: "https://www.discosesquecidosleilao.com.br/peca.asp?ID=32205345",
  },
  {
    lot: 144,
    artist: "Stress",
    title: "Flor Atômica",
    date: "8 set · 19h",
    condition: "Capa VG e disco VG+; marcas mínimas; avaliação visual; encarte não confirmado",
    currentBid: 50,
    nextBid: 60,
    ceiling: 120,
    priority: "Garimpo principal · 8,5/10",
    tone: "high",
    note: "Cópias ativas melhores e com encarte aparecem por R$ 240–285. A margem é forte, mas não se deve pagar como exemplar completo sem confirmar o encarte.",
    url: "https://www.discosesquecidosleilao.com.br/peca.asp?ID=32205351",
  },
  {
    lot: 146,
    artist: "The Smiths",
    title: "The World Won't Listen",
    date: "8 set · 19h",
    condition: "Capa G+ e disco VG/VG+; marcas superficiais; não testado; encarte não confirmado",
    currentBid: 20,
    nextBid: 30,
    ceiling: 75,
    priority: "Garimpo forte · capa crítica",
    tone: "high",
    note: "Anúncios ativos de cópias melhores começam em cerca de R$ 199. O lance é baixo, mas a capa G+ e a ausência de teste/encarte justificam teto conservador.",
    url: "https://www.discosesquecidosleilao.com.br/peca.asp?ID=32205353",
  },
  {
    lot: 147,
    artist: "The Cure",
    title: "Standing on a Beach — The Singles",
    date: "8 set · 19h",
    condition: "Capa G e disco G+/VG; muitas marcas superficiais; não testado; encarte não confirmado",
    currentBid: 30,
    nextBid: 40,
    ceiling: 40,
    priority: "Só cópia de audição",
    tone: "careful",
    note: "Há cópias ativas melhores a R$ 80–120, inclusive nacional com encarte a R$ 120. O estado muito inferior explica o desconto; parar no próximo lance.",
    url: "https://www.discosesquecidosleilao.com.br/peca.asp?ID=32205354",
  },
  {
    lot: 148,
    artist: "Siouxsie & the Banshees",
    title: "Through the Looking Glass",
    date: "8 set · 19h",
    condition: "Capa e disco G+; muitas marcas; não testado; encarte não confirmado",
    currentBid: 40,
    nextBid: 50,
    ceiling: 50,
    priority: "Cópia de audição · não perseguir",
    tone: "careful",
    note: "Anúncios ativos usados aparecem por R$ 135–142, mas em condição melhor. Aqui o risco de reprodução é alto e a vantagem termina rapidamente.",
    url: "https://www.discosesquecidosleilao.com.br/peca.asp?ID=32205355",
  },
  {
    lot: 184,
    artist: "Metallica",
    title: "Metallica (Black Album) — 2LP",
    date: "8 set · 19h",
    condition: "Original brasileiro duplo; capa VG e discos VG+; avaliação visual; encartes não confirmados",
    currentBid: 120,
    nextBid: 130,
    ceiling: 230,
    priority: "Garimpo principal · 8,5/10",
    tone: "high",
    note: "Procura A+ do Márcio. Pedidos ativos de originais usados aparecem por cerca de R$ 330–599. Falta confirmar reprodução e encartes antes de usar o teto cheio.",
    url: "https://www.discosesquecidosleilao.com.br/peca.asp?ID=32205390",
  },
  {
    lot: 188,
    artist: "Nine Days Wonder",
    title: "We Never Lost Control",
    date: "8 set · 19h",
    condition: "Prensagem brasileira; capa VG+ e disco VG/VG+; algumas marcas; avaliação apenas visual",
    currentBid: 20,
    nextBid: 30,
    ceiling: 55,
    priority: "Interessante · 7/10",
    tone: "medium",
    note: "Uma cópia brasileira VG-/VG- já esgotada estava a R$ 90. É boa abertura, mas não há venda concluída nem base para repetir a alegação de raridade do vendedor.",
    url: "https://www.discosesquecidosleilao.com.br/peca.asp?ID=32205394",
  },
  {
    lot: 191,
    artist: "Tim Maia",
    title: "Racional Vol. 1",
    date: "8 set · 19h",
    condition: "Original; capa P, disco visual G+ e reprodução aproximada VG; um pulo no lado 1",
    currentBid: 140,
    nextBid: 150,
    ceiling: 160,
    priority: "Raro, mas estado muito ruim",
    tone: "careful",
    note: "Procura A+ do Márcio. Anúncios de originais em estado não equivalente pedem R$ 899–2.500; a capa P e o pulo tornam esses preços inadequados como comparação direta.",
    url: "https://www.discosesquecidosleilao.com.br/peca.asp?ID=32243309",
  },
  {
    lot: 195,
    artist: "Renato Russo",
    title: "The Stonewall Celebration Concert — 2LP",
    date: "8 set · 19h",
    condition: "Original brasileiro duplo; capa e discos VG+/NM; avaliação apenas visual",
    currentBid: 60,
    nextBid: 70,
    ceiling: 180,
    priority: "Garimpo principal · 8,5/10",
    tone: "high",
    note: "O original de 1994 aparece anunciado a R$ 800; outras edições usadas ficam por volta de R$ 249–335. Sem venda concluída, o teto continua bem abaixo dos pedidos.",
    url: "https://www.discosesquecidosleilao.com.br/peca.asp?ID=32243370",
  },
];

const auctionEvents: AuctionEvent[] = [
  {
    id: "caverna-vintage-64550",
    house: "Caverna Vintage",
    title: "6º Leilão · equipamentos de som, vinis e fitas K7",
    dates: "31 de agosto · 18h30",
    expiresAt: "2026-09-01T18:30:00-03:00",
    costs: "5% de comissão + frete/embalagem; discos não testados e sem garantia",
    catalogUrl: "https://www.cavernavintage.com.br/catalogo.asp?Num=64550",
    updatedAt: "27 ago 2026 · triagem rápida dos 240 lotes",
    items: cavernaVintageAuctionWatch,
  },
  {
    id: "discos-esquecidos-64691",
    house: "Discos Esquecidos",
    title: "6º Leilão · raridades da MPB e do rock",
    dates: "8 de setembro · 19h",
    expiresAt: "2026-09-09T19:00:00-03:00",
    costs: "5% de comissão + frete/embalagem por conta do arrematante",
    catalogUrl: "https://www.discosesquecidosleilao.com.br/catalogo.asp?Num=64691&Nav=lista&Sec=Catalogo&Pag=1&Srt=0",
    updatedAt: "25 ago 2026",
    items: discosEsquecidosAuctionWatch,
  },

  {
    id: "catavento-discos-64297",
    house: "Catavento Discos",
    title: "61º Leilão · discos, CDs e equipamentos vintage",
    dates: "20 e 21 de agosto · 20h",
    expiresAt: "2026-08-22T20:00:00-03:00",
    costs: "5% de comissão + frete/embalagem",
    catalogUrl: "https://leiloes.cataventodiscos.com.br/catalogo.asp?Num=64297&Nav=lista&Sec=Catalogo&Pag=1&Srt=1&dia=2",
    updatedAt: "21 ago 2026 · 1h07",
    items: cataventoAuctionWatch,
  },
  {
    id: "rt-leiloes-64580",
    house: "RT Leilões",
    title: "LD Colecionismo · Vinis, CDs e DVDs",
    dates: "24, 25 e 26 de agosto · 18h",
    expiresAt: "2026-08-27T18:00:00-03:00",
    costs: "5% de comissão + frete/embalagem",
    catalogUrl: "https://www.rtleiloes.com.br/catalogo.asp?Num=64580&p=on&Dia=&Tipo=&artista=&pesquisa=&Srt=10",
    updatedAt: "24 ago 2026",
    items: rtAuctionWatch,
  },
  {
    id: "trem-das-7-64190",
    house: "Trem das 7",
    title: "140º leilão · vinis dos dias 1 a 5",
    dates: "24 a 28 de agosto · 19h30",
    expiresAt: "2026-08-29T19:30:00-03:00",
    costs: "5% de comissão + frete; embalagem mínima de R$ 5 para etiqueta própria",
    catalogUrl: "https://www.tremdas7.com.br/catalogo.asp?Num=64190&p=on&tipo=%7C129%7C",
    updatedAt: "26 ago 2026 · dia 3 revisado novamente",
    items: tremDasSeteAuctionWatch,
  },
  {
    id: "bruce-angeiras-63353",
    house: "Bruce Angeiras",
    title: "47º Meier · 8º exclusivo de mídias",
    dates: "24, 25 e 26 de agosto · 15h",
    expiresAt: "2026-08-27T15:00:00-03:00",
    costs: "5% de comissão + frete",
    catalogUrl: "https://www.bruceangeirasleiloeiro.com.br/catalogo.asp?Num=63353&fav=1&p=on",
    updatedAt: "20 ago 2026",
    items: auctionWatch,
  },
  {
    id: "alberto-lopes-64516",
    house: "Alberto Lopes",
    title: "18º Leilão Discos da Palmeira",
    dates: "26 e 27 de agosto · 19h",
    expiresAt: "2026-08-28T19:00:00-03:00",
    costs: "5% de comissão + frete/embalagem cobrados depois",
    catalogUrl: "https://www.albertolopesleiloeiro.com.br/catalogo.asp?Num=64516",
    updatedAt: "27 ago 2026 · lotes 528 e 534 adicionados",
    items: albertoLopesAuctionWatch,
  },
  {
    id: "credan-64533",
    house: "Credance Leilões",
    title: "106º · Desapego de colecionador — do rock à MPB 2",
    dates: "27 de agosto · 18h",
    expiresAt: "2026-08-28T18:00:00-03:00",
    costs: "5% de comissão + R$ 6 de embalagem + frete",
    catalogUrl: "https://www.credanceleiloes.com.br/catalogo.asp?Num=64533&Nav=lista&Sec=Catalogo&pag=1&Srt=1",
    updatedAt: "27 ago 2026 · lances e tetos revisados",
    items: credanAuctionWatch,
  },
  {
    id: "acioli-63493",
    house: "Acioli Leilões",
    title: "Grande leilão de vinil · de oportunidades a raridades",
    dates: "27 e 28 de agosto · 19h",
    expiresAt: "2026-08-29T19:00:00-03:00",
    costs: "5% de comissão + frete/embalagem",
    catalogUrl: "https://www.aciolileiloes.com.br/catalogo.asp?Num=63493",
    updatedAt: "23 ago 2026",
    items: acioliAuctionWatch,
  },
];

function auctionGroups(items: AuctionWatch[]) {
  const grouped = new Map<string, AuctionWatch[]>();
  [...items]
    .sort((a, b) => {
      const dateOrder = Number.parseInt(a.date, 10) - Number.parseInt(b.date, 10);
      if (dateOrder) return dateOrder;
      return String(a.lot).localeCompare(String(b.lot), "pt-BR", { numeric: true });
    })
    .forEach((item) => grouped.set(item.date, [...(grouped.get(item.date) ?? []), item]));
  return [...grouped.entries()];
}

function auctionDateKey(label: string, year = 2026) {
  const match = normalize(label).match(/^(\d{1,2})\s+([a-z]{3})/);
  if (!match) return null;
  const month = auctionMonths[match[2]];
  if (!month) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(Number(match[1])).padStart(2, "0")}`;
}

function localDateKey(timestamp: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function shiftDateKey(key: string, days: number) {
  const [year, month, day] = key.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days, 12));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(shifted.getUTCDate()).padStart(2, "0")}`;
}

function auctionDateParts(key: string, todayKey: string) {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date(`${todayKey}T00:00:00`);
  const difference = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date).replace(".", "");
  const monthName = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date).replace(".", "");
  const relation = difference === -2 ? "Anteontem"
    : difference === -1 ? "Ontem"
      : difference === 0 ? "Hoje"
        : difference === 1 ? "Amanhã"
          : weekday;
  return { relation, date: `${day} ${monthName}` };
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function lookupText(value: string) {
  return normalize(value)
    .replace(/\b(disco de vinil|vinil|lp|usado|lacrado)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function wantedMatch(artist: string, title: string) {
  const artistKey = lookupText(artist);
  const titleKey = lookupText(title);
  return preparedWanted.find(({ artistKey: wantedArtist, titleKey: wantedTitle }) =>
    artistKey === wantedArtist
      && (titleKey === wantedTitle || (titleKey.length > 5 && wantedTitle.length > 5
        && (titleKey.includes(wantedTitle) || wantedTitle.includes(titleKey)))))?.item;
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

type MarkedPrice = {
  numeric: number;
  markers: string;
};

function normalizePriceMarkers(value = "") {
  return `${value.includes("*") ? "*" : ""}${value.includes("-") ? "-" : ""}`;
}

function priceMarkerKey(value: number) {
  return String(value);
}

function mergePriceMarkers(...values: Array<string | undefined>) {
  return normalizePriceMarkers(values.filter(Boolean).join(""));
}

function parseMarkedPriceList(value: string): MarkedPrice[] {
  const parsed = new Map<number, string>();
  for (const part of value.split(/[/;]/)) {
    const numeric = Number(part.trim().replace(",", ".").replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(numeric) || numeric <= 0) continue;
    parsed.set(numeric, mergePriceMarkers(parsed.get(numeric), normalizePriceMarkers(part)));
  }
  return [...parsed].map(([numeric, markers]) => ({ numeric, markers }));
}

function priceMarkerMap(entries: MarkedPrice[]) {
  const markers = Object.fromEntries(entries
    .filter((entry) => entry.markers)
    .map((entry) => [priceMarkerKey(entry.numeric), entry.markers]));
  return Object.keys(markers).length ? markers : undefined;
}

function editablePrice(value: number) {
  return String(value).replace(".", ",");
}

function markedPriceInput(values: number[], markers?: Record<string, string>) {
  return [...new Set(values)]
    .map((value) => `${editablePrice(value)}${normalizePriceMarkers(markers?.[priceMarkerKey(value)])}`)
    .join("/");
}

function observationMarkers(item: MarketObservation) {
  const status = normalize(item.status ?? "");
  const condition = normalize(item.condition ?? "");
  const unavailable = /(vendid|esgotad|indisponivel|encerrad)/.test(status);
  const inferior = /(rasgad|avari|danific|estado inferior|capa ruim|mau estado)/.test(condition);
  return `${unavailable ? "*" : ""}${inferior ? "-" : ""}`;
}

function observationDisplay(item: MarketObservation) {
  const base = item.display.replace(/[*-]+\s*$/, "").trim();
  return `${base}${observationMarkers(item)}`;
}

function source(record: CatalogRecord, name: string) {
  const displays = [...new Set(record.market
    .filter((item) => item.source === name)
    .map(observationDisplay))];
  if (!displays.length) return "—";
  if (displays.length === 1) return displays[0];
  return `R$ ${displays.map((display) => display.replace(/^R\$\s*/, "")).join("/")}`;
}

function catalogIdentity(artist: string, title: string) {
  const titleKey = lookupText(title)
    .replace(/\b(2lp|duplo)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return lookupText(artist) + "::" + titleKey;
}

function auctionRecordId(artist: string, title: string) {
  const identity = catalogIdentity(artist, title);
  const slug = identity.replace("::", "-").replace(/\s+/g, "-").slice(0, 150);
  let hash = 2166136261;
  for (let index = 0; index < identity.length; index += 1) {
    hash = Math.imul(hash ^ identity.charCodeAt(index), 16777619);
  }
  return "auction-" + slug + "-" + (hash >>> 0).toString(36);
}

function mergeAuctionWatchIntoCatalog(
  records: CatalogRecord[],
  events: AuctionEvent[],
  deletedIds = new Set<string>(),
) {
  const merged = records.map((record) => ({
    ...record,
    auctionPrices: record.auctionPrices ? [...record.auctionPrices] : undefined,
    auctionWatchPrices: record.auctionWatchPrices ? [...record.auctionWatchPrices] : undefined,
    auctionPriceMarkers: record.auctionPriceMarkers ? { ...record.auctionPriceMarkers } : undefined,
  }));
  const indexes = new Map<string, number>();
  merged.forEach((record, index) => {
    const identity = catalogIdentity(record.artist, record.title);
    if (!indexes.has(identity)) indexes.set(identity, index);
  });
  const deletedIdentities = new Set(baseRecords
    .filter((record) => deletedIds.has(record.id))
    .map((record) => catalogIdentity(record.artist, record.title)));
  let nextSourceRow = Math.max(0, ...merged.map((record) => record.sourceRow)) + 1;

  for (const item of events.flatMap((event) => event.items)) {
    if (!Number.isFinite(item.currentBid) || item.currentBid <= 0) continue;
    const identity = catalogIdentity(item.artist, item.title);
    const generatedId = auctionRecordId(item.artist, item.title);
    if (deletedIdentities.has(identity) || deletedIds.has(generatedId)) continue;
    const recordIndex = indexes.get(identity);
    if (recordIndex === undefined) {
      merged.push({
        id: generatedId,
        sourceRow: nextSourceRow,
        lot: null,
        artist: item.artist,
        title: item.title,
        year: null,
        auctionPrice: item.currentBid,
        auctionWatchPrices: [item.currentBid],
        auctionPriceMarkers: item.currentBidMarkers
          ? { [priceMarkerKey(item.currentBid)]: normalizePriceMarkers(item.currentBidMarkers) }
          : undefined,
        marketMin: null,
        market: [],
        tags: ["Radar de leilão"],
        adornosPrice: null,
      });
      indexes.set(identity, merged.length - 1);
      nextSourceRow += 1;
      continue;
    }

    const record = merged[recordIndex];
    if (record.auctionWatchOverride) continue;
    const previousPrices = record.auctionPrices?.length
      ? record.auctionPrices
      : record.auctionPrice != null
        ? [record.auctionPrice]
        : [];
    const auctionPrices = [...new Set([...previousPrices, item.currentBid])];
    const auctionWatchPrices = [...new Set([...(record.auctionWatchPrices ?? []), item.currentBid])];
    const currentBidMarkers = normalizePriceMarkers(item.currentBidMarkers);
    const auctionPriceMarkers = currentBidMarkers
      ? {
        ...(record.auctionPriceMarkers ?? {}),
        [priceMarkerKey(item.currentBid)]: mergePriceMarkers(
          record.auctionPriceMarkers?.[priceMarkerKey(item.currentBid)],
          currentBidMarkers,
        ),
      }
      : record.auctionPriceMarkers;
    merged[recordIndex] = {
      ...record,
      auctionPrice: record.auctionPriceStatus === "unverified-copy"
        ? record.auctionPrice
        : Math.min(...auctionPrices),
      auctionPrices: auctionPrices.length > 1 ? auctionPrices : undefined,
      auctionWatchPrices,
      auctionPriceMarkers,
    };
  }

  return merged;
}

function mergeCatalogEdits(edits: CatalogEdit[]) {
  const edited = new Map<string, CatalogRecord>();
  const deleted = new Set<string>();
  for (const edit of edits) {
    if (edit.status === "deleted") deleted.add(edit.id);
    else if (edit.record) edited.set(edit.id, edit.record);
  }
  const merged = baseRecords
    .filter((record) => !deleted.has(record.id))
    .map((record) => edited.get(record.id) ?? record);
  const baseIds = new Set(baseRecords.map((record) => record.id));
  for (const edit of edits) {
    if (edit.status === "upserted" && edit.record && !baseIds.has(edit.id) && !deleted.has(edit.id)) {
      merged.push(edit.record);
    }
  }
  return mergeAuctionWatchIntoCatalog(merged, auctionEvents, deleted);
}

function parseNumberList(value: string) {
  return parseMarkedPriceList(value).map((entry) => entry.numeric);
}

function marketPriceInput(record: CatalogRecord, name: string) {
  const entries = new Map<number, string>();
  record.market
    .filter((item) => item.source === name && item.numeric !== null && item.numeric > 0)
    .forEach((item) => entries.set(
      item.numeric!,
      mergePriceMarkers(entries.get(item.numeric!), observationMarkers(item)),
    ));
  return [...entries].map(([numeric, markers]) => `${editablePrice(numeric)}${markers}`).join("/");
}

function recordDraft(record: CatalogRecord): CatalogDraft {
  const years = record.years?.length ? record.years : record.year != null ? [record.year] : [];
  const auction = record.auctionPrices?.length
    ? record.auctionPrices
    : record.auctionPrice != null
      ? [record.auctionPrice]
      : [];
  const auctionSeen = [...new Set([
    ...auction,
    ...(record.auctionWatchPrices ?? []),
    ...record.market
      .filter((item) => item.source === "Leilão observado" && item.numeric !== null && item.numeric > 0)
      .map((item) => item.numeric!),
  ])];
  return {
    id: record.id,
    artist: record.artist,
    title: record.title,
    year: years.join("/"),
    mercadoLivre: marketPriceInput(record, "Mercado Livre"),
    olx: marketPriceInput(record, "OLX"),
    shopee: marketPriceInput(record, "Shopee"),
    leilao: markedPriceInput(auctionSeen, record.auctionPriceMarkers),
    vinylSocialClub: marketPriceInput(record, "Vinyl Social Club"),
    adornos: markedPriceInput(adornosValues(record), record.adornosPriceMarkers),
  };
}

function replaceMarketPrices(market: MarketObservation[], sourceName: string, value: string) {
  const retained = market.filter((item) => item.source !== sourceName);
  const checkedAt = new Date().toISOString().slice(0, 10);
  const additions = parseMarkedPriceList(value).map(({ numeric, markers }) => ({
    source: sourceName,
    display: money(numeric),
    numeric,
    checkedAt,
    status: markers.includes("*") ? "vendido/esgotado" : "editado no site",
    condition: markers.includes("-") ? "avaria relevante" : undefined,
  }));
  return [...retained, ...additions];
}

function recordFromDraft(record: CatalogRecord, draft: CatalogDraft): CatalogRecord {
  const previous = recordDraft(record);
  const auctionChanged = draft.leilao !== previous.leilao;
  const sourceValues: Array<[string, string, keyof CatalogDraft]> = [
    ["Mercado Livre", draft.mercadoLivre, "mercadoLivre"],
    ["OLX", draft.olx, "olx"],
    ["Shopee", draft.shopee, "shopee"],
    ["Vinyl Social Club", draft.vinylSocialClub, "vinylSocialClub"],
  ];
  const updatedMarket = sourceValues.reduce(
    (current, [sourceName, value, field]) => value === previous[field]
      ? current
      : replaceMarketPrices(current, sourceName, value),
    record.market,
  );
  const market = !auctionChanged
    ? updatedMarket
    : updatedMarket.filter((item) => item.source !== "Leilão observado");
  const marketNumbers = market
    .map((item) => item.numeric)
    .filter((value): value is number => value !== null && value > 0);
  const years = parseNumberList(draft.year).map((value) => Math.round(value));
  const markedAuctionPrices = parseMarkedPriceList(draft.leilao);
  const auctionPrices = markedAuctionPrices.map((entry) => entry.numeric);
  const markedAdornosPrices = parseMarkedPriceList(draft.adornos);
  const adornosPrices = markedAdornosPrices.map((entry) => entry.numeric);
  return {
    ...record,
    artist: draft.artist.trim(),
    title: draft.title.trim(),
    year: years[0] ?? null,
    years: years.length > 1 ? years : undefined,
    auctionPrice: auctionPrices.length ? Math.min(...auctionPrices) : null,
    auctionPrices: auctionPrices.length > 1 ? auctionPrices : undefined,
    auctionPriceMarkers: priceMarkerMap(markedAuctionPrices),
    auctionWatchPrices: auctionChanged ? undefined : record.auctionWatchPrices,
    auctionWatchOverride: auctionChanged ? true : record.auctionWatchOverride,
    auctionPriceStatus: undefined,
    market,
    marketMin: marketNumbers.length ? Math.min(...marketNumbers) : null,
    adornosPrice: adornosPrices[0] ?? null,
    adornosPrices: adornosPrices.length > 1 ? adornosPrices : undefined,
    adornosPriceMarkers: priceMarkerMap(markedAdornosPrices),
  };
}

function yearDisplay(record: CatalogRecord) {
  const years = record.years?.length ? record.years : record.year != null ? [record.year] : [];
  return years.length ? years.join("/") : "n/d";
}

function auctionDisplay(record: CatalogRecord) {
  const values = [...new Set([
    ...(record.auctionPrices?.length ? record.auctionPrices : record.auctionPrice != null ? [record.auctionPrice] : []),
    ...(record.auctionWatchPrices ?? []),
    ...record.market
      .filter((item) => item.source === "Leilão observado" && item.numeric !== null && item.numeric > 0)
      .map((item) => item.numeric!),
  ])];
  return values.length ? `R$ ${values.map((value) => `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value)}${normalizePriceMarkers(record.auctionPriceMarkers?.[priceMarkerKey(value)])}`).join("/")}` : "—";
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
  const formatted = values.map((value) => `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0,
  }).format(value)}${normalizePriceMarkers(record.adornosPriceMarkers?.[priceMarkerKey(value)])}`);
  return `R$ ${formatted.join("/")}`;
}

function referencePrice(record: CatalogRecord) {
  // Several rows came from one pasted auction list whose repeated R$ 19 was not
  // tied to a verifiable lot. Keep that historical value visible, but do not let
  // it override a newly researched marketplace price.
  const auctionReferences = record.auctionPriceStatus === "unverified-copy"
    ? record.auctionWatchPrices ?? []
    : record.auctionPrices?.length
      ? record.auctionPrices
      : record.auctionPrice != null
        ? [record.auctionPrice]
        : [];
  const values = [...auctionReferences, record.marketMin, ...adornosValues(record)].filter(
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
  const [records, setRecords] = useState<CatalogRecord[]>(() => mergeAuctionWatchIntoCatalog(baseRecords, auctionEvents));
  const [activeView, setActiveView] = useState<SiteView>("catalogo");
  const [query, setQuery] = useState("");
  const [wantedQuery, setWantedQuery] = useState("");
  const [wantedPriority, setWantedPriority] = useState("todas");
  const [wantedSeparated, setWantedSeparated] = useState<Record<string, boolean>>({});
  const [copyFeedback, setCopyFeedback] = useState("");
  const [decade, setDecade] = useState("todas");
  const [coverage, setCoverage] = useState("todos");
  const [sort, setSort] = useState("artista");
  const [offers, setOffers] = useState<Record<string, string>>({});
  const [clock, setClock] = useState(() => Date.now());
  const [selectedAuctionDate, setSelectedAuctionDate] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorSession | null>(null);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [inlineValue, setInlineValue] = useState("");
  const [editingRecord, setEditingRecord] = useState<CatalogRecord | null>(null);
  const [draft, setDraft] = useState<CatalogDraft | null>(null);
  const [savingRecord, setSavingRecord] = useState(false);
  const [editorFeedback, setEditorFeedback] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadCatalogEdits() {
      try {
        const response = await fetch("/api/catalog", { cache: "no-store" });
        const data = await response.json() as {
          edits?: CatalogEdit[];
          editor?: EditorSession;
          error?: string;
        };
        if (!response.ok) throw new Error(data.error ?? "Não foi possível carregar as edições.");
        if (cancelled) return;
        setRecords(mergeCatalogEdits(data.edits ?? []));
        setEditor(data.editor ?? { signedIn: false, canEdit: false, email: null });
      } catch {
        if (cancelled) return;
        setEditor({ signedIn: false, canEdit: false, email: null });
        setEditorFeedback("A consulta continua disponível, mas a edição online está temporariamente indisponível.");
      }
    }
    loadCatalogEdits();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const syncViewFromHash = () => setActiveView(window.location.hash === "#marcio-candido" ? "marcio" : "catalogo");
    syncViewFromHash();
    window.addEventListener("hashchange", syncViewFromHash);
    return () => window.removeEventListener("hashchange", syncViewFromHash);
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("preco-de-disco-ofertas");
      if (saved) setOffers(JSON.parse(saved));
      const savedWanted = window.localStorage.getItem("preco-de-disco-procuras-separadas");
      if (savedWanted) setWantedSeparated(JSON.parse(savedWanted));
    } catch { /* preferência local opcional */ }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("preco-de-disco-ofertas", JSON.stringify(offers));
    } catch { /* preferência local opcional */ }
  }, [offers]);

  useEffect(() => {
    try {
      window.localStorage.setItem("preco-de-disco-procuras-separadas", JSON.stringify(wantedSeparated));
    } catch { /* preferência local opcional */ }
  }, [wantedSeparated]);
  useEffect(() => {
    const updateClock = () => setClock(Date.now());
    updateClock();
    const timer = window.setInterval(updateClock, 86_400_000);
    return () => window.clearInterval(timer);
  }, []);


  const decades = useMemo(
    () => [...new Set(records.flatMap((record) => record.year ? [Math.floor(record.year / 10) * 10] : []))].sort(),
    [records],
  );

  const filtered = useMemo(() => {
    if (activeView !== "catalogo") return [];
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
  }, [activeView, query, decade, coverage, sort, offers, records]);

  const comparedCount = Object.values(offers).filter(Boolean).length;
  const separatedCount = Object.values(wantedSeparated).filter(Boolean).length;

  const filteredWanted = useMemo(() => {
    if (activeView !== "marcio") return [];
    const needle = lookupText(wantedQuery);
    return wantedItems.filter((item) => {
      const matchesQuery = !needle || lookupText(item.artist + " " + item.title).includes(needle);
      const matchesPriority = wantedPriority === "todas" || item.priority === wantedPriority;
      return matchesQuery && matchesPriority;
    });
  }, [activeView, wantedPriority, wantedQuery]);

  async function copySeparated() {
    const selected = wantedItems.filter((item) => wantedSeparated[item.id]);
    if (!selected.length) {
      setCopyFeedback("Marque os discos que você separou");
      return;
    }
    try {
      await navigator.clipboard.writeText(selected.map((item) => item.artist + " — " + item.title).join("\n"));
      setCopyFeedback(selected.length + (selected.length === 1 ? " disco copiado" : " discos copiados"));
    } catch {
      setCopyFeedback("Não foi possível copiar neste navegador");
    }
  }

  function selectView(view: SiteView) {
    setActiveView(view);
    const hash = view === "marcio" ? "#marcio-candido" : "";
    window.history.replaceState(null, "", window.location.pathname + window.location.search + hash);
    window.scrollTo({ top: 0 });
  }

  function beginCellEdit(record: CatalogRecord, field: EditableCatalogField) {
    if (!editor?.canEdit || savingRecord) return;
    setEditingCell({ recordId: record.id, field });
    setInlineValue(String(recordDraft(record)[field]));
    setEditorFeedback("");
  }

  function cancelEdit() {
    setEditingCell(null);
    setInlineValue("");
    setEditingRecord(null);
    setDraft(null);
  }

  function updateDraft(field: keyof CatalogDraft, value: string) {
    setDraft((current) => current ? { ...current, [field]: value } : current);
  }

  function addRecord() {
    const newRecord: CatalogRecord = {
      id: `site-${crypto.randomUUID()}`,
      sourceRow: Math.max(0, ...records.map((record) => record.sourceRow)) + 1,
      lot: null,
      artist: "",
      title: "",
      year: null,
      auctionPrice: null,
      marketMin: null,
      market: [],
      tags: [],
      adornosPrice: null,
    };
    setEditingRecord(newRecord);
    setDraft(recordDraft(newRecord));
    setEditorFeedback("Novo disco: preencha artista e álbum.");
  }

  async function saveInlineCell(cell: EditingCell, value: string) {
    if (savingRecord) return;
    const record = records.find((item) => item.id === cell.recordId);
    if (!record) return;
    const currentDraft = recordDraft(record);
    if (value === String(currentDraft[cell.field])) {
      setEditingCell(null);
      setInlineValue("");
      return;
    }
    const nextDraft = { ...currentDraft, [cell.field]: value };
    if (!nextDraft.artist.trim() || !nextDraft.title.trim()) {
      setEditorFeedback("Artista e álbum não podem ficar vazios.");
      return;
    }
    const savedRecord = recordFromDraft(record, nextDraft);
    setEditingCell(null);
    setInlineValue("");
    setSavingRecord(true);
    setEditorFeedback("Salvando...");
    try {
      const response = await fetch("/api/catalog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: savedRecord.id, status: "upserted", record: savedRecord }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Não foi possível salvar.");
      setRecords((current) => current.map((item) => item.id === savedRecord.id ? savedRecord : item));
      setEditorFeedback("Alteração salva online.");
    } catch (error) {
      setEditorFeedback(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSavingRecord(false);
    }
  }

  function inlineCell(
    record: CatalogRecord,
    field: EditableCatalogField,
    display: ReactNode,
    className = "",
    inputMode?: "text" | "numeric" | "decimal",
  ) {
    const active = editingCell?.recordId === record.id && editingCell.field === field;
    const editable = Boolean(editor?.canEdit);
    return (
      <td
        className={[className, editable ? "inline-editable-cell" : "", active ? "inline-editing-cell" : ""].filter(Boolean).join(" ") || undefined}
        onClick={() => !active && beginCellEdit(record, field)}
        onKeyDown={(event) => {
          if (!active && editable && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            beginCellEdit(record, field);
          }
        }}
        tabIndex={editable && !active ? 0 : undefined}
        title={editable ? "Clique para editar" : undefined}
      >
        {active ? (
          <input
            ref={(element) => {
              if (element && document.activeElement !== element) element.focus();
            }}
            className="inline-cell-input"
            inputMode={inputMode}
            value={inlineValue}
            onChange={(event) => setInlineValue(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onBlur={() => saveInlineCell({ recordId: record.id, field }, inlineValue)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                saveInlineCell({ recordId: record.id, field }, inlineValue);
              } else if (event.key === "Escape") {
                event.preventDefault();
                setEditingCell(null);
                setInlineValue("");
              }
            }}
            aria-label={"Editar " + field + " de " + record.artist + " — " + record.title}
          />
        ) : display}
      </td>
    );
  }

  async function saveDraft() {
    if (!draft || !editingRecord || savingRecord) return;
    if (!draft.artist.trim() || !draft.title.trim()) {
      setEditorFeedback("Preencha artista e álbum antes de salvar.");
      return;
    }
    const savedRecord = recordFromDraft(editingRecord, draft);
    setSavingRecord(true);
    setEditorFeedback("Salvando...");
    try {
      const response = await fetch("/api/catalog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: savedRecord.id, status: "upserted", record: savedRecord }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Não foi possível salvar.");
      setRecords((current) => current.some((record) => record.id === savedRecord.id)
        ? current.map((record) => record.id === savedRecord.id ? savedRecord : record)
        : [...current, savedRecord]);
      setEditingRecord(null);
      setDraft(null);
      setEditorFeedback("Alteração salva online.");
    } catch (error) {
      setEditorFeedback(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSavingRecord(false);
    }
  }

  async function deleteEditingRecord() {
    if (!editingRecord || savingRecord) return;
    if (!records.some((record) => record.id === editingRecord.id)) {
      cancelEdit();
      return;
    }
    if (!window.confirm(`Excluir ${editingRecord.artist} — ${editingRecord.title} da tabela?`)) return;
    setSavingRecord(true);
    setEditorFeedback("Excluindo...");
    try {
      const response = await fetch("/api/catalog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingRecord.id, status: "deleted" }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Não foi possível excluir.");
      setRecords((current) => current.filter((record) => record.id !== editingRecord.id));
      setEditingRecord(null);
      setDraft(null);
      setEditorFeedback("Disco excluído da tabela.");
    } catch (error) {
      setEditorFeedback(error instanceof Error ? error.message : "Não foi possível excluir.");
    } finally {
      setSavingRecord(false);
    }
  }

  function openAuctions() {
    selectView("catalogo");
    window.requestAnimationFrame(() => document.getElementById("proximos-leiloes")?.scrollIntoView({ behavior: "smooth" }));
  }

  const todayAuctionKey = localDateKey(clock);
  const earliestAuctionKey = shiftDateKey(todayAuctionKey, -2);
  const visibleAuctionEvents = useMemo(() => auctionEvents.filter((event) =>
    event.items.some((item) => {
      const date = auctionDateKey(item.date);
      return date !== null && date >= earliestAuctionKey;
    })), [earliestAuctionKey]);
  const availableAuctionDates = useMemo(() => [...new Set(visibleAuctionEvents
    .flatMap((event) => event.items.map((item) => auctionDateKey(item.date)))
    .filter((date): date is string => Boolean(date) && date >= earliestAuctionKey))]
    .sort(), [earliestAuctionKey, visibleAuctionEvents]);
  const defaultAuctionDate = availableAuctionDates.includes(todayAuctionKey)
    ? todayAuctionKey
    : availableAuctionDates.find((date) => date > todayAuctionKey)
      ?? availableAuctionDates.at(-1)
      ?? null;
  const activeAuctionDate = selectedAuctionDate && availableAuctionDates.includes(selectedAuctionDate)
    ? selectedAuctionDate
    : defaultAuctionDate;
  const datedAuctionEvents = useMemo(() => activeAuctionDate === null ? [] : visibleAuctionEvents
    .map((event) => ({
      ...event,
      items: event.items.filter((item) => auctionDateKey(item.date) === activeAuctionDate),
    }))
    .filter((event) => event.items.length > 0), [activeAuctionDate, visibleAuctionEvents]);
  const auctionWatchCount = datedAuctionEvents.reduce((total, event) => total + event.items.length, 0);

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
          <button className="status-link" type="button" onClick={() => selectView("marcio")}><b>{wantedItems.length}</b> para Márcio</button>
          <button className="status-link" type="button" onClick={openAuctions}><b>{auctionWatchCount}</b> em leilão</button>
        </div>
      </header>

      <nav className="site-tabs" aria-label="Áreas do site">
        <button type="button" className={activeView === "catalogo" ? "active" : ""} aria-pressed={activeView === "catalogo"} onClick={() => selectView("catalogo")}>
          Preços e leilões
        </button>
        <button type="button" className={activeView === "marcio" ? "active" : ""} aria-pressed={activeView === "marcio"} onClick={() => selectView("marcio")}>
          Procuras · Márcio Cândido <b>{wantedItems.length}</b>
        </button>
      </nav>

      <section className="intro" hidden={activeView !== "catalogo"}>
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

      <section className="wanted-watch" id="marcio-candido" aria-labelledby="wanted-title" hidden={activeView !== "marcio"}>
        <div className="wanted-heading">
          <div>
            <p className="kicker">Cliente · fila de procura</p>
            <h2 id="wanted-title">Márcio Cândido</h2>
            <p>132 títulos pendentes para encontrar. A+ vem primeiro; marque “separei” quando localizar uma cópia e copie a seleção para enviar ao Márcio.</p>
          </div>
          <div className="wanted-summary" aria-label="Resumo das prioridades">
            <span><b>{wantedItems.filter((item) => item.priority === "A+").length}</b> A+</span>
            <span><b>{wantedItems.filter((item) => item.priority === "A").length}</b> A</span>
            <span><b>{wantedItems.filter((item) => item.priority === "B").length}</b> B</span>
            <span><b>{separatedCount}</b> separados</span>
          </div>
        </div>

        <div className="wanted-panel">
          <div className="wanted-controls">
            <label className="wanted-search">
              <span className="sr-only">Buscar na lista de procuras</span>
              <input
                type="search"
                value={wantedQuery}
                onChange={(event) => setWantedQuery(event.target.value)}
                placeholder="Buscar artista ou álbum na lista..."
              />
              {wantedQuery && <button type="button" onClick={() => setWantedQuery("")} aria-label="Limpar busca da lista">×</button>}
            </label>
            <label className="wanted-priority">
              <span>Prioridade</span>
              <select value={wantedPriority} onChange={(event) => setWantedPriority(event.target.value)}>
                <option value="todas">Todas</option>
                <option value="A+">A+</option>
                <option value="A">A</option>
                <option value="B">B</option>
              </select>
            </label>
            <button className="wanted-copy" type="button" onClick={copySeparated}>
              Copiar separados <b>{separatedCount}</b>
            </button>
          </div>

          <div className="wanted-result">
            <span><b>{filteredWanted.length}</b> na lista</span>
            <span aria-live="polite">{copyFeedback}</span>
          </div>

          <div className="wanted-list-head" aria-hidden="true">
            <span>Separei</span><span>Prioridade</span><span>Artista</span><span>Álbum</span>
          </div>
          <div className="wanted-list">
            {activeView === "marcio" && filteredWanted.map((item) => {
              const separated = Boolean(wantedSeparated[item.id]);
              return (
                <article className={"wanted-row" + (separated ? " separated" : "")} key={item.id}>
                  <label className="wanted-check">
                    <input
                      type="checkbox"
                      checked={separated}
                      onChange={(event) => setWantedSeparated((current) => ({ ...current, [item.id]: event.target.checked }))}
                      aria-label={"Marcar como separado: " + item.artist + " — " + item.title}
                    />
                    <span>{separated ? "Sim" : "Não"}</span>
                  </label>
                  <strong className={"wanted-badge priority-" + item.priority.replace("+", "plus")}>{item.priority}</strong>
                  <span className="wanted-artist">{item.artist}</span>
                  <span className="wanted-title">{item.title}</span>

                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="auction-watch" id="proximos-leiloes" aria-labelledby="auction-title" hidden={activeView !== "catalogo"}>
        <div className="auction-heading">
          <div>
            <p className="kicker">Radar de oportunidades</p>
            <h2 id="auction-title">Próximos leilões</h2>
            <p>Os discos que você escolheu acompanhar, com o custo do próximo lance já acrescido da comissão e um teto prático para não se empolgar. Hoje abre marcado; ontem e anteontem continuam disponíveis para consulta.</p>
          </div>
        </div>

        <div className="auction-date-tabs" role="tablist" aria-label="Datas dos próximos leilões">
          {availableAuctionDates.map((dateKey) => {
            const label = auctionDateParts(dateKey, todayAuctionKey);
            const active = dateKey === activeAuctionDate;
            return (
              <button
                type="button"
                role="tab"
                aria-selected={active}
                className={active ? "active" : ""}
                key={dateKey}
                onClick={() => setSelectedAuctionDate(dateKey)}
              >
                <strong>{label.relation}</strong>
                <span>{label.date}</span>
              </button>
            );
          })}
        </div>

        <div className="auction-windows">
          {activeView === "catalogo" && datedAuctionEvents.map((event) => (
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
                        <span className="auction-price-head"><i>Lance</i><i>Próximo</i><i>Próximo + 5%</i><i>Teto</i></span>
                        <span>Leitura</span><span />
                      </div>
                      <div className="auction-list">
                        {items.map((item) => {
                          const withCommission = item.nextBid * 1.05;
                          const wanted = wantedMatch(item.artist, item.title);
                          return (
                            <article className={`auction-row ${item.tone}`} key={item.lot}>
                              <div className="auction-lot"><span>Lote</span><b>{item.lot}</b></div>
                              <div className="auction-record">
                                <h3>{item.artist}<span>{item.title}</span></h3>
                                {wanted && (
                                  <em className="wanted-hit">Procura Márcio · {wanted.priority}</em>
                                )}
                                <p title={item.condition}>{item.condition}</p>
                                <small title={item.note}>{item.note}</small>
                              </div>
                              <dl className="auction-row-prices">
                                <div><dt>{item.bidLabel ?? "Lance"}</dt><dd>{money(item.currentBid)}</dd></div>
                                <div><dt>Próximo</dt><dd>{money(item.nextBid)}</dd></div>
                                <div><dt>Próximo + 5%</dt><dd>{exactMoney(withCommission)}</dd></div>
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
                  <p>A coluna “Próximo + 5%” usa sempre o próximo lance. Antes de ofertar, confirme também frete e embalagem.</p>
                  <a href={event.catalogUrl} target="_blank" rel="noreferrer">Abrir este leilão <span aria-hidden="true">↗</span></a>
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="controls" id="catalogo" aria-label="Busca e filtros" hidden={activeView !== "catalogo"}>
        <label className="search-box">
          <span className="search-symbol" aria-hidden="true" />
          <span className="sr-only">Buscar disco</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Artista, álbum ou ano..."
          />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Limpar busca">×</button>}
        </label>
        <label><span>Década</span><select value={decade} onChange={(event) => setDecade(event.target.value)}><option value="todas">Todas</option>{decades.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label><span>Mostrar</span><select value={coverage} onChange={(event) => setCoverage(event.target.value)}><option value="todos">Tudo</option><option value="com-referencia">Com referência</option><option value="adornos">Com preço Adornos</option><option value="mercado">Com pesquisa de mercado</option><option value="sem-referencia">Sem referência</option><option value="com-oferta">Minhas comparações</option></select></label>
        <label><span>Ordenar</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="artista">Artista A–Z</option><option value="album">Álbum A–Z</option><option value="planilha">Ordem original</option><option value="ano">Ano recente</option><option value="referencia-menor">Menor referência</option><option value="referencia-maior">Maior referência</option><option value="melhor-oferta">Melhor negócio</option></select></label>
      </section>

      <section className="catalog-editor" aria-label="Edição da tabela" hidden={activeView !== "catalogo"}>
        <div className="catalog-editor-status">
          <div>
            <strong>Tabela online</strong>
            <span>{editor?.canEdit ? `Clique em uma célula para editar · ${editor.email}` : "Consulta pública · edição protegida"}</span>
          </div>
          <div className="catalog-editor-actions">
            <span aria-live="polite">{editorFeedback}</span>
            {editor?.canEdit ? (
              <button className="editor-add" type="button" onClick={addRecord}>+ Novo disco</button>
            ) : editor?.signedIn ? (
              <span className="editor-denied">Conta sem permissão de edição</span>
            ) : editor ? (
              <a className="editor-signin" href="/signin-with-chatgpt?return_to=%2F">Entrar para editar</a>
            ) : (
              <span className="editor-loading">Verificando acesso...</span>
            )}
          </div>
        </div>

        {draft && editingRecord && (
          <form
            className="catalog-editor-panel"
            id="catalog-editor-panel"
            onSubmit={(event) => { event.preventDefault(); saveDraft(); }}
          >
            <header>
              <div>
                <span>{records.some((record) => record.id === editingRecord.id) ? "Editando disco" : "Novo disco"}</span>
                <strong>{draft.artist || "Artista"} — {draft.title || "Álbum"}</strong>
              </div>
              <button type="button" onClick={cancelEdit} aria-label="Fechar edição">×</button>
            </header>
            <div className="catalog-editor-fields">
              <label className="editor-field-wide"><span>Artista</span><input value={draft.artist} onChange={(event) => updateDraft("artist", event.target.value)} /></label>
              <label className="editor-field-wide"><span>Álbum / edição</span><input value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} /></label>
              <label><span>Ano</span><input inputMode="numeric" placeholder="1989" value={draft.year} onChange={(event) => updateDraft("year", event.target.value)} /></label>
              <label><span>Mercado Livre</span><input inputMode="text" placeholder="60/80*" value={draft.mercadoLivre} onChange={(event) => updateDraft("mercadoLivre", event.target.value)} /></label>
              <label><span>OLX</span><input inputMode="text" placeholder="60/80*" value={draft.olx} onChange={(event) => updateDraft("olx", event.target.value)} /></label>
              <label><span>Shopee</span><input inputMode="text" placeholder="60/80*" value={draft.shopee} onChange={(event) => updateDraft("shopee", event.target.value)} /></label>
              <label><span>Leilão visto</span><input inputMode="text" placeholder="20/55*-" value={draft.leilao} onChange={(event) => updateDraft("leilao", event.target.value)} /></label>
              <label><span>VSC / outras lojas</span><input inputMode="text" placeholder="59*" value={draft.vinylSocialClub} onChange={(event) => updateDraft("vinylSocialClub", event.target.value)} /></label>
              <label><span>Adornos</span><input inputMode="text" placeholder="148/189" value={draft.adornos} onChange={(event) => updateDraft("adornos", event.target.value)} /></label>
            </div>
            <p className="price-marker-help"><strong>*</strong> vendido, esgotado ou indisponível · <strong>-</strong> avaria ou estado inferior relevante · exemplo: 55*-</p>
            <footer>
              <div>
                {records.some((record) => record.id === editingRecord.id) && (
                  <button className="editor-delete" type="button" onClick={deleteEditingRecord} disabled={savingRecord}>Excluir</button>
                )}
              </div>
              <div>
                <button className="editor-cancel" type="button" onClick={cancelEdit} disabled={savingRecord}>Cancelar</button>
                <button className="editor-save" type="submit" disabled={savingRecord}>{savingRecord ? "Salvando..." : "Salvar online"}</button>
              </div>
            </footer>
          </form>
        )}
      </section>

      <div className="result-line" hidden={activeView !== "catalogo"}>
        <strong>{filtered.length}</strong> {filtered.length === 1 ? "disco encontrado" : "discos encontrados"}
        <span>Referência = menor valor registrado entre leilão, pesquisa e Adornos</span>
      </div>

      <section className="table-shell" aria-label="Lista de preços de discos" hidden={activeView !== "catalogo"}>
        <table>
          <thead>
            <tr>
              <th className="col-index">#</th>
              <th className="col-artist">Artista</th>
              <th className="col-album">Álbum / edição</th>
              <th>Ano</th>
              <th>Mercado Livre</th>
              <th>OLX</th>
              <th>Shopee</th>
              <th>Leilão visto</th>
              <th>VSC / outras lojas</th>
              <th className="adornos-head">Adornos</th>
              <th className="reference-head">Referência</th>
              <th className="offer-head">Preço encontrado</th>
              <th className="verdict-head">Avaliação</th>
            </tr>
          </thead>
          <tbody>
            {activeView === "catalogo" && filtered.map((record, index) => {
              const reference = referencePrice(record);
              const offerText = offers[record.id] ?? "";
              const parsedOffer = offerText ? Number(offerText.replace(",", ".")) : null;
              const validOffer = parsedOffer !== null && Number.isFinite(parsedOffer) && parsedOffer >= 0 ? parsedOffer : null;
              const result = assessment(validOffer, reference);
              const rowClass = [
                offerText ? `compared ${result.tone}` : "",
                editingCell?.recordId === record.id ? "editing-row" : "",
              ].filter(Boolean).join(" ") || undefined;
              return (
                <tr key={record.id} className={rowClass}>
                  <td className="row-number">{index + 1}</td>
                  {inlineCell(record, "artist", record.artist, "artist-cell", "text")}
                  {inlineCell(record, "title", <>{record.title}{record.tags.length > 0 && <small>{record.tags.join(" · ")}</small>}</>, "album-cell", "text")}
                  {inlineCell(record, "year", yearDisplay(record), record.year === null && !record.years?.length ? "missing" : "", "numeric")}
                  {inlineCell(record, "mercadoLivre", source(record, "Mercado Livre"), "price-source", "text")}
                  {inlineCell(record, "olx", source(record, "OLX"), "price-source", "text")}
                  {inlineCell(record, "shopee", source(record, "Shopee"), "price-source", "text")}
                  {inlineCell(record, "leilao", auctionDisplay(record), "money-cell", "text")}
                  {inlineCell(record, "vinylSocialClub", source(record, "Vinyl Social Club"), "price-source", "text")}
                  {inlineCell(record, "adornos", adornosDisplay(record), "adornos-cell", "text")}
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
        <span className="footer-price-legend"><b>*</b> = vendido, esgotado ou anúncio indisponível<br /><b>-</b> = exemplar com avaria/estado inferior</span>
        <span>Alterações autorizadas na tabela ficam salvas online.</span>
      </footer>
    </main>
  );
}
